#!/usr/bin/env node

import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { buildConsoleReadModel } from './lib/console-read-model.mjs';
import { systemInterfaceHealth } from './lib/system-interface-health.mjs';
import { validateSystemContract } from './lib/system-protocol.mjs';
import {
  indexSystemRuntimeBindings,
  saveSystemRuntimeBinding,
  validateSystemRuntimeBinding,
} from './lib/system-runtime-binding.mjs';

const product = resolve(process.cwd());
const root = mkdtempSync(join(tmpdir(), 'system-runtime-binding-'));
const readProductJson = (path) => JSON.parse(readFileSync(resolve(product, path), 'utf8'));
const write = (path, value) => {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, typeof value === 'string' ? value : `${JSON.stringify(value, null, 2)}\n`);
};

const example = readProductJson('protocol/examples/system-runtime-binding.v1.json');
assert.deepEqual(validateSystemRuntimeBinding(example), []);

for (const [name, value, expected] of [
  ['host externo por HTTP', { ...example, interface: { ...example.interface, url: 'http://example.com/' } }, /HTTPS ou HTTP local/],
  ['segredo em query', { ...example, interface: { ...example.interface, url: 'https://example.com/?token=secret' } }, /HTTPS ou HTTP local/],
  ['workspace traversal', { ...example, workspace_path: '../outside' }, /workspace_path/],
  ['timeout sem limite', { ...example, interface: { ...example.interface, healthcheck: { method: 'HEAD', timeout_ms: 9000 } } }, /timeout_ms/],
]) {
  assert.match(validateSystemRuntimeBinding(value).join(' · '), expected, name);
}

write(join(root, 'VERSION'), 'fixture\n');
write(join(root, 'COMECE-AQUI.md'), '# Fixture\n');
write(join(root, '.cerebro', 'layout.json'), {
  version: 3,
  systemContracts: '.cerebro/contracts/systems',
  sourceContracts: '.cerebro/contracts/sources',
  systemRuntimeBindings: '.cerebro/runtime/system-bindings',
  runLedger: '.cerebro/runtime/ledger/runs.jsonl',
});
const system = readProductJson('protocol/examples/system-contract.v2.json');
system.extensions = {
  ...(system.extensions || {}),
  interface_role: 'primary-web-ui',
};
assert.match(validateSystemContract({ ...system, extensions: { ...system.extensions, interface_role: 'INVALID ROLE' } }).join(' · '), /interface_role/);
const systemPath = join(root, '.cerebro', 'contracts', 'systems', `${system.system_id}.json`);
write(systemPath, system);

let model = buildConsoleReadModel(root);
let installed = model.systems.find((item) => item.system_id === system.system_id);
assert.equal(installed.interface_expected, true);
assert.equal(installed.interface_ref, null);
assert.equal(installed.runtime_binding_status, 'unbound');
let healthFetches = 0;
const notInstalled = await systemInterfaceHealth(root, system.system_id, {
  fetchImpl: async () => { healthFetches += 1; return { status: 200 }; },
  clock: () => new Date('2026-08-27T16:00:00.000Z'),
});
assert.equal(notInstalled.status, 'not-installed');
assert.equal(notInstalled.reason_code, 'system-runtime-binding-missing');
assert.equal(healthFetches, 0, 'binding ausente não pode disparar healthcheck');

system.extensions.interface_ref = 'http://localhost:3999/';
write(systemPath, system);
model = buildConsoleReadModel(root);
installed = model.systems.find((item) => item.system_id === system.system_id);
assert.equal(installed.interface_ref, 'http://localhost:3999/');
assert.equal(installed.interface_ref_source, 'legacy-system-contract');
assert.equal(installed.runtime_binding_status, 'legacy');

const binding = {
  ...example,
  binding_id: 'system-runtime-fixture-local',
  system_ref: system.system_id,
  workspace_path: '.',
  interface: { ...example.interface, url: 'http://localhost:3300/' },
};
assert.equal(saveSystemRuntimeBinding(root, binding).status, 'created');
assert.throws(() => saveSystemRuntimeBinding(root, binding), /system-runtime-binding-exists/);
assert.equal(saveSystemRuntimeBinding(root, { ...binding, observed_at: '2026-08-27T17:00:00.000Z' }, { replace: true }).status, 'updated');

model = buildConsoleReadModel(root);
installed = model.systems.find((item) => item.system_id === system.system_id);
assert.equal(installed.interface_ref, 'http://localhost:3300/', 'binding privado deve vencer URL legada');
assert.equal(installed.interface_ref_source, 'runtime-binding');
assert.equal(installed.runtime_binding_status, 'installed');
assert.equal(installed.runtime_binding.binding_id, binding.binding_id);
assert.equal(installed.interface_health_timeout_ms, 800);

saveSystemRuntimeBinding(root, { ...binding, workspace_path: 'missing-workspace' }, { replace: true });
model = buildConsoleReadModel(root);
installed = model.systems.find((item) => item.system_id === system.system_id);
assert.equal(installed.runtime_binding_status, 'degraded');
assert(model.issues.some((issue) => issue.reason_code === 'system-runtime-workspace-missing'));
saveSystemRuntimeBinding(root, binding, { replace: true });

saveSystemRuntimeBinding(root, { ...binding, binding_id: 'system-runtime-fixture-duplicate' });
const issues = [];
const index = indexSystemRuntimeBindings(root, issues);
assert.equal(index.get(system.system_id).ambiguous, true);
assert(issues.some((issue) => issue.reason_code === 'system-runtime-binding-ambiguous'));

model = buildConsoleReadModel(root);
installed = model.systems.find((item) => item.system_id === system.system_id);
assert.equal(installed.interface_ref, null, 'duplicidade deve bloquear também o fallback legado');
assert.equal(installed.runtime_binding_status, 'degraded');
assert(model.issues.some((issue) => issue.reason_code === 'system-runtime-binding-ambiguous'));

const packagedGtm = readFileSync(resolve(product, 'sistemas/next-best-gtm/contract.json'), 'utf8');
assert.doesNotMatch(packagedGtm, /localhost:3300|interface_ref/, 'System Contract publicável não pode carregar endereço da instalação');

console.log('system-runtime-binding-v1: ok');
