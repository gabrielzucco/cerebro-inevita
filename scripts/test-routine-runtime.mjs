#!/usr/bin/env node

import assert from 'node:assert/strict';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { registerAccessGrant } from './lib/access-runtime.mjs';
import { observeExecutor, runModelExecutor } from './lib/model-executors.mjs';
import {
  confirmLegacySchedulePaused,
  listRoutineRunReceipts,
  loadRoutineMigration,
  registerRoutineContract,
  registerRoutineMigration,
  routineOutputDirectory,
  saveCollectorBinding,
  saveExecutorBinding,
  validateCollectorBinding,
  validateExecutorBinding,
  validateRoutineContract,
  validateRoutineMigration,
  validateRoutineRunReceipt,
} from './lib/routine-protocol.mjs';
import {
  activateRoutine,
  pauseRoutine,
  runRoutine,
  tickRoutines,
} from './lib/routine-runtime.mjs';

const root = mkdtempSync(join(tmpdir(), 'cerebro-routine-runtime-'));
const fixed = (iso) => () => new Date(iso);
const promptMarker = 'PROMPT_MARKER_ONLY_ON_STDIN';
const outputMarker = 'PRIVATE_RESULT_ONLY_AT_DESTINATION';

function json(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function write(path, content) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content);
}

function contract(overrides = {}) {
  const value = json(new URL('../protocol/examples/routine-contract.v1.json', import.meta.url));
  const next = {
    ...value,
    ...overrides,
    trigger: overrides.trigger || value.trigger,
    placement: { ...value.placement, ...(overrides.placement || {}) },
    executor: { ...value.executor, ...(overrides.executor || {}) },
    context: { ...value.context, ...(overrides.context || {}) },
    destination: { ...value.destination, ...(overrides.destination || {}) },
    operations: {
      ...value.operations,
      ...(overrides.operations || {}),
      retry: { ...value.operations.retry, ...(overrides.operations?.retry || {}) },
    },
    approval: { ...value.approval, ...(overrides.approval || {}) },
  };
  return next;
}

function binding(overrides = {}) {
  const value = json(new URL('../protocol/examples/executor-binding.v1.json', import.meta.url));
  return {
    ...value,
    ...overrides,
    auth: { ...value.auth, ...(overrides.auth || {}) },
    model_policy: { ...value.model_policy, ...(overrides.model_policy || {}) },
    privacy: { ...value.privacy, ...(overrides.privacy || {}) },
  };
}

function fakeCodex({ sequence = ['success'], calls }) {
  return (command, args, options) => {
    calls.push({ command, args, options });
    assert.equal(command, 'codex');
    assert.equal(options.input, `${promptMarker}\n`);
    assert.equal(args.includes(promptMarker), false);
    assert.equal(args.some((arg) => arg.includes(promptMarker)), false);
    const outcome = sequence[Math.min(calls.length - 1, sequence.length - 1)];
    if (outcome === 'timeout') return { status: null, signal: 'SIGTERM', error: { code: 'ETIMEDOUT' } };
    if (outcome === 'failure') return { status: 1, stdout: '', stderr: `raw failure ${promptMarker}` };
    const outputIndex = args.indexOf('-o');
    assert.notEqual(outputIndex, -1);
    write(args[outputIndex + 1], `${outputMarker}\n`);
    return { status: 0, stdout: '{"type":"done"}\n', stderr: '' };
  };
}

function assertReferenceOnly(receipt) {
  const serialized = JSON.stringify(receipt);
  assert.equal(serialized.includes(promptMarker), false);
  assert.equal(serialized.includes(outputMarker), false);
  assert.equal(serialized.includes('raw failure'), false);
  assert.equal(receipt.privacy.prompt_recorded, false);
  assert.equal(receipt.privacy.output_recorded, false);
  assert.equal(receipt.privacy.raw_error_recorded, false);
}

try {
  write(join(root, 'VERSION'), 'test\n');
  write(join(root, 'COMECE-AQUI.md'), '# Teste\n');
  write(join(root, '.cerebro', 'layout.json'), `${JSON.stringify({
    version: 3,
    routineContracts: '.cerebro/contracts/routines',
    executorBindings: '.cerebro/runtime/executors',
    collectorBindings: '.cerebro/runtime/collectors',
    routineReceipts: '.cerebro/runtime/receipts/routines',
    routineState: '.cerebro/runtime/routines',
    routineOutputs: '.cerebro/runtime/outputs/routines',
    accessGrants: '.cerebro/contracts/access-grants',
    accessReceipts: '.cerebro/runtime/receipts/access',
  }, null, 2)}\n`);
  write(join(root, '.cerebro', 'private-ignore.manifest'), [
    '.cerebro/runtime',
    '.cerebro/contracts/',
    'operacao/execucoes/*',
  ].join('\n'));
  write(join(root, 'operacao', 'rotinas', 'funil-diario.prompt.md'), `${promptMarker}\n`);

  const routineExample = json(new URL('../protocol/examples/routine-contract.v1.json', import.meta.url));
  const bindingExample = json(new URL('../protocol/examples/executor-binding.v1.json', import.meta.url));
  const receiptExample = json(new URL('../protocol/examples/routine-run-receipt.v1.json', import.meta.url));
  const migrationExample = json(new URL('../protocol/examples/routine-migration.v1.json', import.meta.url));
  const collectorExample = json(new URL('../protocol/examples/collector-binding.v1.json', import.meta.url));
  assert.deepEqual(validateRoutineContract(routineExample), []);
  assert.deepEqual(validateExecutorBinding(bindingExample), []);
  assert.deepEqual(validateRoutineRunReceipt(receiptExample), []);
  assert.deepEqual(validateRoutineMigration(migrationExample), []);
  assert.deepEqual(validateCollectorBinding(collectorExample), []);
  assert(validateCollectorBinding({ ...collectorExample, args: ['-c', 'unsafe'] }).some((error) => error.includes('inseguro')));
  assert(validateRoutineMigration({
    ...migrationExample,
    status: 'ready-for-activation',
  }).some((error) => error.includes('readback')));
  assert(validateRoutineContract({ ...routineExample, prompt: promptMarker }).some((error) => error.includes('não é permitido')));
  assert(validateExecutorBinding({ ...bindingExample, oauth: 'xoxb-1234567890123456' }).length > 0);
  assert(validateRoutineRunReceipt({ ...receiptExample, output: outputMarker }).some((error) => error.includes('payload')));
  assert(validateRoutineContract({
    ...routineExample,
    context: { ...routineExample.context, prompt_ref: 'operacao/../outside.md' },
  }).length > 0);
  assert(validateRoutineContract({
    ...routineExample,
    trigger: { ...routineExample.trigger, schedule: { ...routineExample.trigger.schedule, weekdays: {} } },
  }).length > 0);
  assert(validateRoutineContract({
    ...routineExample,
    context: {
      ...routineExample.context,
      access_requests: [{ ...routineExample.context.access_requests[0], mode: 'write-with-approval' }],
    },
  }).some((error) => error.includes('workspace-write')));
  assert(validateExecutorBinding({
    ...bindingExample,
    model_policy: { ...bindingExample.model_policy, allowed_models: {} },
  }).length > 0);
  assert(validateRoutineRunReceipt({ ...receiptExample, input_refs: {} }).length > 0);

  const observationCalls = [];
  const readyObservation = observeExecutor('codex-cli', {
    now: new Date('2026-08-24T11:00:00.000Z'),
    resolveCommand: () => '/fake/codex',
    spawn: (_command, args) => {
      observationCalls.push(args);
      return { status: 0, stdout: 'discarded@example.com', stderr: 'discarded token' };
    },
  });
  assert.equal(readyObservation.status, 'ready');
  assert.equal(JSON.stringify(readyObservation).includes('example.com'), false);
  assert.deepEqual(observationCalls, [['--version'], ['login', 'status']]);
  assert.equal(observeExecutor('claude-code', { resolveCommand: () => null }).status, 'missing');
  let authProbe = 0;
  assert.equal(observeExecutor('claude-code', {
    resolveCommand: () => '/fake/claude',
    spawn: () => ({ status: authProbe++ === 0 ? 0 : 1, stdout: 'discard me', stderr: 'discard me' }),
  }).status, 'authentication-required');

  registerAccessGrant(root, {
    protocol_version: 1,
    grant_id: 'grant-funnel-local-read',
    subject: { type: 'system', ref: 'analisar-funil' },
    scope: {
      company_ref: 'company-local', unit_ref: 'marketing',
      system_refs: ['analisar-funil'], source_refs: ['paid-media'], actions: ['read-metrics'],
    },
    mode: 'read',
    assurance: 'receipt-audited',
    custody: 'agent-direct',
    reason: 'ler somente o recorte local já aprovado pelo dono',
    issued_at: '2026-08-23T00:00:00.000Z',
    expires_at: null,
    revoked_at: null,
    approved_by: 'role-marketing-owner',
    credential_ref: null,
    receipts: { use_refs: [], revocation_ref: null },
  });
  registerRoutineContract(root, routineExample);
  registerRoutineMigration(root, migrationExample);
  saveExecutorBinding(root, bindingExample);
  saveCollectorBinding(root, collectorExample);

  const manualCalls = [];
  const manual = await runRoutine(root, 'funil-diario-cerebro', {
    spawn: fakeCodex({ calls: manualCalls }),
    clock: fixed('2026-08-24T11:29:00.000Z'),
    wait: async () => assert.fail('successful run must not retry'),
  });
  assert.equal(manual.status, 'completed');
  assert.equal(manualCalls.length, 1);
  assert.equal(readFileSync(join(root, 'operacao', 'execucoes', 'rotinas', 'funil-diario.md'), 'utf8'), `${outputMarker}\n`);
  assert.equal(manual.receipt.access_receipt_refs.length, 1);
  assertReferenceOnly(manual.receipt);

  assert.throws(() => activateRoutine(root, 'funil-diario-cerebro', manual.receipt_ref, 'role-marketing-owner', {
    clock: fixed('2026-08-24T11:29:00.000Z'),
  }), /legacy-schedule-not-paused/);
  assert.equal(loadRoutineMigration(root, 'funil-diario-cerebro').migration.status, 'awaiting-legacy-pause');
  confirmLegacySchedulePaused(root, 'funil-diario-cerebro', 'readback:owner-paused-legacy-task', 'role-marketing-owner', {
    clock: fixed('2026-08-24T11:29:00.000Z'),
  });
  activateRoutine(root, 'funil-diario-cerebro', manual.receipt_ref, 'role-marketing-owner', {
    clock: fixed('2026-08-24T11:29:00.000Z'),
  });
  assert.equal(loadRoutineMigration(root, 'funil-diario-cerebro').migration.status, 'cutover-completed');
  const scheduledCalls = [];
  const scheduled = await tickRoutines(root, {
    spawn: fakeCodex({ calls: scheduledCalls }),
    clock: fixed('2026-08-24T11:30:30.000Z'),
    wait: async () => {},
  });
  assert.equal(scheduled.length, 1);
  assert.equal(scheduled[0].status, 'completed');
  assert.equal(scheduled[0].receipt.trigger, 'schedule');
  assert.equal(scheduled[0].receipt.scheduled_for, '2026-08-24T11:30:00.000Z');
  assert.equal(scheduledCalls.length, 1);
  assertReferenceOnly(scheduled[0].receipt);
  const duplicateScheduled = await runRoutine(root, 'funil-diario-cerebro', {
    trigger: 'schedule',
    scheduledFor: '2026-08-24T11:30:00.000Z',
    spawn: fakeCodex({ calls: scheduledCalls }),
    clock: fixed('2026-08-24T11:30:45.000Z'),
  });
  assert.equal(duplicateScheduled.status, 'no-change');
  assert.equal(duplicateScheduled.receipt.receipt_id, scheduled[0].receipt.receipt_id);
  assert.equal(scheduledCalls.length, 1);

  const repeated = await tickRoutines(root, {
    spawn: fakeCodex({ calls: scheduledCalls }),
    clock: fixed('2026-08-24T11:30:30.000Z'),
  });
  assert.deepEqual(repeated, []);
  assert.equal(scheduledCalls.length, 1);
  pauseRoutine(root, 'funil-diario-cerebro', 'role-marketing-owner', {
    clock: fixed('2026-08-24T11:31:00.000Z'),
  });
  const paused = await tickRoutines(root, {
    spawn: fakeCodex({ calls: scheduledCalls }),
    clock: fixed('2026-08-25T11:31:00.000Z'),
  });
  assert.deepEqual(paused, []);
  assert.equal(scheduledCalls.length, 1);

  const preparedRoutine = contract({
    routine_id: 'funil-preparado',
    trigger: { type: 'manual', schedule: null },
    context: { access_requests: [] },
    destination: { kind: 'runtime-output', ref: 'routine-output' },
    extensions: {
      preparation: {
        kind: 'trusted-local-command',
        binding_ref: 'collector-funnel-local',
        output_ref: '.automacao/_FUNIL-ULTIMO.json',
      },
    },
  });
  registerRoutineContract(root, preparedRoutine);
  const preparationStarted = new Date();
  const collectorCalls = [];
  const preparedModelCalls = [];
  const prepared = await runRoutine(root, 'funil-preparado', {
    spawnCollector: (command, args, options) => {
      collectorCalls.push({ command, args, options });
      assert.equal(command, 'python3');
      assert.deepEqual(args, ['.automacao/funil_diario.py']);
      write(join(root, '.automacao', '_FUNIL-ULTIMO.json'), '{"sanitized":true}\n');
      return { status: 0, stdout: 'PRIVATE_COLLECTOR_STDOUT', stderr: '' };
    },
    spawn: fakeCodex({ calls: preparedModelCalls }),
    clock: () => preparationStarted,
  });
  assert.equal(prepared.status, 'completed');
  assert.equal(collectorCalls.length, 1);
  assert.equal(preparedModelCalls.length, 1);
  assert(prepared.receipt.input_refs.includes('collector-output:.automacao/_FUNIL-ULTIMO.json'));
  assert.equal(JSON.stringify(prepared.receipt).includes('PRIVATE_COLLECTOR_STDOUT'), false);

  const failedPreparationRoutine = contract({
    routine_id: 'funil-preparo-falha',
    trigger: { type: 'manual', schedule: null },
    context: { access_requests: [] },
    destination: { kind: 'runtime-output', ref: 'routine-output' },
    extensions: preparedRoutine.extensions,
  });
  registerRoutineContract(root, failedPreparationRoutine);
  let modelCalledAfterCollectorFailure = false;
  const failedPreparation = await runRoutine(root, 'funil-preparo-falha', {
    spawnCollector: () => ({ status: 1, stdout: 'PRIVATE_FAILURE', stderr: 'PRIVATE_FAILURE' }),
    spawn: () => { modelCalledAfterCollectorFailure = true; throw new Error('não deveria chamar modelo'); },
    clock: () => new Date(),
  });
  assert.equal(failedPreparation.status, 'failed');
  assert.equal(failedPreparation.receipt.reason_code, 'collector-failed');
  assert.equal(failedPreparation.receipt.content_shared_with_provider, false);
  assert.equal(modelCalledAfterCollectorFailure, false);

  const retryRoutine = contract({
    routine_id: 'funil-retry',
    trigger: { type: 'manual', schedule: null },
    context: { access_requests: [] },
    destination: { kind: 'runtime-output', ref: 'routine-output' },
    operations: { retry: { max_attempts: 2, backoff_seconds: 1 } },
  });
  registerRoutineContract(root, retryRoutine);
  const retryCalls = [];
  let waited = 0;
  const retry = await runRoutine(root, 'funil-retry', {
    spawn: fakeCodex({ sequence: ['failure', 'success'], calls: retryCalls }),
    clock: fixed('2026-08-24T12:00:00.000Z'),
    wait: async (milliseconds) => { waited += milliseconds; },
  });
  assert.equal(retry.status, 'completed');
  assert.equal(retry.receipt.attempts, 2);
  assert.equal(retryCalls.length, 2);
  assert.equal(waited, 1000);
  assert(existsSync(join(root, retry.receipt.output_ref)));
  assertReferenceOnly(retry.receipt);
  const retryAttemptReceipts = listRoutineRunReceipts(root, 'funil-retry')
    .filter((receipt) => receipt.run_id === retry.receipt.run_id);
  assert.deepEqual(retryAttemptReceipts.map((receipt) => receipt.status).sort(), ['completed', 'failed']);
  assert(retryAttemptReceipts.every((receipt) => receipt.content_shared_with_provider));

  const timeoutRoutine = contract({
    routine_id: 'funil-timeout',
    trigger: { type: 'manual', schedule: null },
    context: { access_requests: [] },
    destination: { kind: 'runtime-output', ref: 'routine-output' },
    operations: { retry: { max_attempts: 1, backoff_seconds: 0 } },
  });
  registerRoutineContract(root, timeoutRoutine);
  const timeoutCalls = [];
  const timeout = await runRoutine(root, 'funil-timeout', {
    spawn: fakeCodex({ sequence: ['timeout'], calls: timeoutCalls }),
    clock: fixed('2026-08-24T12:05:00.000Z'),
  });
  assert.equal(timeout.status, 'failed');
  assert.equal(timeout.receipt.reason_code, 'executor-timeout');
  assert.equal(timeout.receipt.output_ref, null);
  assertReferenceOnly(timeout.receipt);

  for (const [suffix, authStatus] of [['missing', 'missing'], ['auth', 'authentication-required']]) {
    saveExecutorBinding(root, binding({
      binding_id: `executor-${suffix}`,
      auth: { status: authStatus },
    }));
    const deniedRoutine = contract({
      routine_id: `funil-${suffix}`,
      trigger: { type: 'manual', schedule: null },
      executor: { binding_ref: `executor-${suffix}` },
      context: { prompt_ref: `arquivo-ausente-${suffix}.md`, access_requests: [] },
      destination: { kind: 'runtime-output', ref: 'routine-output' },
    });
    registerRoutineContract(root, deniedRoutine);
    let called = false;
    const denied = await runRoutine(root, deniedRoutine.routine_id, {
      spawn: () => { called = true; throw new Error('não deveria executar'); },
      clock: fixed('2026-08-24T12:10:00.000Z'),
    });
    assert.equal(denied.status, 'denied');
    assert.equal(denied.receipt.reason_code, `executor-${authStatus}`);
    assert.equal(denied.receipt.attempts, 0);
    assert.equal(called, false);
    assertReferenceOnly(denied.receipt);
  }

  const noBindingRoutine = contract({
    routine_id: 'funil-no-binding',
    trigger: { type: 'manual', schedule: null },
    executor: { binding_ref: 'executor-does-not-exist' },
    context: { prompt_ref: 'also-does-not-exist.md', access_requests: [] },
    destination: { kind: 'runtime-output', ref: 'routine-output' },
  });
  registerRoutineContract(root, noBindingRoutine);
  let noBindingCalled = false;
  const noBinding = await runRoutine(root, noBindingRoutine.routine_id, {
    spawn: () => { noBindingCalled = true; throw new Error('não deveria executar'); },
    clock: fixed('2026-08-24T12:12:00.000Z'),
  });
  assert.equal(noBinding.status, 'denied');
  assert.equal(noBinding.receipt.adapter, 'unresolved');
  assert.equal(noBinding.receipt.reason_code, 'executor-binding-missing');
  assert.equal(noBindingCalled, false);
  assertReferenceOnly(noBinding.receipt);

  const publicDestinationRoutine = contract({
    routine_id: 'funil-public-destination',
    trigger: { type: 'manual', schedule: null },
    context: { access_requests: [] },
    destination: { kind: 'local-file', ref: 'public/result.md' },
  });
  registerRoutineContract(root, publicDestinationRoutine);
  let publicDestinationCalled = false;
  const publicDestination = await runRoutine(root, publicDestinationRoutine.routine_id, {
    spawn: () => { publicDestinationCalled = true; throw new Error('não deveria executar'); },
    clock: fixed('2026-08-24T12:13:00.000Z'),
  });
  assert.equal(publicDestination.status, 'denied');
  assert.equal(publicDestination.receipt.reason_code, 'destination-not-private');
  assert.equal(publicDestinationCalled, false);

  registerAccessGrant(root, {
    protocol_version: 1,
    grant_id: 'grant-runtime-read',
    subject: { type: 'system', ref: 'analisar-funil' },
    scope: {
      company_ref: 'company-local', unit_ref: 'marketing',
      system_refs: ['analisar-funil'], source_refs: ['paid-media'], actions: ['read-metrics'],
    },
    mode: 'read', assurance: 'runtime-enforced', custody: 'runtime-exclusive',
    reason: 'provar que o modelo não recebe uma credencial sem conector dedicado',
    issued_at: '2026-08-23T00:00:00.000Z', expires_at: null, revoked_at: null,
    approved_by: 'role-marketing-owner', credential_ref: 'os-keychain:runtime-test',
    receipts: { use_refs: [], revocation_ref: null },
  });
  const managedAccessRoutine = contract({
    routine_id: 'funil-managed-access',
    trigger: { type: 'manual', schedule: null },
    context: {
      prompt_ref: 'managed-prompt-must-not-be-read.md',
      access_requests: [{
        grant_ref: 'grant-runtime-read', source_ref: 'paid-media', action: 'read-metrics', mode: 'read',
      }],
    },
    destination: { kind: 'runtime-output', ref: 'routine-output' },
  });
  registerRoutineContract(root, managedAccessRoutine);
  let managedCalled = false;
  const managed = await runRoutine(root, managedAccessRoutine.routine_id, {
    spawn: () => { managedCalled = true; throw new Error('não deveria executar'); },
    secretProvider: { available: true, hasSecret: () => true },
    clock: fixed('2026-08-24T12:14:00.000Z'),
  });
  assert.equal(managed.status, 'denied');
  assert.equal(managed.receipt.reason_code, 'runtime-connector-not-bound');
  assert.equal(managedCalled, false);
  assertReferenceOnly(managed.receipt);

  const claudeBinding = binding({
    binding_id: 'executor-claude-local',
    adapter: 'claude-code',
    model_policy: { default_model: 'claude-opus-4-1', allowed_models: [] },
  });
  const claudeRoutine = contract({
    routine_id: 'funil-claude',
    trigger: { type: 'manual', schedule: null },
    executor: { binding_ref: 'executor-claude-local', requested_model: 'claude-opus-4-1', reasoning_effort: 'high' },
    context: { access_requests: [] },
    destination: { kind: 'runtime-output', ref: 'routine-output' },
  });
  saveExecutorBinding(root, claudeBinding);
  registerRoutineContract(root, claudeRoutine);
  const claudeCalls = [];
  const claude = await runRoutine(root, 'funil-claude', {
    spawn: (command, args, options) => {
      claudeCalls.push({ command, args, options });
      assert.equal(command, 'claude');
      assert.equal(options.input, `${promptMarker}\n`);
      assert.equal(args.some((arg) => arg.includes(promptMarker)), false);
      return { status: 0, stdout: JSON.stringify({ result: outputMarker }), stderr: '' };
    },
    clock: fixed('2026-08-24T12:15:00.000Z'),
  });
  assert.equal(claude.status, 'completed');
  assert.equal(claudeCalls.length, 1);
  assertReferenceOnly(claude.receipt);

  const directClaude = runModelExecutor({ ...claudeBinding, workspace_path: root }, {
    ...claudeRoutine,
    executor: { ...claudeRoutine.executor, reasoning_effort: 'xhigh' },
  }, `${promptMarker}\n`, {
    spawn: (_command, args, options) => {
      assert.equal(args.includes('xhigh'), true);
      assert.equal(options.input, `${promptMarker}\n`);
      return { status: 0, stdout: JSON.stringify({ result: outputMarker }), stderr: '' };
    },
  });
  assert.equal(directClaude.ok, true);

  const receiptFiles = readdirSync(join(root, '.cerebro', 'runtime', 'receipts', 'routines'));
  assert(receiptFiles.length >= 10);
  for (const receipt of listRoutineRunReceipts(root)) assertReferenceOnly(receipt);
  assert.equal(existsSync(join(root, '.cerebro', 'runtime', 'executors', 'executor-codex-local.json')), true);
  assert.equal(existsSync(join(root, '.cerebro', 'contracts', 'routines', 'funil-diario-cerebro.json')), true);
  const originalLayout = json(join(root, '.cerebro', 'layout.json'));
  write(join(root, '.cerebro', 'layout.json'), `${JSON.stringify({ ...originalLayout, routineOutputs: 'public/runtime' })}\n`);
  assert.throws(() => routineOutputDirectory(root), /precisa ficar em \.cerebro\/runtime/);
  write(join(root, '.cerebro', 'layout.json'), `${JSON.stringify(originalLayout)}\n`);
} finally {
  rmSync(root, { recursive: true, force: true });
}

console.log('✓ Routine Contract, private Executor Binding and deterministic scheduler validated without provider calls');
