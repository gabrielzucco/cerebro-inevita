#!/usr/bin/env node

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { localInterfaceUrl, probeSystemInterface } from './lib/system-interface-health.mjs';

const clock = () => new Date('2026-08-27T12:00:00.000Z');

assert.equal(localInterfaceUrl('http://localhost:3300/')?.hostname, 'localhost');
assert.equal(localInterfaceUrl('http://127.0.0.1:3300/')?.hostname, '127.0.0.1');
assert.equal(localInterfaceUrl('http://[::1]:3300/')?.hostname, '[::1]');
assert.equal(localInterfaceUrl('https://example.com/'), null, 'probe do servidor não pode buscar host externo');
assert.equal(localInterfaceUrl('file:///tmp/app.html'), null, 'probe do servidor não pode abrir arquivo');

const missing = await probeSystemInterface(null, { clock });
assert.deepEqual(missing, {
  status: 'not-declared', reason_code: 'interface-ref-missing', checked_at: '2026-08-27T12:00:00.000Z', checkable: false,
});

let externalFetches = 0;
const external = await probeSystemInterface('https://example.com/', {
  clock,
  fetchImpl: async () => { externalFetches += 1; return { status: 200 }; },
});
assert.equal(external.status, 'not-checkable');
assert.equal(external.reason_code, 'interface-healthcheck-restricted');
assert.equal(externalFetches, 0, 'URL externa não pode chegar ao fetch do servidor');

const available = await probeSystemInterface('http://localhost:3300/', {
  clock,
  fetchImpl: async (_url, options) => {
    assert.equal(options.method, 'HEAD');
    assert.equal(options.redirect, 'manual');
    return { status: 204 };
  },
});
assert.equal(available.status, 'available');
assert.equal(available.http_status, 204);

const serverError = await probeSystemInterface('http://127.0.0.1:3300/', {
  clock,
  fetchImpl: async () => ({ status: 503 }),
});
assert.equal(serverError.status, 'unavailable');
assert.equal(serverError.reason_code, 'interface-http-error');

const unreachable = await probeSystemInterface('http://127.0.0.1:3300/', {
  clock,
  fetchImpl: async () => { throw new TypeError('connection refused'); },
});
assert.equal(unreachable.status, 'unavailable');
assert.equal(unreachable.reason_code, 'interface-unreachable');

const timedOut = await probeSystemInterface('http://localhost:3300/', {
  clock,
  timeoutMs: 5,
  fetchImpl: (_url, { signal }) => new Promise((_resolve, reject) => {
    signal.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' })), { once: true });
  }),
});
assert.equal(timedOut.status, 'unavailable');
assert.equal(timedOut.reason_code, 'interface-timeout');

const root = resolve(process.cwd());
const app = readFileSync(resolve(root, 'console/app.js'), 'utf8');
const css = readFileSync(resolve(root, 'console/styles.css'), 'utf8');
const server = readFileSync(resolve(root, 'scripts/console-server.mjs'), 'utf8');

assert.match(server, /interfaceHealthTimeoutCeilingMs = 2000/, 'servidor deve impor teto ao timeout do binding');
assert.match(server, /\/interface-health/, 'servidor deve oferecer endpoint autenticado de saúde');
assert.match(app, /interfaceHealth: \{\}/, 'front-end deve manter cache da carga atual');
assert.match(app, /if \(!id \|\| state\.systems\.interfaceHealth\[id\]\) return/, 'cache deve impedir probes duplicados');
assert.doesNotMatch(app, /setInterval\([^)]*interface/i, 'saúde da interface não pode usar polling');
for (const text of ['Abrir aplicação', 'Aplicação indisponível', 'Aplicação não instalada', 'Sem interface própria', 'Verificando aplicação']) {
  assert.match(app, new RegExp(text), `estado de CTA ausente: ${text}`);
}
assert.match(css, /system-compact-actions button, \.system-app-link, \.system-interface-state \{ min-height: 44px/, 'as duas ações devem ter pelo menos 44 px');

console.log('system-interface-health-v1: ok');
