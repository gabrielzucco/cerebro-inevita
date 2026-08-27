#!/usr/bin/env node

import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { readExecutionTrace } from './lib/execution-trace-runtime.mjs';
import { importLegacyRoutineRuns, validateLegacyRoutineRunManifest } from './lib/legacy-routine-run-import.mjs';

const root = mkdtempSync(join(tmpdir(), 'legacy-routine-run-import-'));
function write(path, value) {
  const target = join(root, path);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, typeof value === 'string' ? value : `${JSON.stringify(value, null, 2)}\n`);
}

write('.cerebro/layout.json', {
  routineContracts: '.cerebro/contracts/routines',
  routineReceipts: '.cerebro/runtime/receipts/routines',
  executorBindings: '.cerebro/runtime/executors',
  executionTraces: '.cerebro/runtime/traces',
});
write('.cerebro/contracts/routines/radar-voz-diario.json', {
  protocol_version: 1,
  routine_id: 'radar-voz-diario',
  version: '1.1.0',
  name: 'Radar de Voz — atualização diária',
  lifecycle: 'approved',
  system_ref: 'inteligencia-conhecimento',
  trigger: {
    type: 'schedule',
    schedule: {
      cadence: 'daily', time: '08:20', timezone: 'America/Sao_Paulo',
      weekdays: [], month_days: [], not_before: '2026-08-20T00:00:00.000Z', missed_run_policy: 'run-on-wake',
    },
  },
  placement: { host_ref: 'host-gabriel-local', workspace_ref: 'inevita-company-brain' },
  executor: { binding_ref: 'executor-codex-gabriel', requested_model: 'gpt-5.6-sol', reasoning_effort: 'high' },
  context: {
    prompt_ref: '.automacao/rotinas/radar-voz-diario.prompt.md',
    access_requests: [],
    skill_refs: ['.claude/skills/atualizar-radar-voz/SKILL.md'],
  },
  permission_mode: 'read-only',
  destination: { kind: 'runtime-output', ref: 'routine-output' },
  operations: {
    timeout_seconds: 1800,
    retry: { max_attempts: 1, backoff_seconds: 0, idempotency_scope: 'scheduled-slot' },
    concurrency: 'forbid',
  },
  approval: { required_before_schedule: true, approved_by: 'role-founder', approved_at: '2026-08-20T00:00:00.000Z' },
  privacy: { content_shared_with_inevita: false },
});
write('.cerebro/runtime/executors/executor-codex-gabriel.json', {
  protocol_version: 1,
  binding_id: 'executor-codex-gabriel',
  adapter: 'codex-cli',
  host_ref: 'host-gabriel-local',
  workspace_ref: 'inevita-company-brain',
  workspace_path: '.',
  auth: { type: 'provider-session', status: 'ready' },
  model_policy: { default_model: 'gpt-5.6-sol', allowed_models: [] },
  permission_profile: 'read-only',
  observed_at: '2026-08-20T00:00:00.000Z',
  privacy: { credential_stored: false, content_shared_with_inevita: false },
});

const manifest = {
  protocol_version: 1,
  source: {
    kind: 'codex-automation',
    ref: 'codex-automation:radar-de-voz',
    observed_at: '2026-08-27T20:00:00.000Z',
  },
  routines: [{
    routine_id: 'radar-voz-diario',
    routine_version: '1.0.0',
    runs: [{
      external_run_ref: 'codex-thread:01a042fa-674c-7361-a605-a702b964c8b3',
      scheduled_for: '2026-08-27T11:20:00.000Z',
      started_at: '2026-08-27T11:31:59.000Z',
      completed_at: '2026-08-27T11:31:59.000Z',
      status: 'completed',
      reason_code: 'legacy-completed-with-gaps',
      input_refs: ['automation-memory:2026-08-27'],
      skill_refs: ['.claude/skills/atualizar-radar-voz/SKILL.md'],
      assurance: 'thread-observed',
    }],
  }],
};

assert.deepEqual(validateLegacyRoutineRunManifest(manifest), []);
assert(validateLegacyRoutineRunManifest({ ...manifest, prompt: 'não pode' }).some((error) => error.includes('não é permitido')));
const preview = importLegacyRoutineRuns(root, manifest);
assert.equal(preview.status, 'preview');
assert.equal(preview.runs.length, 1);
assert.equal(readExecutionTrace(root, preview.runs[0].run_id).length, 0);

const imported = importLegacyRoutineRuns(root, manifest, { confirm: true });
assert.equal(imported.status, 'imported');
assert.equal(imported.runs[0].trace_events, 6);
const receipt = JSON.parse(readFileSync(join(root, '.cerebro', 'runtime', 'receipts', 'routines',
  `${imported.runs[0].receipt_ref.slice('routine-receipt:'.length)}.json`), 'utf8'));
assert.equal(receipt.routine_version, '1.0.0');
assert.match(receipt.output_ref, /\.legacy\.json$/);
assert.equal(receipt.content_shared_with_provider, true);
const trace = readExecutionTrace(root, receipt.run_id);
assert.equal(trace[0].extensions.origin, 'reconstructed');
assert.equal(trace[1].step_type, 'skill');
assert.equal(trace[1].state, 'declared');
assert.equal(trace[1].extensions.load_assurance, 'requested-not-verified');
assert.equal(trace.find((event) => event.step_type === 'output').extensions.artifact_assurance, 'metadata-only');
assert.equal(trace.at(-1).state, 'completed');

const again = importLegacyRoutineRuns(root, manifest, { confirm: true });
assert.equal(again.status, 'no-change');
assert.equal(readExecutionTrace(root, receipt.run_id).length, 6);

const undeclared = structuredClone(manifest);
undeclared.routines[0].runs[0].skill_refs = ['.claude/skills/inventada/SKILL.md'];
assert.throws(() => importLegacyRoutineRuns(root, undeclared), /skill-not-declared/);

rmSync(root, { recursive: true, force: true });
console.log('✓ Runs legados entram com recibo idempotente e trace reconstruído sem fingir uso de Skill ou contexto');
