#!/usr/bin/env node

import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { readExecutionTrace } from './lib/execution-trace-runtime.mjs';
import { recordReplayExecution } from './lib/replay-runtime.mjs';
import { latestRunRecords } from './lib/system-protocol.mjs';

const root = mkdtempSync(join(tmpdir(), 'replay-runtime-v1-'));
function write(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, typeof value === 'string' ? value : `${JSON.stringify(value, null, 2)}\n`);
}

try {
  write(join(root, '.cerebro', 'layout.json'), {
    version: 3, systemContracts: '.cerebro/contracts/systems',
    runLedger: '.cerebro/runtime/ledger/runs.jsonl', executionTraces: '.cerebro/runtime/traces',
  });
  const system = JSON.parse(readFileSync(new URL('../protocol/examples/system-contract.v2.json', import.meta.url), 'utf8'));
  write(join(root, '.cerebro', 'contracts', 'systems', `${system.system_id}.json`), system);
  const access = {
    source_ref: { role: 'midia-paga', id: 'paid-media' }, selected_refs: ['snapshot:test:001'],
    query: 'recorte de teste', filters: [], window: 'janela de teste', freshness_marker: 'snapshot:test:001',
    assurance: 'receipt-audited',
  };
  const result = recordReplayExecution(root, {
    runId: 'run-replay-runtime-test-001', systemRef: system.system_id, chainId: 'chain-replay-test-001',
    experimentRef: 'EXP-REPLAY-001', handoffRefs: ['handoff-contract:briefing-para-funil'],
    startedAt: '2026-08-24T15:00:00.000Z', completedAt: '2026-08-24T15:01:00.000Z',
    accesses: [access], inputRefs: ['operacao/briefing.json'], outputRefs: ['operacao/leitura.json'],
    modelObservation: { model_ref: 'codex-session', assurance: 'requested-not-verified' },
    connectorObservations: [{
      connector_ref: 'paid-media', source_ref: 'paid-media', assurance: 'receipt-audited',
      input_refs: ['snapshot:test:001'], output_refs: [],
    }],
  });
  assert.equal(result.record.mode, 'replay');
  assert.equal(result.record.extensions.external_actions_executed, false);
  assert.equal(latestRunRecords(root).length, 1);
  const trace = readExecutionTrace(root, result.record.run_id);
  assert(trace.some((event) => event.step_type === 'model' && event.assurance === 'requested-not-verified'));
  assert(trace.some((event) => event.step_type === 'connector' && event.connector_ref === 'paid-media'));
  assert(trace.every((event) => event.chain_id === 'chain-replay-test-001' && event.mode === 'replay'));
  assert.throws(() => recordReplayExecution(root, {
    runId: result.record.run_id, systemRef: system.system_id, chainId: 'chain-replay-test-001',
  }), /already-exists/);
  console.log('✓ Replay Runtime registra cadeia reference-only, observabilidade e zero ação externa');
} finally {
  rmSync(root, { recursive: true, force: true });
}
