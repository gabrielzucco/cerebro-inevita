#!/usr/bin/env node

import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { createExecutionTracer } from './lib/execution-trace-runtime.mjs';
import {
  buildBrainGraph,
  buildRunGraph,
  buildSystemGraph,
  deriveTraceTiming,
  graphForLayout,
} from './lib/graph-read-model.mjs';
import { registerHandoffContract } from './lib/handoff-protocol.mjs';
import { registerRoutineContract, writeRoutineRunReceipt } from './lib/routine-protocol.mjs';
import { appendRunRecord } from './lib/system-protocol.mjs';

const root = mkdtempSync(join(tmpdir(), 'graph-read-model-'));

function write(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, typeof value === 'string' ? value : `${JSON.stringify(value, null, 2)}\n`);
}

function example(name) {
  return JSON.parse(readFileSync(new URL(`../protocol/examples/${name}`, import.meta.url), 'utf8'));
}

try {
  write(join(root, '.cerebro', 'layout.json'), {
    version: 3,
    systemContracts: '.cerebro/contracts/systems',
    sourceContracts: '.cerebro/contracts/sources',
    routineContracts: '.cerebro/contracts/routines',
    routineReceipts: '.cerebro/runtime/receipts/routines',
    runLedger: '.cerebro/runtime/ledger/runs.jsonl',
    executionTraces: '.cerebro/runtime/traces',
    canvasLayouts: '.cerebro/runtime/canvas-layouts',
    handoffContracts: '.cerebro/contracts/handoffs',
    handoffReceipts: '.cerebro/runtime/receipts/handoffs'
  });
  const source = example('source-contract.v1.json');
  write(join(root, '.cerebro', 'contracts', 'sources', `${source.source_id}.json`), {
    ...source,
    name: 'Métricas reais do funil',
  });
  const funilSystem = example('system-contract.v2.json');
  funilSystem.artifacts.consumes = funilSystem.artifacts.consumes.map((item) => ({ ...item, required: true }));
  write(join(root, '.cerebro', 'contracts', 'systems', 'analisar-funil.json'), funilSystem);
  const contentSystem = {
    ...structuredClone(funilSystem), system_id: 'conteudo', name: 'Sistema de Conteúdo',
    result: { ...funilSystem.result, output_type: 'creative-brief' },
    capability: { ...funilSystem.capability, capability_id: 'criar-briefing' },
    artifacts: { produces: [{
      role: 'briefing-editorial', artifact_type: 'creative-brief',
      schema_ref: 'protocol/artifacts/creative-brief.schema.json', schema_version: '1.0.0', sensitivity: 'private',
    }], consumes: [] },
  };
  write(join(root, '.cerebro', 'contracts', 'systems', 'conteudo.json'), contentSystem);
  const handoff = example('handoff-contract.v1.json');
  registerHandoffContract(root, handoff);
  const routine = example('routine-contract.v1.json');
  registerRoutineContract(root, {
    ...routine,
    extensions: {
      preparation: {
        kind: 'trusted-local-command',
        binding_ref: 'collector-funil-local',
        output_ref: '.automacao/_FUNIL-ULTIMO.json',
      },
    },
  });

  const receipt = example('routine-run-receipt.v1.json');
  writeRoutineRunReceipt(root, receipt);
  const record = {
    ...example('run-record.v2.json'),
    run_id: receipt.run_id,
    started_at: receipt.started_at,
    completed_at: receipt.completed_at,
    chain_id: 'chain-graph-test-001',
    mode: 'replay',
    experiment_ref: 'EXP-GRAPH-001',
    handoff_refs: [`handoff-contract:${handoff.handoff_id}`],
  };
  appendRunRecord(root, record);
  const producerRun = {
    ...structuredClone(record), run_id: 'run-content-graph-test-001', system_id: 'conteudo',
    capability: { capability_id: 'criar-briefing', version: contentSystem.capability.version },
    output_refs: ['.cerebro/runtime/outputs/briefing-graph-test.json'],
  };
  appendRunRecord(root, producerRun);
  write(join(root, '.cerebro', 'runtime', 'receipts', 'handoffs', 'handoff-graph-test-001.json'), {
    ...example('handoff-receipt.v1.json'), receipt_id: 'handoff-graph-test-001',
    handoff_ref: handoff.handoff_id, chain_id: record.chain_id, mode: 'replay',
    experiment_ref: record.experiment_ref, producer_run_ref: `run-record:${producerRun.run_id}`,
    artifact: {
      ...example('handoff-receipt.v1.json').artifact,
      artifact_ref: producerRun.output_refs[0],
    },
    consumer_run_ref: `run-record:${record.run_id}`,
  });

  const system = buildSystemGraph(root, 'analisar-funil');
  assert.equal(system.graph_type, 'system');
  assert(system.nodes.some((node) => node.id === 'retrieval'));
  assert(system.nodes.some((node) => node.id === 'gate:1'));
  assert.equal(system.nodes.filter((node) => node.kind === 'stage').length, 2);
  assert(system.nodes.some((node) => node.id === 'artifact-contract:produce:leitura-funil'));
  assert(system.nodes.some((node) => node.id === 'artifact-contract:consume:experiment-brief'));
  assert.equal(system.nodes.find((node) => node.id === `source:${source.source_id}`)?.label, 'Métricas reais do funil');

  const reconstructed = buildRunGraph(root, receipt.receipt_id);
  assert.equal(reconstructed.trace_origin, 'reconstructed');
  assert.equal(reconstructed.nodes.find((node) => node.id === 'capability').state, 'completed');
  assert.equal(reconstructed.nodes.find((node) => node.id === 'gate:1').state, 'completed');

  const tracer = createExecutionTracer(root, {
    runId: receipt.run_id,
    systemRef: receipt.system_ref,
    routineRef: receipt.routine_ref,
    clock: () => new Date('2026-08-24T10:00:00.000Z'),
  });
  const contextRef = 'context-artifact:sha256-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
  const collectorRef = 'collector-output:.automacao/_FUNIL-ULTIMO.json';
  const deliveryRef = '.cerebro/runtime/outputs/routines/funil-diario.md';
  tracer.emit({
    stepId: 'run', stepType: 'run', state: 'running', parentStepId: null,
    inputRefs: ['operacao/rotinas/funil-diario.prompt.md'],
  });
  tracer.emit({
    stepId: 'collector', stepType: 'collector', state: 'running',
    inputRefs: ['collector-funil-local'],
  });
  tracer.emit({ stepId: 'collector', stepType: 'collector', state: 'completed', outputRefs: [collectorRef] });
  tracer.emit({ stepId: 'retrieval', stepType: 'retrieval', state: 'completed', outputRefs: [contextRef] });
  tracer.emit({
    stepId: 'capability', stepType: 'capability', state: 'completed',
    inputRefs: [collectorRef, contextRef],
  });
  tracer.emit({ stepId: 'output', stepType: 'output', state: 'completed', outputRefs: [deliveryRef] });
  tracer.emit({
    stepId: 'eval', stepType: 'eval', state: 'failed', reasonCode: 'evaluation-gate-failed',
    extensions: { gate_results: [
      { gate_id: 'claims', passed: true, not_applicable: false, issue_count: 0 },
      { gate_id: 'external-action', passed: false, not_applicable: false, issue_count: 1 },
    ] },
  });
  tracer.emit({ stepId: 'judgment', stepType: 'judgment', state: 'pending', inputRefs: [deliveryRef] });
  tracer.emit({ stepId: 'run', stepType: 'run', state: 'completed', parentStepId: null });

  const recorded = buildRunGraph(root, receipt.receipt_id);
  assert.equal(recorded.trace_origin, 'recorded');
  assert.equal(recorded.trace_events, 9);
  assert.equal(recorded.trace_timing.assurance, 'event-derived');
  assert.equal(recorded.trace_timeline.every((event) => Number.isInteger(event.elapsed_ms)), true);
  assert.equal(recorded.nodes.find((node) => node.id === 'collector').details.duration_ms, 0);
  assert.equal(recorded.nodes.find((node) => node.id === 'collector').state, 'completed');
  assert.equal(recorded.nodes.find((node) => node.id === 'gate:1').state, 'completed');
  assert.equal(recorded.nodes.find((node) => node.id === 'gate:2').state, 'failed');
  assert(recorded.nodes.some((node) => node.kind === 'artifact' && node.details.artifact_type === 'instruction' && node.actual));
  assert(recorded.nodes.some((node) => node.kind === 'artifact' && node.details.artifact_type === 'collector-output' && node.actual));
  assert(recorded.nodes.some((node) => node.kind === 'artifact' && node.details.artifact_type === 'context-snapshot' && node.actual));
  assert(recorded.nodes.some((node) => node.kind === 'artifact' && node.details.artifact_type === 'deliverable' && node.actual));
  assert(recorded.edges.some((edge) => edge.relation === 'consumed-by' && edge.target === 'capability' && edge.actual));
  assert(recorded.edges.some((edge) => edge.relation === 'awaits-judgment' && edge.target === 'judgment' && edge.actual));
  assert.equal(recorded.run.chain_id, 'chain-graph-test-001');
  assert(recorded.nodes.some((node) => node.kind === 'run' && node.details.run_id === producerRun.run_id));
  assert(recorded.nodes.some((node) => node.kind === 'artifact'
    && node.details.handoff_receipt_ref === 'handoff-receipt:handoff-graph-test-001'));
  assert(recorded.edges.some((edge) => edge.relation === 'hands-off' && edge.actual));
  const brain = buildBrainGraph(root);
  assert(brain.nodes.some((node) => node.kind === 'handoff' && node.actual));
  assert(brain.edges.some((edge) => edge.relation === 'produces-handoff' && edge.actual));
  const standalone = buildRunGraph(root, `run-record:${producerRun.run_id}`);
  assert.equal(standalone.run.canonical_ref, `run-record:${producerRun.run_id}`);
  assert.equal(standalone.run.routine_receipt_ref, null);
  assert.equal(standalone.nodes.find((node) => node.id === 'judgment').state, 'completed');
  assert.equal(standalone.nodes.find((node) => node.id === 'gate:1').state, 'completed');
  assert(standalone.nodes.some((node) => node.kind === 'artifact'
    && node.label === 'Entrega · Briefing Graph Test'));
  assert.equal(graphForLayout(root, `run-${producerRun.run_id}`).graph_ref, producerRun.run_id);
  assert.equal(graphForLayout(root, `run-${receipt.run_id}`).graph_ref, receipt.run_id);
  assert.equal(JSON.stringify(recorded).includes('PRIVATE'), false);

  const at = (sequence, stepId, stepType, state, elapsedMs, parentStepId = 'run') => ({
    sequence, step_id: stepId, step_type: stepType, state,
    occurred_at: new Date(Date.parse('2026-08-24T10:00:00.000Z') + elapsedMs).toISOString(),
    parent_step_id: stepId === 'run' ? null : parentStepId,
    source_ref: null, skill_ref: null, model_ref: stepType === 'model' ? 'gpt-5.6-sol' : null,
    connector_ref: null,
  });
  const callsTiming = deriveTraceTiming([
    at(1, 'run', 'run', 'running', 0, null),
    at(2, 'collector', 'collector', 'running', 7),
    at(3, 'collector', 'collector', 'completed', 2767),
    at(4, 'retrieval', 'retrieval', 'running', 2767),
    at(5, 'retrieval', 'retrieval', 'completed', 2773),
    at(6, 'capability', 'capability', 'running', 2774),
    at(7, 'model', 'model', 'completed', 321275, 'capability'),
    at(8, 'capability', 'capability', 'completed', 321276),
    at(9, 'output', 'output', 'running', 321276),
    at(10, 'output', 'output', 'completed', 321277),
    at(11, 'eval', 'eval', 'running', 321277),
    at(12, 'eval', 'eval', 'completed', 321284),
    at(13, 'judgment', 'judgment', 'pending', 321286),
    at(14, 'run', 'run', 'completed', 321287, null),
  ], { origin: 'recorded' });
  assert.equal(callsTiming.total_duration_ms, 321287);
  assert.equal(callsTiming.critical_path.find((stage) => stage.step_id === 'collector').duration_ms, 2760);
  assert.equal(callsTiming.critical_path.find((stage) => stage.step_id === 'retrieval').duration_ms, 6);
  assert.equal(callsTiming.critical_path.find((stage) => stage.step_id === 'capability').duration_ms, 318502);
  assert.equal(callsTiming.dominant_step_id, 'capability');
  assert.equal(callsTiming.nested_stages.find((stage) => stage.step_type === 'model').measurement, 'completion-only');
  assert.equal(callsTiming.critical_path.at(-1).state, 'pending');
  const retryTiming = deriveTraceTiming([
    at(1, 'run', 'run', 'running', 0, null),
    at(2, 'capability', 'capability', 'running', 10),
    at(3, 'capability', 'capability', 'failed', 110),
    at(4, 'capability', 'capability', 'completed', 510),
    at(5, 'run', 'run', 'completed', 520, null),
  ], { origin: 'recorded' });
  assert.equal(retryTiming.critical_path[0].duration_ms, 500);
  assert.equal(retryTiming.critical_path[0].state, 'completed');
  const totalOnly = deriveTraceTiming([], {
    startedAt: '2026-08-24T10:00:00.000Z', completedAt: '2026-08-24T10:01:00.000Z', origin: 'reconstructed',
  });
  assert.equal(totalOnly.assurance, 'total-only');
  assert.equal(totalOnly.total_duration_ms, 60_000);
  assert.equal(totalOnly.critical_path.length, 0);
  console.log('✓ Canvas read model separa contrato, trace reconstruído e caminho realmente registrado');
} finally {
  rmSync(root, { recursive: true, force: true });
}
