#!/usr/bin/env node
import assert from 'node:assert/strict';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  activate,
  flushPendingActivation,
  parseActivationArgs,
} from '../.agents/scripts/activate.mjs';

const CLAIM = 'A'.repeat(43);
const CREDENTIAL = 'C'.repeat(43);

function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'cerebro-activation-'));
  for (const file of [
    'COMECE-AQUI.md',
    'VERSION',
    'conhecimento/_INDICE.md',
    '.agents/skills/comecar/SKILL.md',
    '.agents/scripts/ping.mjs',
  ]) {
    const path = join(root, file);
    mkdirSync(join(path, '..'), { recursive: true });
    writeFileSync(path, file === 'VERSION' ? '1.33.0\n' : 'fixture\n');
  }
  return root;
}

function api({ status = 'started', failAt = 0 } = {}) {
  const calls = [];
  const fetchImpl = async (_url, options) => {
    const body = JSON.parse(options.body);
    calls.push(body);
    if (calls.length === failAt) throw new Error('offline');
    if (body.action === 'start') {
      return new Response(JSON.stringify({ ok: true, status, credential: CREDENTIAL }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };
  return { calls, fetchImpl };
}

const roots = [];
try {
  assert.deepEqual(
    parseActivationArgs([`--claim=${CLAIM}`, '--runtime=codex']),
    { claim: CLAIM, runtime: 'codex' },
  );
  assert.throws(() => parseActivationArgs(['--claim=curto', '--runtime=codex']), /claim_invalid/);
  assert.throws(() => parseActivationArgs([`--claim=${CLAIM}`, '--runtime=browser']), /runtime_invalid/);

  const freshRoot = fixture();
  roots.push(freshRoot);
  const freshApi = api();
  const fresh = await activate({
    root: freshRoot,
    claim: CLAIM,
    runtime: 'codex',
    fetchImpl: freshApi.fetchImpl,
    endpoint: 'https://activation.test/functions/v1',
  });
  assert.equal(fresh.ok, true);
  assert.equal(fresh.event, 'install_completed');
  assert.deepEqual(freshApi.calls.map((call) => call.action), ['start', 'finish']);
  assert.equal(freshApi.calls[1].event, 'install_completed');
  assert.equal(freshApi.calls[0].claim, CLAIM);
  assert.equal(freshApi.calls[1].credential, CREDENTIAL);
  assert.equal(JSON.stringify(fresh).includes(CLAIM), false);
  assert.equal(JSON.stringify(fresh).includes(CREDENTIAL), false);
  assert.equal(readFileSync(join(freshRoot, '.cerebro/install-credential'), 'utf8').trim(), CREDENTIAL);
  assert.equal(statSync(join(freshRoot, '.cerebro/install-credential')).mode & 0o777, 0o600);
  assert.equal(existsSync(join(freshRoot, '.cerebro/install-activation-outbox.json')), false);

  const reconnectRoot = fixture();
  roots.push(reconnectRoot);
  const reconnectApi = api({ status: 'reconnected' });
  const reconnected = await activate({
    root: reconnectRoot,
    claim: CLAIM,
    runtime: 'claude-code',
    fetchImpl: reconnectApi.fetchImpl,
  });
  assert.equal(reconnected.event, 'install_reconnected');
  assert.equal(reconnectApi.calls[1].event, 'install_reconnected');

  const retryRoot = fixture();
  roots.push(retryRoot);
  const offlineApi = api({ failAt: 1 });
  const pending = await activate({
    root: retryRoot,
    claim: CLAIM,
    runtime: 'gemini-cli',
    fetchImpl: offlineApi.fetchImpl,
    timeoutMs: 50,
  });
  assert.equal(pending.pending, true);
  assert.equal(existsSync(join(retryRoot, '.cerebro/install-activation-outbox.json')), true);
  assert.equal(statSync(join(retryRoot, '.cerebro/install-activation-outbox.json')).mode & 0o777, 0o600);

  const recoveredApi = api();
  const recovered = await flushPendingActivation({
    root: retryRoot,
    fetchImpl: recoveredApi.fetchImpl,
  });
  assert.equal(recovered.ok, true);
  assert.equal(recovered.event, 'install_completed');
  assert.equal(existsSync(join(retryRoot, '.cerebro/install-activation-outbox.json')), false);
  assert.deepEqual(recoveredApi.calls.map((call) => call.action), ['start', 'finish']);

  const brokenRoot = fixture();
  roots.push(brokenRoot);
  rmSync(join(brokenRoot, 'conhecimento/_INDICE.md'));
  const brokenApi = api();
  const broken = await activate({
    root: brokenRoot,
    claim: CLAIM,
    runtime: 'antigravity',
    fetchImpl: brokenApi.fetchImpl,
  });
  assert.equal(broken.ok, false);
  assert.equal(broken.event, 'install_failed');
  assert.equal(brokenApi.calls[1].reason_code, 'package_incomplete');

  console.log('✓ ativação local: instalação, reconexão, retry e falha sanitizada');
} finally {
  for (const root of roots) rmSync(root, { recursive: true, force: true });
}

