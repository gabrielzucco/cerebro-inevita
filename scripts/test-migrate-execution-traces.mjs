#!/usr/bin/env node

import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import {
  readExecutionTrace,
  validateExecutionTraceEvent,
} from './lib/execution-trace-runtime.mjs';

const script = fileURLToPath(new URL('./migrate-execution-traces.mjs', import.meta.url));
const root = mkdtempSync(join(tmpdir(), 'migrate-execution-traces-'));
const tracesDir = join(root, '.cerebro', 'runtime', 'traces');

function legacyEvent(sequence, state) {
  // Shape gravado pelo emit() anterior à entrada de model_ref/connector_ref
  // no protocolo: as chaves simplesmente não existem no JSON.
  return {
    protocol_version: 1,
    trace_id: 'execution-trace-legacy-test-001',
    event_id: `trace-event-legacy-test-00${sequence}`,
    run_id: 'routine-run-legacy-test-001',
    sequence,
    step_id: 'run',
    step_type: 'run',
    state,
    occurred_at: `2026-08-24T10:00:0${sequence}.000Z`,
    parent_step_id: null,
    system_ref: 'calls',
    routine_ref: 'routine:call-em-decisoes-manual:1.0.0',
    source_ref: null,
    capability_ref: null,
    skill_ref: null,
    input_refs: [],
    output_refs: [],
    reason_code: null,
    evidence_ref: null,
    privacy: {
      content_shared_with_inevita: false,
      payload_recorded: false,
      raw_error_recorded: false,
    },
  };
}

try {
  mkdirSync(tracesDir, { recursive: true, mode: 0o700 });
  writeFileSync(
    join(tracesDir, 'routine-run-legacy-test-001.jsonl'),
    `${[legacyEvent(1, 'running'), legacyEvent(2, 'completed')].map((event) => JSON.stringify(event)).join('\n')}\n`,
  );
  const broken = { ...legacyEvent(1, 'running'), run_id: 'routine-run-broken-test-001', privacy: {} };
  writeFileSync(join(tracesDir, 'routine-run-broken-test-001.jsonl'), `${JSON.stringify(broken)}\n`);
  const brokenBefore = readFileSync(join(tracesDir, 'routine-run-broken-test-001.jsonl'), 'utf8');

  // A validação continua estrita: chave ausente NÃO é aceita como null.
  assert(validateExecutionTraceEvent(legacyEvent(1, 'running')).includes('model_ref inválido'));
  assert(validateExecutionTraceEvent(legacyEvent(1, 'running')).includes('connector_ref inválido'));
  assert.throws(() => readExecutionTrace(root, 'routine-run-legacy-test-001'), /trace-event-invalid-1/);

  // Dry-run anuncia sem tocar nos arquivos.
  const dry = spawnSync('node', [script, `--root=${root}`, '--dry-run'], { encoding: 'utf8' });
  assert.equal(dry.status, 1);
  assert(dry.stdout.includes('migraria · routine-run-legacy-test-001.jsonl'));
  assert.throws(() => readExecutionTrace(root, 'routine-run-legacy-test-001'), /trace-event-invalid-1/);

  // Migração real: evento legado ganha null explícito e o trace volta a ler;
  // arquivo com defeito de outra natureza fica intocado e derruba o exit code.
  const run = spawnSync('node', [script, `--root=${root}`], { encoding: 'utf8' });
  assert.equal(run.status, 1);
  assert(run.stdout.includes('migrado · routine-run-legacy-test-001.jsonl'));
  assert(run.stderr.includes('inválido · routine-run-broken-test-001.jsonl'));
  assert.equal(readFileSync(join(tracesDir, 'routine-run-broken-test-001.jsonl'), 'utf8'), brokenBefore);
  const events = readExecutionTrace(root, 'routine-run-legacy-test-001');
  assert.equal(events.length, 2);
  assert(events.every((event) => event.model_ref === null && event.connector_ref === null));

  // Idempotência: segunda passada não reescreve nada.
  rmSync(join(tracesDir, 'routine-run-broken-test-001.jsonl'));
  const again = execFileSync('node', [script, `--root=${root}`], { encoding: 'utf8' });
  assert(again.includes('já válido · routine-run-legacy-test-001.jsonl'));

  console.log('✓ Migração one-shot normaliza trace legado sem relaxar a validação de traces novos');
} finally {
  rmSync(root, { recursive: true, force: true });
}
