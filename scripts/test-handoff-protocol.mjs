#!/usr/bin/env node

import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { createExecutionTracer } from './lib/execution-trace-runtime.mjs';
import {
  listHandoffReceipts, recordAcceptedHandoff, registerHandoffContract,
  validateHandoffContract, validateHandoffReceipt,
} from './lib/handoff-protocol.mjs';
import { appendRunRecord } from './lib/system-protocol.mjs';

const ROOT = resolve(process.cwd());

function example(name) {
  return JSON.parse(readFileSync(join(ROOT, 'protocol', 'examples', name), 'utf8'));
}

function clone(value) {
  return structuredClone(value);
}

const contract = example('handoff-contract.v1.json');
const receipt = example('handoff-receipt.v1.json');

assert.deepEqual(validateHandoffContract(contract), []);
assert.deepEqual(validateHandoffReceipt(receipt), []);

const sameSystem = clone(contract);
sameSystem.consumer.system_ref = sameSystem.producer.system_ref;
assert(validateHandoffContract(sameSystem).some((error) => error.includes('Sistemas diferentes')),
  'handoff dentro do mesmo Sistema precisa reprovar');

const copyTransfer = clone(contract);
copyTransfer.permissions.transfer = 'copy';
assert(validateHandoffContract(copyTransfer).some((error) => error.includes('reference-only')),
  'transferência que não é reference-only precisa reprovar');

const badRange = clone(contract);
badRange.artifact.accepted_versions = ['banana'];
assert(validateHandoffContract(badRange).some((error) => error.includes('accepted_versions')),
  'faixa de versão inválida precisa reprovar');

const acceptedWithoutConsumer = clone(receipt);
acceptedWithoutConsumer.consumer_run_ref = null;
assert(validateHandoffReceipt(acceptedWithoutConsumer).some((error) => error.includes('accepted exige consumer_run_ref')),
  'accepted sem Run consumidor precisa reprovar');

const passedWithoutSchema = clone(receipt);
passedWithoutSchema.artifact.schema_validated = false;
assert(validateHandoffReceipt(passedWithoutSchema).some((error) => error.includes('schema validado')),
  'gate aprovado sem schema validado precisa reprovar');

const invalidMode = clone(receipt);
invalidMode.mode = 'test';
assert(validateHandoffReceipt(invalidMode).some((error) => error.includes('replay ou live')),
  'mode fora de replay|live precisa reprovar — replay nunca se apresenta como live');

const deliveredWithConsumer = clone(receipt);
deliveredWithConsumer.status = 'delivered';
assert(validateHandoffReceipt(deliveredWithConsumer).some((error) => error.includes('delivered')),
  'delivered com Run consumidor precisa reprovar');

const failedCheckButPassed = clone(receipt);
failedCheckButPassed.gate.checks[0].passed = false;
assert(validateHandoffReceipt(failedCheckButPassed).some((error) => error.includes('check reprovado')),
  'gate não pode passar com check reprovado');

const timeTravel = clone(receipt);
timeTravel.consumed_at = '2026-08-24T11:00:00.000Z';
assert(validateHandoffReceipt(timeTravel).some((error) => error.includes('consumed_at')),
  'consumo antes do gate precisa reprovar');

function cli(kind, path) {
  return execFileSync(process.execPath, [join(ROOT, 'scripts', 'protocol-validate.mjs'), kind, path], {
    cwd: ROOT, encoding: 'utf8',
  });
}

assert(cli('handoff', 'protocol/examples/handoff-contract.v1.json').includes('válido'));
assert(cli('handoff-receipt', 'protocol/examples/handoff-receipt.v1.json').includes('válido'));

const root = mkdtempSync(join(tmpdir(), 'handoff-runtime-v1-'));
function write(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, typeof value === 'string' ? value : `${JSON.stringify(value, null, 2)}\n`);
}

try {
  write(join(root, '.cerebro', 'layout.json'), {
    version: 3,
    systemContracts: '.cerebro/contracts/systems',
    handoffContracts: '.cerebro/contracts/handoffs',
    handoffReceipts: '.cerebro/runtime/receipts/handoffs',
    runLedger: '.cerebro/runtime/ledger/runs.jsonl',
    executionTraces: '.cerebro/runtime/traces',
  });
  const consumer = example('system-contract.v2.json');
  consumer.artifacts.consumes = consumer.artifacts.consumes.map((item) => ({ ...item, required: true }));
  const producer = {
    ...clone(consumer),
    system_id: 'conteudo',
    name: 'Sistema de Conteúdo',
    result: { ...consumer.result, output_type: 'creative-brief' },
    capability: { ...consumer.capability, capability_id: 'criar-briefing' },
    artifacts: {
      produces: [{
        role: 'briefing-editorial', artifact_type: 'creative-brief',
        schema_ref: 'protocol/artifacts/creative-brief.schema.json',
        schema_version: '1.0.0', sensitivity: 'private',
      }],
      consumes: [],
    },
  };
  write(join(root, '.cerebro', 'contracts', 'systems', 'conteudo.json'), producer);
  write(join(root, '.cerebro', 'contracts', 'systems', 'analisar-funil.json'), consumer);
  write(join(root, 'protocol', 'artifacts', 'creative-brief.schema.json'),
    JSON.parse(readFileSync(join(ROOT, 'protocol', 'artifacts', 'creative-brief.schema.json'), 'utf8')));
  const handoff = { ...clone(contract), consumer: { ...contract.consumer, system_ref: 'analisar-funil' } };
  assert.equal(registerHandoffContract(root, handoff).ref,
    'handoff-contract:briefing-criativo-para-medicao');

  const chainId = 'chain-tarja-replay-test-001';
  const experimentRef = 'EXP-TARJA-TEST-001';
  const producerRunId = 'run-content-tarja-test-001';
  const consumerRunId = 'run-funnel-tarja-test-001';
  const artifactRef = '.cerebro/runtime/outputs/replay/briefing-tarja.json';
  const artifact = {
    artifact_type: 'creative-brief', schema_version: '1.0.0', brief_id: 'brief-tarja-test-001',
    produced_by: { system_ref: 'conteudo', run_ref: producerRunId },
    experiment_ref: experimentRef, arm_ref: 'tarja', objective: 'validar uma variação visual',
    audience: 'audiência do teste', message: 'manter a mensagem e variar apenas a tarja',
    variable_under_test: 'tarja', constraints: ['replay sem publicação'],
    evidence_refs: ['evidence:test-case'],
  };
  write(join(root, artifactRef), artifact);
  const runBase = example('run-record.v2.json');
  const run = (runId, system, outputRefs, capability) => ({
    ...clone(runBase), run_id: runId, system_id: system.system_id, system_version: system.version,
    capability: { capability_id: capability, version: system.capability.version },
    chain_id: chainId, mode: 'replay', experiment_ref: experimentRef,
    handoff_refs: [`handoff-contract:${handoff.handoff_id}`], output_refs: outputRefs,
  });
  appendRunRecord(root, run(producerRunId, producer, [artifactRef], 'criar-briefing'));
  appendRunRecord(root, run(consumerRunId, consumer, ['.cerebro/runtime/outputs/replay/leitura.json'], 'diagnosticar-funil'));
  const trace = (runId, systemRef, direction) => {
    const tracer = createExecutionTracer(root, {
      runId, systemRef, routineRef: `replay:${systemRef}`, chainId, mode: 'replay',
      experimentRef, handoffRefs: [`handoff-contract:${handoff.handoff_id}`],
      clock: () => new Date('2026-08-24T12:00:00.000Z'),
    });
    tracer.emit({ stepId: 'run', stepType: 'run', state: 'running', parentStepId: null });
    tracer.emit({
      stepId: 'capability', stepType: 'capability', state: 'completed',
      ...(direction === 'producer' ? { outputRefs: [artifactRef] } : { inputRefs: [artifactRef] }),
    });
    tracer.emit({ stepId: 'run', stepType: 'run', state: 'completed', parentStepId: null });
  };
  trace(producerRunId, 'conteudo', 'producer');
  trace(consumerRunId, 'analisar-funil', 'consumer');

  assert.throws(() => recordAcceptedHandoff(root, handoff.handoff_id, {
    receiptId: 'handoff-wrong-chain', chainId: 'chain-wrong', mode: 'replay', experimentRef,
    producerRunRef: `run-record:${producerRunId}`, consumerRunRef: `run-record:${consumerRunId}`,
    artifactRef, producedAt: '2026-08-24T12:00:00.000Z', gatedAt: '2026-08-24T12:01:00.000Z',
    consumedAt: '2026-08-24T12:02:00.000Z', approvalRef: 'judgment-receipt:tarja-test',
  }), /lineage-mismatch/);

  const recorded = recordAcceptedHandoff(root, handoff.handoff_id, {
    receiptId: 'handoff-tarja-runtime-test-001', chainId, mode: 'replay', experimentRef,
    producerRunRef: `run-record:${producerRunId}`, consumerRunRef: `run-record:${consumerRunId}`,
    artifactRef, producedAt: '2026-08-24T12:00:00.000Z', gatedAt: '2026-08-24T12:01:00.000Z',
    consumedAt: '2026-08-24T12:02:00.000Z', approvalRef: 'judgment-receipt:tarja-test',
  });
  assert.equal(recorded.receipt.status, 'accepted');
  assert.equal(recorded.receipt.artifact.schema_validated, true);
  assert.match(recorded.receipt.artifact.sha256, /^[a-f0-9]{64}$/);
  assert.equal(listHandoffReceipts(root).length, 1);
  assert.equal(JSON.stringify(recorded.receipt).includes('manter a mensagem'), false);
} finally {
  rmSync(root, { recursive: true, force: true });
}

console.log('✓ Handoff é contrato + recibo: a aresta entre Sistemas só existe declarada e só acende com prova');
