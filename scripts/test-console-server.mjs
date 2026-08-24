#!/usr/bin/env node

import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, utimesSync, writeFileSync } from 'node:fs';
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

async function request(base, path, { method = 'GET', cookie = '', csrf = '', body = null } = {}) {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: {
      ...(cookie ? { Cookie: cookie } : {}),
      ...(csrf ? { 'X-Cerebro-CSRF': csrf } : {}),
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
      assert.equal(options.input, 'PROMPT_ONLY_ON_STDIN\n');
      assert.equal(args.includes('PROMPT_ONLY_ON_STDIN'), false);
      const outputIndex = args.indexOf('-o');
      write(args[outputIndex + 1], 'PRIVATE_OUTPUT_NOT_IN_API\n');
      return { status: 0, stdout: '{"type":"done"}\n', stderr: '' };
    },
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

  consoleView = await request(base, '/api/console', { cookie });
  const afterRun = consoleView.value.routines.find((routine) => routine.routine_id === 'funil-diario-cerebro');
  assert.equal(afterRun.actions.can_activate, false, 'migração ainda bloqueia o segundo relógio');
  assert.equal(calls.length, 1, 'recompilar read model não executa modelo');

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
  assert.equal(calls.length, 1);

  await new Promise((resolveClose) => instance.server.close(resolveClose));
  console.log('✓ Console local plural, read-only on open, CSRF-gated and legacy-cutover-safe');
} finally {
  rmSync(root, { recursive: true, force: true });
  rmSync(legacyRoot, { recursive: true, force: true });
}
