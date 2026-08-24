#!/usr/bin/env node

import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { createExecutionTracer } from './lib/execution-trace-runtime.mjs';
import { buildRunGraph, buildSystemGraph, graphForLayout } from './lib/graph-read-model.mjs';
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
    canvasLayouts: '.cerebro/runtime/canvas-layouts'
  });
  const source = example('source-contract.v1.json');
  write(join(root, '.cerebro', 'contracts', 'sources', `${source.source_id}.json`), {
    ...source,
    name: 'Métricas reais do funil',
  });
  write(join(root, '.cerebro', 'contracts', 'systems', 'analisar-funil.json'), example('system-contract.v2.json'));
  registerRoutineContract(root, example('routine-contract.v1.json'));

  const receipt = example('routine-run-receipt.v1.json');
  writeRoutineRunReceipt(root, receipt);
  const record = {
    ...example('run-record.v2.json'),
    run_id: receipt.run_id,
    started_at: receipt.started_at,
    completed_at: receipt.completed_at,
  };
  appendRunRecord(root, record);

  const system = buildSystemGraph(root, 'analisar-funil');
  assert.equal(system.graph_type, 'system');
  assert(system.nodes.some((node) => node.id === 'retrieval'));
  assert(system.nodes.some((node) => node.id === 'gate:1'));
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
  tracer.emit({ stepId: 'run', stepType: 'run', state: 'running', parentStepId: null });
  tracer.emit({ stepId: 'capability', stepType: 'capability', state: 'completed' });
  tracer.emit({
    stepId: 'eval', stepType: 'eval', state: 'failed', reasonCode: 'evaluation-gate-failed',
    extensions: { gate_results: [
      { gate_id: 'claims', passed: true, not_applicable: false, issue_count: 0 },
      { gate_id: 'external-action', passed: false, not_applicable: false, issue_count: 1 },
    ] },
  });
  tracer.emit({ stepId: 'judgment', stepType: 'judgment', state: 'pending' });
  tracer.emit({ stepId: 'run', stepType: 'run', state: 'completed', parentStepId: null });

  const recorded = buildRunGraph(root, receipt.receipt_id);
  assert.equal(recorded.trace_origin, 'recorded');
  assert.equal(recorded.trace_events, 5);
  assert.equal(recorded.nodes.find((node) => node.id === 'gate:1').state, 'completed');
  assert.equal(recorded.nodes.find((node) => node.id === 'gate:2').state, 'failed');
  assert.equal(graphForLayout(root, `run-${receipt.run_id}`).graph_ref, receipt.run_id);
  assert.equal(JSON.stringify(recorded).includes('PRIVATE'), false);
  console.log('✓ Canvas read model separa contrato, trace reconstruído e caminho realmente registrado');
} finally {
  rmSync(root, { recursive: true, force: true });
}
