#!/usr/bin/env node

import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, statSync, symlinkSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildCockpitReadModel } from './lib/cockpit-read-model.mjs';
import {
  bindHermesProject,
  configureHermesTelegram,
  disconnectHermesTelegram,
  hermesRuntimeInternals,
  readHermesStatus,
} from './lib/hermes-runtime.mjs';
import { cockpitInternals } from './cockpit.mjs';
import { createConsoleServer } from './console-server.mjs';

const sandbox = mkdtempSync(join(tmpdir(), 'cerebro-cockpit-'));
const brain = join(sandbox, 'brain');
const hermesHome = join(sandbox, '.hermes');
const envPath = join(hermesHome, '.env');
const configPath = join(hermesHome, 'config.yaml');
const calls = [];

function write(path, value, mode) {
  mkdirSync(join(path, '..'), { recursive: true });
  writeFileSync(path, value, mode ? { mode } : undefined);
}

function result(stdout = '', status = 0) {
  return { status, stdout, stderr: '', error: null };
}

function runner(command, args) {
  calls.push([command, ...args]);
  const key = args.join(' ');
  if (key === '--version') return result('Hermes Agent 0.9.0\n');
  if (key === 'config path') return result(`${configPath}\n`);
  if (key === 'config env-path') return result(`${envPath}\n`);
  if (key === 'config get model.default --json') return result('"openai-codex/gpt-codex"\n');
  if (key === 'config get terminal.cwd --json') return result(`${JSON.stringify(brain)}\n`);
  if (key === 'config get skills.trusted_project_dirs --json') return result(`${JSON.stringify([brain])}\n`);
  if (key === 'gateway status') return result('Service installed\nStatus: running\n');
  return result('ok\n');
}

async function demoReadOnly() {
  const instance = createConsoleServer({ root: brain, demo: true, hermesRunner: runner });
  await new Promise((resolve) => instance.server.listen(0, '127.0.0.1', resolve));
  const port = instance.server.address().port;
  try {
    const page = await fetch(`http://127.0.0.1:${port}/`);
    const cookie = page.headers.get('set-cookie').split(';', 1)[0];
    const session = await fetch(`http://127.0.0.1:${port}/api/session`, { headers: { Cookie: cookie } });
    const csrf = (await session.json()).csrf_token;
    const output = await fetch(`http://127.0.0.1:${port}/api/runs/demo-run-001/output`, { headers: { Cookie: cookie } });
    assert.equal(output.status, 200);
    assert.match((await output.json()).output.content, /Demonstração sintética/);
    const mutation = await fetch(`http://127.0.0.1:${port}/api/integrations/hermes/doctor`, {
      method: 'POST',
      headers: { Cookie: cookie, 'Content-Type': 'application/json', 'X-Cerebro-CSRF': csrf },
      body: JSON.stringify({ confirm: true }),
    });
    assert.equal(mutation.status, 409);
    assert.equal((await mutation.json()).reason_code, 'demo-read-only');
  } finally {
    await new Promise((resolve) => instance.server.close(resolve));
  }
}

async function portFallback() {
  const blocker = createServer((_request, response) => response.end('busy'));
  let ownsBlocker = false;
  try {
    await new Promise((resolve, reject) => {
      blocker.once('error', reject);
      blocker.listen(4782, '127.0.0.1', resolve);
    });
    ownsBlocker = true;
  } catch (error) {
    if (error?.code !== 'EADDRINUSE') throw error;
  }
  const cockpit = await cockpitInternals.start({ root: brain, port: null, open: false, demo: true });
  try {
    assert(cockpit.port >= 4782 && cockpit.port <= 4791);
    if (ownsBlocker) assert.notEqual(cockpit.port, 4782);
  } finally {
    await new Promise((resolve) => cockpit.server.close(resolve));
    if (ownsBlocker) await new Promise((resolve) => blocker.close(resolve));
  }
}

try {
  mkdirSync(join(brain, '.cerebro', 'concierge-runs'), { recursive: true });
  write(join(brain, 'VERSION'), '9.9.9\n');
  write(join(brain, 'COMECE-AQUI.md'), '# Comece\n');
  write(join(brain, '.cerebro', 'concierge-runs', 'run-001.json'), `${JSON.stringify({
    schemaVersion: 1,
    runId: 'run-001',
    systemId: 'cerebro-base',
    milestones: { T0: '2026-08-28T10:00:00.000Z', T1: '2026-08-28T10:01:00.000Z' },
    interventions: [],
  })}\n`);
  write(join(brain, 'operacao', 'decisoes-pendentes', 'aprovar.md'), '# Aprovar a entrega\n');
  write(join(brain, 'conexoes', '_CATALOGO.md'), '# Conexões\n\n## Disponível\n\n- Google Drive: opcional\n');
  write(join(brain, 'comunidade', 'inevita', '_CATALOGO.md'), '# Comunidade\n\n## Disponível agora\n\n- **Calls em Decisões (beta):** pronto\n\n## Em construção\n\n- Marketplace\n');
  mkdirSync(hermesHome, { recursive: true });
  write(configPath, `model:\n  default: openai-codex/gpt-codex\nterminal:\n  cwd: "${brain}"\nskills:\n  trusted_project_dirs:\n    - "${brain}"\n`);
  write(envPath, '# preserve\nUNRELATED=value\nGATEWAY_ALLOW_ALL_USERS=true\n', 0o600);

  const cockpit = buildCockpitReadModel(brain);
  assert.equal(cockpit.activation.percent, 40);
  assert.equal(cockpit.activation.stages[2].current, true);
  assert.equal(cockpit.decisions[0].title, 'Aprovar a entrega');
  assert.equal(cockpit.community.cta_url, 'https://inevitasociety.com');
  assert.equal(cockpit.community.items.find((item) => item.name.includes('Calls'))?.status, 'beta');

  const token = `123456789:${'a'.repeat(32)}`;
  const configured = configureHermesTelegram(brain, { token, allowed_users: ['123456789'] }, { runner });
  assert.equal(configured.allowed_user_count, 1);
  assert.equal(JSON.stringify(configured).includes(token), false);
  assert.equal(calls.some((call) => call.join(' ').includes(token)), false);
  const env = readFileSync(envPath, 'utf8');
  assert.match(env, /UNRELATED=value/);
  assert.match(env, /TELEGRAM_BOT_TOKEN=123456789:/);
  assert.match(env, /TELEGRAM_ALLOWED_USERS=123456789/);
  assert.match(env, /GATEWAY_ALLOW_ALL_USERS=false/);
  if (process.platform !== 'win32') assert.equal(statSync(envPath).mode & 0o777, 0o600);

  const status = readHermesStatus(brain, { runner });
  assert.equal(status.installed, true);
  assert.equal(status.project_bound, true);
  assert.equal(status.skills_trusted, true);
  assert.equal(status.telegram.token_configured, true);
  assert.equal(status.gateway.running, true);
  assert.equal(JSON.stringify(status).includes(token), false);

  bindHermesProject(brain, { runner });
  assert(calls.some((call) => call.slice(1).join(' ') === `config set terminal.cwd ${brain}`));
  assert(calls.some((call) => call.slice(1).join(' ') === `skills trust ${brain}`));
  const fallbackCalls = [];
  const fallbackRunner = (command, args) => {
    fallbackCalls.push([command, ...args]);
    if (args.join(' ') === 'skills trust --help') return result('', 2);
    return runner(command, args);
  };
  bindHermesProject(brain, { runner: fallbackRunner });
  assert(fallbackCalls.some((call) => call.slice(1).join(' ') === `config set skills.external_dirs.0 ${join(brain, '.agents', 'skills')}`));

  disconnectHermesTelegram(brain, { runner });
  const disconnected = readFileSync(envPath, 'utf8');
  assert.equal(disconnected.includes('TELEGRAM_BOT_TOKEN='), false);
  assert.match(disconnected, /UNRELATED=value/);
  assert.throws(() => configureHermesTelegram(brain, { token: 'invalid', allowed_users: ['123456789'] }, { runner }), /telegram-token-invalid/);
  assert.throws(() => hermesRuntimeInternals.allowedUsers(['not-an-id']), /telegram-allowed-users-invalid/);

  if (process.platform !== 'win32') {
    const target = join(sandbox, 'outside-env');
    write(target, 'DO_NOT_TOUCH=yes\n');
    rmSync(envPath);
    symlinkSync(target, envPath);
    assert.throws(() => configureHermesTelegram(brain, { token, allowed_users: ['123456789'] }, { runner }), /hermes-env-symlink-denied/);
    assert.equal(readFileSync(target, 'utf8'), 'DO_NOT_TOUCH=yes\n');
  }

  assert.deepEqual(cockpitInternals.parseArgs(['--demo', '--no-open', '--root', brain, '--port=4999']), {
    root: brain, port: 4999, open: false, demo: true,
  });
  const launches = [];
  cockpitInternals.openBrowser('http://127.0.0.1:4782', 'darwin', (command, args, options) => {
    launches.push({ command, args, options });
    return { unref() {} };
  });
  assert.deepEqual(launches[0].args, ['http://127.0.0.1:4782']);
  assert.equal(launches[0].options.shell, false);

  await demoReadOnly();
  await portFallback();
  const appSource = readFileSync(new URL('../console/app.js', import.meta.url), 'utf8');
  assert.match(appSource, /Leve seu cérebro para o Telegram/);
  assert.match(appSource, /Preparar o Hermes/);
  assert.match(appSource, /Sou eu/);
  assert.equal(appSource.includes('telegram-users'), false);
  assert.equal(appSource.includes('userinfobot'), false);
  assert.equal(appSource.includes('auth.json'), false);
  console.log('✓ Cockpit lê T0–T4, protege secrets do Hermes e mantém a demo sem mutações');
} finally {
  rmSync(sandbox, { recursive: true, force: true });
}
