#!/usr/bin/env node

import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, utimesSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { request as httpRequest } from 'node:http';
import { registerAccessGrant } from './lib/access-runtime.mjs';
import {
  registerRoutineContract,
  registerRoutineMigration,
  saveCollectorBinding,
  saveExecutorBinding,
} from './lib/routine-protocol.mjs';
import { createConsoleServer } from './console-server.mjs';
import { bootstrapLegacyConsole, previewLegacyConsoleBootstrap } from './console-bootstrap.mjs';

const root = mkdtempSync(join(tmpdir(), 'company-brain-console-'));
const legacyRoot = mkdtempSync(join(tmpdir(), 'company-brain-legacy-console-'));
const externalRuntimeRoot = mkdtempSync(join(tmpdir(), 'company-brain-external-runtime-'));
const calls = [];
const collectorCalls = [];

function write(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, typeof value === 'string' ? value : `${JSON.stringify(value, null, 2)}\n`);
}

function example(name) {
  return JSON.parse(readFileSync(new URL(`../protocol/examples/${name}`, import.meta.url), 'utf8'));
}

function source(base, overrides) {
  return {
    ...base,
    ...overrides,
    truth: { ...base.truth, ...(overrides.truth || {}) },
    authority: { ...base.authority, ...(overrides.authority || {}) },
    scope: { ...base.scope, ...(overrides.scope || {}) },
    pii: { ...base.pii, ...(overrides.pii || {}) },
    freshness: { ...base.freshness, ...(overrides.freshness || {}) },
    retention: { ...base.retention, ...(overrides.retention || {}) },
    revocation: { ...base.revocation, ...(overrides.revocation || {}) },
    connector: { ...base.connector, ...(overrides.connector || {}) },
  };
}

function grant(grantId, sourceRef) {
  const value = example('access-grant.v1.json');
  return {
    ...value,
    grant_id: grantId,
    subject: { type: 'system', ref: 'analisar-funil' },
    scope: {
      company_ref: 'company-sanitized', unit_ref: 'marketing', system_refs: ['analisar-funil'],
      source_refs: [sourceRef], actions: ['read-metrics'],
    },
    mode: 'read',
    assurance: 'receipt-audited',
    custody: 'agent-direct',
    reason: 'fixture sanitizado de leitura local',
    issued_at: '2026-08-23T00:00:00.000Z',
    expires_at: null,
    revoked_at: null,
    approved_by: 'role-marketing-owner',
    credential_ref: null,
    receipts: { use_refs: [], revocation_ref: null },
  };
}

async function request(base, path, { method = 'GET', cookie = '', csrf = '', body = null, origin = base } = {}) {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: {
      ...(cookie ? { Cookie: cookie } : {}),
      ...(csrf ? { 'X-Cerebro-CSRF': csrf } : {}),
      ...(method === 'POST' ? { Origin: origin } : {}),
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const contentType = response.headers.get('content-type') || '';
  return {
    status: response.status,
    cookie: response.headers.get('set-cookie'),
    value: contentType.includes('application/json') ? await response.json() : await response.text(),
  };
}

function requestWithHost(base, host) {
  const url = new URL(base);
  return new Promise((resolveRequest, rejectRequest) => {
    const call = httpRequest({
      hostname: '127.0.0.1', port: Number(url.port), path: '/', method: 'GET', headers: { Host: host },
    }, (response) => {
      response.resume();
      response.on('end', () => resolveRequest(response.statusCode));
    });
    call.on('error', rejectRequest);
    call.end();
  });
}

try {
  write(join(legacyRoot, 'AGENTS.md'), '# Legacy brain\n');
  write(join(legacyRoot, '.git', 'info', 'exclude'), '# local excludes\n');
  assert.equal(previewLegacyConsoleBootstrap(legacyRoot).status, 'ready');
  const bootstrapped = bootstrapLegacyConsole(legacyRoot, { confirm: true });
  assert.equal(bootstrapped.status, 'created');
  assert.equal(bootstrapLegacyConsole(legacyRoot, { confirm: true }).status, 'no-change');
  assert.equal(JSON.parse(readFileSync(join(legacyRoot, '.cerebro', 'legacy-brain.json'), 'utf8')).compatibility, 'legacy-vault');
  assert(readFileSync(join(legacyRoot, '.git', 'info', 'exclude'), 'utf8').includes('.cerebro/runtime/'));

  write(join(root, 'VERSION'), 'fixture\n');
  write(join(root, 'COMECE-AQUI.md'), '# Fixture sanitizado\n');
  write(join(root, '.cerebro', 'layout.json'), {
    version: 3,
    systemContracts: '.cerebro/contracts/systems',
    sourceContracts: '.cerebro/contracts/sources',
    accessGrants: '.cerebro/contracts/access-grants',
    accessReceipts: '.cerebro/runtime/receipts/access',
    routineContracts: '.cerebro/contracts/routines',
    executorBindings: '.cerebro/runtime/executors',
    collectorBindings: '.cerebro/runtime/collectors',
    routineReceipts: '.cerebro/runtime/receipts/routines',
    routineState: '.cerebro/runtime/routines',
    routineOutputs: '.cerebro/runtime/outputs/routines',
    routineJudgments: '.cerebro/runtime/judgments',
    routineCorrections: '.cerebro/runtime/corrections',
    learningCandidates: '.cerebro/runtime/learning-candidates',
    routineMigrations: '.cerebro/runtime/migrations/routines',
  });
  write(join(root, '.cerebro', 'private-ignore.manifest'), '.cerebro/runtime\n.cerebro/contracts/\noperacao/execucoes/*\n');
  write(join(root, 'operacao', 'rotinas', 'funil-diario.prompt.md'), 'PROMPT_ONLY_ON_STDIN\n');

  const sourceExample = example('source-contract.v1.json');
  const sources = [
    source(sourceExample, { source_id: 'paid-media', name: 'Mídia paga' }),
    source(sourceExample, {
      source_id: 'sales-ledger', name: 'Vendas confirmadas', type: 'local-file',
      truth: { home_ref: 'local:sales-ledger' }, sensitivity: 'private',
      pii: { classification: 'possible', handling: 'local-processing' }, modes: ['read'],
      connector: { kind: 'local-file', binding_ref: null, credential_ref: null, custody: 'agent-direct' },
      assurance: 'receipt-audited',
    }),
    source(sourceExample, {
      source_id: 'experiment-ledger', name: 'Experimentos anteriores', type: 'local-folder',
      truth: { home_ref: 'local:experiment-ledger' },
      connector: { kind: 'local-folder', binding_ref: null, credential_ref: null, custody: 'agent-direct' },
      assurance: 'receipt-audited',
    }),
  ];
  for (const item of sources) write(join(root, '.cerebro', 'contracts', 'sources', `${item.source_id}.json`), item);

  const systemExample = example('system-contract.v2.json');
  write(join(root, '.cerebro', 'contracts', 'systems', 'analisar-funil.json'), {
    ...systemExample,
    extensions: { area_ref: 'marketing' },
  });
  write(join(root, '.cerebro', 'contracts', 'systems', 'projetar-vendas.json'), {
    ...systemExample,
    system_id: 'projetar-vendas',
    name: 'Projetar próxima ação comercial',
    extensions: { area_ref: 'vendas' },
  });

  for (const [grantId, sourceRef] of [
    ['grant-funnel-media', 'paid-media'],
    ['grant-funnel-sales', 'sales-ledger'],
    ['grant-funnel-experiments', 'experiment-ledger'],
  ]) registerAccessGrant(root, grant(grantId, sourceRef));

  const routineExample = example('routine-contract.v1.json');
  registerRoutineContract(root, {
    ...routineExample,
    destination: { kind: 'runtime-output', ref: 'routine-output' },
    extensions: {
      preparation: {
        kind: 'trusted-local-command',
        binding_ref: 'collector-funnel-local',
        output_ref: '.automacao/_FUNIL-ULTIMO.json',
      },
    },
    context: {
      ...routineExample.context,
      access_requests: [
        { grant_ref: 'grant-funnel-media', source_ref: 'paid-media', action: 'read-metrics', mode: 'read' },
        { grant_ref: 'grant-funnel-sales', source_ref: 'sales-ledger', action: 'read-metrics', mode: 'read' },
        { grant_ref: 'grant-funnel-experiments', source_ref: 'experiment-ledger', action: 'read-metrics', mode: 'read' },
      ],
    },
  });
  registerRoutineContract(root, {
    ...routineExample,
    routine_id: 'revisao-comercial-semanal',
    name: 'Revisão comercial semanal',
    system_ref: 'projetar-vendas',
    trigger: { type: 'manual', schedule: null },
    context: { prompt_ref: 'operacao/rotinas/funil-diario.prompt.md', access_requests: [] },
    destination: { kind: 'runtime-output', ref: 'routine-output' },
  });
  registerRoutineMigration(root, example('routine-migration.v1.json'));
  saveExecutorBinding(root, example('executor-binding.v1.json'));
  saveCollectorBinding(root, example('collector-binding.v1.json'));

  const instance = createConsoleServer({
    root,
    sessionToken: 'fixed-session-token',
    csrfToken: 'fixed-csrf-token',
    clock: () => new Date('2026-08-24T11:29:00.000Z'),
    spawnCollector: (command, args) => {
      collectorCalls.push({ command, args });
      write(join(root, '.automacao', '_FUNIL-ULTIMO.json'), '{"sanitized":true}\n');
      const future = new Date('2026-08-24T11:29:00.000Z');
      const path = join(root, '.automacao', '_FUNIL-ULTIMO.json');
      utimesSync(path, future, future);
      return { status: 0, stdout: 'PRIVATE_COLLECTOR_OUTPUT', stderr: '' };
    },
    spawn: (command, args, options) => {
      calls.push({ command, args, options });
      assert.equal(command, 'codex');
      if (calls.length === 1) {
        assert(options.input.includes('PROMPT_ONLY_ON_STDIN\n'));
        assert(options.input.includes('Isto é um Run de uma Routine Contract já registrada e governada.'));
      }
      else assert(options.input.includes('Separar melhor a inferência da recomendação.'));
      assert.equal(args.includes('PROMPT_ONLY_ON_STDIN'), false);
      const outputIndex = args.indexOf('-o');
      write(args[outputIndex + 1], calls.length === 1
        ? 'PRIVATE_OUTPUT_NOT_IN_API\n'
        : 'CORRECTED_PRIVATE_OUTPUT_NOT_IN_READ_MODEL\n');
      return { status: 0, stdout: '{"type":"done"}\n', stderr: '' };
    },
    hermesRunner: (_command, args) => args[0] === '--version'
      ? { status: null, stdout: '', stderr: '', error: { code: 'ENOENT' } }
      : { status: 1, stdout: '', stderr: '', error: null },
  });
  await new Promise((resolveListen) => instance.server.listen(0, '127.0.0.1', resolveListen));
  const base = `http://127.0.0.1:${instance.server.address().port}`;

  const page = await request(base, '/');
  assert.equal(page.status, 200);
  assert(page.value.includes('Company Brain'));
  assert.equal(calls.length, 0, 'abrir a UI não pode executar modelo');
  assert.equal(await requestWithHost(base, 'attacker.example'), 421, 'DNS rebinding host precisa ser negado');
  const cookie = page.cookie.split(';', 1)[0];
  assert.equal((await request(base, '/api/console')).status, 403);
  const session = await request(base, '/api/session', { cookie });
  assert.equal(session.value.csrf_token, 'fixed-csrf-token');

  let consoleView = await request(base, '/api/console', { cookie });
  assert.equal(consoleView.status, 200);
  assert.equal(consoleView.value.counts.areas, 2);
  assert.equal(consoleView.value.counts.systems, 2);
  assert.equal(consoleView.value.counts.sources, 3);
  assert.equal(consoleView.value.counts.routines, 2);
  assert.equal(consoleView.value.counts.judgments, 0);
  assert.equal(consoleView.value.cache.kind, 'none');
  const funnel = consoleView.value.routines.find((routine) => routine.routine_id === 'funil-diario-cerebro');
  assert.equal(funnel.health_reason_code, 'legacy-schedule-not-paused');
  assert.equal(funnel.preparation.status, 'ready');
  assert.equal(funnel.access.find((item) => item.source_ref === 'sales-ledger').assurance, 'receipt-audited');
  assert.equal(JSON.stringify(consoleView.value).includes('PRIVATE_OUTPUT_NOT_IN_API'), false);
  assert.equal(calls.length, 0);

  const missingCsrf = await request(base, '/api/routines/funil-diario-cerebro/run', {
    method: 'POST', cookie, body: { confirm: true },
  });
  assert.equal(missingCsrf.status, 403);
  assert.equal(calls.length, 0);
  const invalidOrigin = await request(base, '/api/routines/funil-diario-cerebro/run', {
    method: 'POST', cookie, csrf: 'fixed-csrf-token', origin: 'https://attacker.example', body: { confirm: true },
  });
  assert.equal(invalidOrigin.status, 403);
  assert.equal(invalidOrigin.value.reason_code, 'origin-invalid');
  assert.equal(calls.length, 0);
  const missingConfirm = await request(base, '/api/routines/funil-diario-cerebro/run', {
    method: 'POST', cookie, csrf: 'fixed-csrf-token', body: { confirm: false },
  });
  assert.equal(missingConfirm.status, 400);
  assert.equal(calls.length, 0);

  const run = await request(base, '/api/routines/funil-diario-cerebro/run', {
    method: 'POST', cookie, csrf: 'fixed-csrf-token', body: { confirm: true },
  });
  assert.equal(run.status, 200);
  assert.equal(run.value.status, 'completed');
  assert.equal(calls.length, 1);
  assert.equal(collectorCalls.length, 1);
  assert.equal(JSON.stringify(run.value).includes('PRIVATE_OUTPUT_NOT_IN_API'), false);

  const receiptId = run.value.receipt_ref.replace('routine-receipt:', '');
  const receiptPath = join(root, '.cerebro', 'runtime', 'receipts', 'routines', `${receiptId}.json`);
  const receiptFixture = JSON.parse(readFileSync(receiptPath, 'utf8'));
  assert.equal((await request(base, `/api/runs/${receiptId}/output`)).status, 403);
  const output = await request(base, `/api/runs/${receiptId}/output`, { cookie });
  assert.equal(output.status, 200, JSON.stringify({ response: output.value, output_ref: receiptFixture.output_ref, root }));
  assert.equal(output.value.output.content, 'PRIVATE_OUTPUT_NOT_IN_API\n');
  assert.equal(output.value.judgment.summary.status, 'pending');
  assert.equal(calls.length, 1, 'abrir output não pode executar modelo');

  consoleView = await request(base, '/api/console', { cookie });
  const afterRun = consoleView.value.routines.find((routine) => routine.routine_id === 'funil-diario-cerebro');
  assert.equal(afterRun.actions.can_activate, false, 'migração ainda bloqueia o segundo relógio');
  assert.equal(consoleView.value.counts.judgments, 1);
  assert.equal(consoleView.value.judgments[0].judgment.status, 'pending');
  assert.equal(JSON.stringify(consoleView.value).includes('PRIVATE_OUTPUT_NOT_IN_API'), false);
  assert.equal(calls.length, 1, 'recompilar read model não executa modelo');

  const outsideId = 'routine-receipt-outside';
  write(join(root, 'private-outside.md'), 'OUTSIDE_RUNTIME\n');
  write(join(root, '.cerebro', 'runtime', 'receipts', 'routines', `${outsideId}.json`), {
    ...receiptFixture,
    receipt_id: outsideId,
    run_id: 'routine-run-outside',
    slot_key: 'slot-outside',
    output_ref: 'private-outside.md',
  });
  const outside = await request(base, `/api/runs/${outsideId}/output`, { cookie });
  assert.equal(outside.status, 400);
  assert.equal(outside.value.reason_code, 'output-outside-runtime');

  const binaryId = 'routine-receipt-binary';
  const binaryRef = '.cerebro/runtime/outputs/routines/private-binary.bin';
  writeFileSync(join(root, binaryRef), Buffer.from([0, 1, 2, 3]));
  write(join(root, '.cerebro', 'runtime', 'receipts', 'routines', `${binaryId}.json`), {
    ...receiptFixture,
    receipt_id: binaryId,
    run_id: 'routine-run-binary',
    slot_key: 'slot-binary',
    output_ref: binaryRef,
  });
  const binary = await request(base, `/api/runs/${binaryId}/output`, { cookie });
  assert.equal(binary.status, 400);
  assert.equal(binary.value.reason_code, 'output-binary-blocked');

  const encodingId = 'routine-receipt-invalid-encoding';
  const encodingRef = '.cerebro/runtime/outputs/routines/private-invalid-encoding.md';
  writeFileSync(join(root, encodingRef), Buffer.from([0xc3, 0x28]));
  write(join(root, '.cerebro', 'runtime', 'receipts', 'routines', `${encodingId}.json`), {
    ...receiptFixture,
    receipt_id: encodingId,
    run_id: 'routine-run-invalid-encoding',
    slot_key: 'slot-invalid-encoding',
    output_ref: encodingRef,
  });
  const encoding = await request(base, `/api/runs/${encodingId}/output`, { cookie });
  assert.equal(encoding.status, 400);
  assert.equal(encoding.value.reason_code, 'output-encoding-invalid');

  const directoryId = 'routine-receipt-output-directory';
  const directoryRef = '.cerebro/runtime/outputs/routines/private-directory';
  mkdirSync(join(root, directoryRef));
  write(join(root, '.cerebro', 'runtime', 'receipts', 'routines', `${directoryId}.json`), {
    ...receiptFixture,
    receipt_id: directoryId,
    run_id: 'routine-run-output-directory',
    slot_key: 'slot-output-directory',
    output_ref: directoryRef,
  });
  const directoryOutput = await request(base, `/api/runs/${directoryId}/output`, { cookie });
  assert.equal(directoryOutput.status, 400);
  assert.equal(directoryOutput.value.reason_code, 'output-not-file');

  if (process.platform !== 'win32') {
    const symlinkId = 'routine-receipt-symlink';
    const symlinkRef = '.cerebro/runtime/outputs/routines/private-symlink.md';
    symlinkSync(join(root, 'private-outside.md'), join(root, symlinkRef));
    write(join(root, '.cerebro', 'runtime', 'receipts', 'routines', `${symlinkId}.json`), {
      ...receiptFixture,
      receipt_id: symlinkId,
      run_id: 'routine-run-symlink',
      slot_key: 'slot-symlink',
      output_ref: symlinkRef,
    });
    const symlink = await request(base, `/api/runs/${symlinkId}/output`, { cookie });
    assert.equal(symlink.status, 400);
    assert.equal(symlink.value.reason_code, 'output-symlink-blocked');
  }

  const judgmentNoCsrf = await request(base, `/api/runs/${receiptId}/judgments`, {
    method: 'POST', cookie,
    body: { confirm: true, approved_by: 'role-owner', verdict: 'approved', action_intent: 'none', note: '' },
  });
  assert.equal(judgmentNoCsrf.status, 403);
  const emptyChange = await request(base, `/api/runs/${receiptId}/judgments`, {
    method: 'POST', cookie, csrf: 'fixed-csrf-token',
    body: { confirm: true, approved_by: 'role-owner', verdict: 'changes-requested', action_intent: 'none', note: '' },
  });
  assert.equal(emptyChange.status, 400);
  assert.equal(emptyChange.value.reason_code, 'judgment-note-required');
  const invalidVerdict = await request(base, `/api/runs/${receiptId}/judgments`, {
    method: 'POST', cookie, csrf: 'fixed-csrf-token',
    body: { confirm: true, approved_by: 'role-owner', verdict: 'publish', action_intent: 'none', note: '' },
  });
  assert.equal(invalidVerdict.status, 400);
  assert.equal(invalidVerdict.value.reason_code, 'judgment-verdict-invalid');
  const invalidAction = await request(base, `/api/runs/${receiptId}/judgments`, {
    method: 'POST', cookie, csrf: 'fixed-csrf-token',
    body: { confirm: true, approved_by: 'role-owner', verdict: 'approved', action_intent: 'execute', note: '' },
  });
  assert.equal(invalidAction.status, 400);
  assert.equal(invalidAction.value.reason_code, 'judgment-action-intent-invalid');
  const secretNote = await request(base, `/api/runs/${receiptId}/judgments`, {
    method: 'POST', cookie, csrf: 'fixed-csrf-token',
    body: {
      confirm: true, approved_by: 'role-owner', verdict: 'changes-requested',
      action_intent: 'none', note: 'Bearer token-nao-pode-ser-registrado',
    },
  });
  assert.equal(secretNote.status, 400);
  assert.equal(secretNote.value.reason_code, 'note-parece-conter-segredo');

  const approval = await request(base, `/api/runs/${receiptId}/judgments`, {
    method: 'POST', cookie, csrf: 'fixed-csrf-token',
    body: { confirm: true, approved_by: 'role-owner', verdict: 'approved', action_intent: 'none', note: '' },
  });
  assert.equal(approval.status, 200);
  assert.equal(approval.value.summary.verdict, 'approved');
  assert.equal(approval.value.external_action_executed, false);
  consoleView = await request(base, '/api/console', { cookie });
  assert.equal(consoleView.value.judgments.filter((item) => item.receipt_id === receiptId && item.judgment.status === 'pending').length, 0);
  assert.equal(consoleView.value.judgments.find((item) => item.receipt_id === receiptId).judgment.verdict, 'approved');
  assert.equal(JSON.stringify(consoleView.value).includes('PRIVATE_OUTPUT_NOT_IN_API'), false);
  const learningWithoutCorrection = await request(base, `/api/runs/${receiptId}/learning-candidates`, {
    method: 'POST', cookie, csrf: 'fixed-csrf-token',
    body: { confirm: true, approved_by: 'role-owner' },
  });
  assert.equal(learningWithoutCorrection.status, 400);
  assert.equal(learningWithoutCorrection.value.reason_code, 'completed-correction-required');

  const change = await request(base, `/api/runs/${receiptId}/judgments`, {
    method: 'POST', cookie, csrf: 'fixed-csrf-token',
    body: {
      confirm: true, approved_by: 'role-owner', verdict: 'changes-requested',
      action_intent: 'none', note: 'Separar melhor a inferência da recomendação.',
    },
  });
  assert.equal(change.status, 200);
  assert.equal(change.value.summary.history_count, 2);
  const correctionRerun = await request(base, `/api/runs/${receiptId}/rerun-with-correction`, {
    method: 'POST', cookie, csrf: 'fixed-csrf-token',
    body: { confirm: true, approved_by: 'role-owner' },
  });
  assert.equal(correctionRerun.status, 200);
  assert.equal(correctionRerun.value.status, 'completed');
  assert.equal(correctionRerun.value.correction_shared_with_provider, true);
  assert.equal(correctionRerun.value.external_action_executed, false);
  assert.equal(calls.length, 2);
  const correctedReceiptId = correctionRerun.value.resulting_receipt_ref.replace('routine-receipt:', '');
  const duplicateCorrection = await request(base, `/api/runs/${receiptId}/rerun-with-correction`, {
    method: 'POST', cookie, csrf: 'fixed-csrf-token',
    body: { confirm: true, approved_by: 'role-owner' },
  });
  assert.equal(duplicateCorrection.status, 400);
  assert.equal(duplicateCorrection.value.reason_code, 'correction-already-rerun');
  assert.equal(calls.length, 2, 'o mesmo Judgment Receipt só autoriza um rerun');

  const correctedOutput = await request(base, `/api/runs/${correctedReceiptId}/output`, { cookie });
  assert.equal(correctedOutput.status, 200);
  assert.equal(correctedOutput.value.output.content, 'CORRECTED_PRIVATE_OUTPUT_NOT_IN_READ_MODEL\n');
  assert.equal(correctedOutput.value.judgment.summary.status, 'pending');
  assert.equal(correctedOutput.value.correction.role, 'candidate');
  assert.equal(correctedOutput.value.correction_actions.can_compare, true);
  assert.equal(correctedOutput.value.correction_actions.can_create_learning_candidate, false);
  const comparisonWithoutSession = await request(base, `/api/runs/${correctedReceiptId}/comparison`);
  assert.equal(comparisonWithoutSession.status, 403);
  const comparison = await request(base, `/api/runs/${correctedReceiptId}/comparison`, { cookie });
  assert.equal(comparison.status, 200);
  assert.equal(comparison.value.baseline.output.content, 'PRIVATE_OUTPUT_NOT_IN_API\n');
  assert.equal(comparison.value.candidate.output.content, 'CORRECTED_PRIVATE_OUTPUT_NOT_IN_READ_MODEL\n');
  assert.equal(comparison.value.privacy.model_executed, false);
  const learningBeforeApproval = await request(base, `/api/runs/${correctedReceiptId}/learning-candidates`, {
    method: 'POST', cookie, csrf: 'fixed-csrf-token',
    body: { confirm: true, approved_by: 'role-owner' },
  });
  assert.equal(learningBeforeApproval.status, 400);
  assert.equal(learningBeforeApproval.value.reason_code, 'approved-correction-required');

  consoleView = await request(base, '/api/console', { cookie });
  assert.equal(consoleView.value.judgments.find((item) => item.receipt_id === correctedReceiptId).judgment.status, 'pending');
  assert.equal(JSON.stringify(consoleView.value).includes('CORRECTED_PRIVATE_OUTPUT_NOT_IN_READ_MODEL'), false);
  assert.equal(JSON.stringify(consoleView.value).includes('Separar melhor a inferência da recomendação.'), false);
  const correctedApproval = await request(base, `/api/runs/${correctedReceiptId}/judgments`, {
    method: 'POST', cookie, csrf: 'fixed-csrf-token',
    body: { confirm: true, approved_by: 'role-owner', verdict: 'approved', action_intent: 'none', note: '' },
  });
  assert.equal(correctedApproval.status, 200);
  const learning = await request(base, `/api/runs/${correctedReceiptId}/learning-candidates`, {
    method: 'POST', cookie, csrf: 'fixed-csrf-token',
    body: { confirm: true, approved_by: 'role-owner' },
  });
  assert.equal(learning.status, 200);
  assert.equal(learning.value.occurrences, 1);
  assert.equal(learning.value.promotion_threshold, 3);
  assert.equal(learning.value.replay_status, 'not-eligible');
  assert.equal(learning.value.motor_changed, false);
  assert.equal(learning.value.external_action_executed, false);
  consoleView = await request(base, '/api/console', { cookie });
  assert.equal(consoleView.value.counts.learning_candidates, 1);
  assert.equal(consoleView.value.judgments.find((item) => item.receipt_id === correctedReceiptId).correction.learning_candidate.occurrences, 1);

  const actionIntent = await request(base, `/api/runs/${receiptId}/judgments`, {
    method: 'POST', cookie, csrf: 'fixed-csrf-token',
    body: {
      confirm: true, approved_by: 'role-owner', verdict: 'approved',
      action_intent: 'propose-action', note: 'Preparar uma hipótese de experimento para revisão.',
    },
  });
  assert.equal(actionIntent.status, 200);
  assert.equal(actionIntent.value.summary.action_intent, 'propose-action');
  assert.equal(actionIntent.value.external_action_executed, false);
  assert.equal(calls.length, 2, 'julgar, comparar, candidatar ou propor ação não pode executar modelo');
  const judgedOutput = await request(base, `/api/runs/${receiptId}/output`, { cookie });
  assert.equal(judgedOutput.value.judgment.history.length, 3);
  assert.equal(judgedOutput.value.judgment.summary.action_intent, 'propose-action');
  assert.equal(judgedOutput.value.judgment.current.note, 'Preparar uma hipótese de experimento para revisão.');

  assert.equal((await request(base, '/api/runs/receipt-does-not-exist/output', { cookie })).value.reason_code, 'routine-receipt-not-found');
  const oversizedId = 'routine-receipt-oversized';
  const oversizedRef = '.cerebro/runtime/outputs/routines/private-oversized.md';
  writeFileSync(join(root, oversizedRef), Buffer.alloc(512 * 1024 + 1, 65));
  write(join(root, '.cerebro', 'runtime', 'receipts', 'routines', `${oversizedId}.json`), {
    ...receiptFixture,
    receipt_id: oversizedId,
    run_id: 'routine-run-oversized',
    slot_key: 'slot-oversized',
    output_ref: oversizedRef,
  });
  const oversized = await request(base, `/api/runs/${oversizedId}/output`, { cookie });
  assert.equal(oversized.status, 400);
  assert.equal(oversized.value.reason_code, 'output-too-large');

  const failedId = 'routine-receipt-failed-output';
  write(join(root, '.cerebro', 'runtime', 'receipts', 'routines', `${failedId}.json`), {
    ...receiptFixture,
    receipt_id: failedId,
    run_id: 'routine-run-failed-output',
    slot_key: 'slot-failed-output',
    status: 'failed',
    reason_code: 'executor-failed',
  });
  const failedOutput = await request(base, `/api/runs/${failedId}/output`, { cookie });
  assert.equal(failedOutput.status, 400);
  assert.equal(failedOutput.value.reason_code, 'output-not-available');

  if (process.platform !== 'win32') {
    const layoutPath = join(root, '.cerebro', 'layout.json');
    const originalLayout = JSON.parse(readFileSync(layoutPath, 'utf8'));
    const linkedOutputs = '.cerebro/runtime/linked-outputs';
    write(join(externalRuntimeRoot, 'private-linked.md'), 'EXTERNAL_OUTPUT_MUST_NOT_OPEN\n');
    symlinkSync(externalRuntimeRoot, join(root, linkedOutputs));
    write(layoutPath, { ...originalLayout, routineOutputs: linkedOutputs });
    const linkedOutputId = 'routine-receipt-linked-output-root';
    write(join(root, '.cerebro', 'runtime', 'receipts', 'routines', `${linkedOutputId}.json`), {
      ...receiptFixture,
      receipt_id: linkedOutputId,
      run_id: 'routine-run-linked-output-root',
      slot_key: 'slot-linked-output-root',
      output_ref: `${linkedOutputs}/private-linked.md`,
    });
    const linkedOutput = await request(base, `/api/runs/${linkedOutputId}/output`, { cookie });
    assert.equal(linkedOutput.status, 400);
    assert.equal(linkedOutput.value.reason_code, 'output-root-symlink-blocked');

    const linkedJudgments = '.cerebro/runtime/linked-judgments';
    symlinkSync(externalRuntimeRoot, join(root, linkedJudgments));
    write(layoutPath, { ...originalLayout, routineJudgments: linkedJudgments });
    const linkedJudgment = await request(base, `/api/runs/${receiptId}/judgments`, {
      method: 'POST', cookie, csrf: 'fixed-csrf-token',
      body: { confirm: true, approved_by: 'role-owner', verdict: 'approved', action_intent: 'none', note: '' },
    });
    assert.equal(linkedJudgment.status, 400);
    assert.equal(linkedJudgment.value.reason_code, 'judgment-storage-symlink-blocked');
    write(layoutPath, originalLayout);
  }

  const pauseReadback = await request(base, '/api/routines/funil-diario-cerebro/confirm-legacy-pause', {
    method: 'POST', cookie, csrf: 'fixed-csrf-token',
    body: { confirm: true, approved_by: 'role-owner', evidence_ref: 'readback:legacy-paused' },
  });
  assert.equal(pauseReadback.status, 200);
  const activation = await request(base, '/api/routines/funil-diario-cerebro/activate', {
    method: 'POST', cookie, csrf: 'fixed-csrf-token',
    body: { confirm: true, approved_by: 'role-owner', evidence_ref: run.value.receipt_ref },
  });
  assert.equal(activation.status, 200);
  consoleView = await request(base, '/api/console', { cookie });
  const active = consoleView.value.routines.find((routine) => routine.routine_id === 'funil-diario-cerebro');
  assert.equal(active.health_reason_code, 'active');
  assert.equal(active.migration.status, 'cutover-completed');
  assert.equal(calls.length, 2);

  await new Promise((resolveClose) => instance.server.close(resolveClose));
  console.log('✓ Console local fecha julgamento → correção → comparação → candidato sem ação externa');
} finally {
  rmSync(root, { recursive: true, force: true });
  rmSync(legacyRoot, { recursive: true, force: true });
  rmSync(externalRuntimeRoot, { recursive: true, force: true });
}
