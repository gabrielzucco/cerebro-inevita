#!/usr/bin/env node
import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { syncSociety } from './society-sync.mjs';

const ID = '11111111-1111-4111-8111-111111111111';
const CREDENTIAL = 'A'.repeat(43);
const API = 'https://inevitasociety.com/supabase/functions/v1/cerebro-society-sync';

function fixture(t, credential = CREDENTIAL) {
  const root = mkdtempSync(join(tmpdir(), 'ss-client-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(join(root, '.cerebro'));
  writeFileSync(join(root, '.cerebro/id'), `${ID}\n`);
  if (credential !== null) writeFileSync(join(root, '.cerebro/install-credential'), ` ${credential}\n`);
  const state = { logs: [], calls: [], pings: [] };
  const options = {
    root,
    log: (...args) => state.logs.push(args.join(' ')),
    ping: (...args) => state.pings.push(args),
    fetchImpl: async (...args) => { state.calls.push(args); return Response.json({ access: true, items: [] }); },
  };
  t.after(() => assert.equal(state.logs.join('\n').includes(CREDENTIAL), false, 'credential leaked to console'));
  return { root, state, options };
}

for (const [label, value] of [['missing', null], ['malformed', 'bad'], ['empty', '']]) {
  test(`${label} credential: update guidance, no request`, async (t) => {
    const { state, options } = fixture(t, value);
    await syncSociety(options);
    assert.equal(state.calls.length, 0);
    assert.match(state.logs.join('\n'), /atualize.*1\.38\.0.*vincule/);
    assert.equal(state.pings.length, 0);
  });
}

test('valid credential: trimmed secret sent only with installation ID', async (t) => {
  const { state, options } = fixture(t);
  await syncSociety(options);
  assert.equal(state.calls.length, 1);
  const [url, request] = state.calls[0];
  assert.equal(url, API);
  assert.equal(request.method, 'POST');
  assert.deepEqual(JSON.parse(request.body), { install_id: ID, install_credential: CREDENTIAL });
  assert.deepEqual(request.headers, { 'Content-Type': 'application/json' });
  assert.match(state.logs.join('\n'), /acervo ainda não tem itens/);
});

for (const status of [401, 403, 500, 503]) {
  test(`HTTP ${status}: no download even if body claims access`, async (t) => {
    const { root, state, options } = fixture(t);
    options.fetchImpl = async (...args) => {
      state.calls.push(args);
      return Response.json({ access: true, message: CREDENTIAL, items: [{ path: 'a.md', url: 'https://storage.invalid/a' }] }, { status });
    };
    await syncSociety(options);
    assert.equal(state.calls.length, 1);
    assert.equal(state.pings.length, 0);
    assert.equal(existsSync(join(root, 'comunidade/society')), false);
    assert.match(state.logs.join('\n'), status === 401 ? /atualize.*vincule/ : status === 403 ? /assinatura ativa/ : /indisponível/);
  });
}

test('network failure hides exception and releases the timeout', async (t) => {
  const { state, options } = fixture(t);
  options.fetchImpl = async () => { throw new Error(CREDENTIAL); };
  await syncSociety(options);
  assert.match(state.logs.join('\n'), /indisponível/);
});

test('invalid JSON hides raw body', async (t) => {
  const { state, options } = fixture(t);
  options.fetchImpl = async () => new Response(CREDENTIAL);
  await syncSociety(options);
  assert.match(state.logs.join('\n'), /indisponível/);
});

test('legacy identity denial guides linking without trusting server text', async (t) => {
  const { state, options } = fixture(t);
  options.fetchImpl = async () => Response.json({ access: false, reason: 'identity', message: CREDENTIAL });
  await syncSociety(options);
  assert.match(state.logs.join('\n'), /atualize.*vincule/);
});

test('success downloads without forwarding credential and preserves equal files', async (t) => {
  const { root, state, options } = fixture(t);
  options.fetchImpl = async (url, request) => {
    state.calls.push([url, request]);
    if (url === API) return Response.json({ access: true, expires_in: 300, items: [{ path: 'a.md', url: 'https://storage.invalid/a' }] });
    assert.equal(request.body, undefined);
    assert.equal(request.headers, undefined);
    return new Response('test content');
  };
  await syncSociety(options);
  await syncSociety(options);
  assert.equal(readFileSync(join(root, 'comunidade/society/a.md'), 'utf8'), 'test content');
  assert.equal(state.calls.length, 4);
  assert.equal(state.pings.length, 2);
  assert.equal(JSON.stringify(state.pings).includes(CREDENTIAL), false);
  assert.match(state.logs.join('\n'), /1 sem mudança/);
});

test('expired download URL is skipped without exposing URL or credential', async (t) => {
  const { root, state, options } = fixture(t);
  options.fetchImpl = async (url) => url === API
    ? Response.json({ access: true, expires_in: 300, items: [{ path: 'a.md', url: 'https://storage.invalid/expired' }] })
    : new Response('', { status: 403 });
  await syncSociety(options);
  assert.equal(existsSync(join(root, 'comunidade/society/a.md')), false);
  assert.equal(state.logs.join('\n').includes('https://storage.invalid/'), false);
});

test('invalid install ID: no request or credential output', async (t) => {
  const { root, state, options } = fixture(t);
  writeFileSync(join(root, '.cerebro/id'), 'invalid');
  await syncSociety(options);
  assert.equal(state.calls.length, 0);
  assert.match(state.logs.join('\n'), /comecar/);
});
