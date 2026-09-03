#!/usr/bin/env node

import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import {
  indexSystemSourceBindings,
  saveSystemSourceBinding,
  validateSystemSourceBinding,
  validateSystemSourceBindingReferences,
} from './lib/system-source-binding.mjs';

const product = resolve(process.cwd());
const root = mkdtempSync(join(tmpdir(), 'system-source-binding-'));
const readProductJson = (path) => JSON.parse(readFileSync(resolve(product, path), 'utf8'));
const write = (path, value) => {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, typeof value === 'string' ? value : `${JSON.stringify(value, null, 2)}\n`);
};

write(join(root, 'VERSION'), '1.32.0\n');
write(join(root, 'COMECE-AQUI.md'), '# Fixture\n');
write(join(root, '.cerebro', 'layout.json'), {
  version: 3,
  systemContracts: '.cerebro/contracts/systems',
  sourceContracts: '.cerebro/contracts/sources',
  accessGrants: '.cerebro/contracts/access-grants',
  systemSourceBindings: '.cerebro/runtime/system-source-bindings',
});

const example = readProductJson('protocol/examples/system-source-binding.v1.json');
const system = readProductJson('protocol/examples/system-contract.v2.json');
const source = { ...readProductJson('protocol/examples/source-contract.v1.json'), authorized_consumers: [] };
const grant = readProductJson('protocol/examples/access-grant.v1.json');
assert.deepEqual(validateSystemSourceBinding(example), []);
assert.deepEqual(validateSystemSourceBindingReferences(example, { system, source, grant }), []);

write(join(root, '.cerebro', 'contracts', 'systems', `${system.system_id}.json`), system);
write(join(root, '.cerebro', 'contracts', 'sources', `${source.source_id}.json`), source);
write(join(root, '.cerebro', 'contracts', 'access-grants', `${grant.grant_id}.json`), grant);
write(join(root, '.cerebro', 'sistemas', `${system.system_id}.json`), {
  system_id: system.system_id,
  status: 'package_added',
  source_bindings: { total_roles: 3, required_roles: 3, ready_roles: 0, status: 'unbound' },
});
const sourceBefore = readFileSync(join(root, '.cerebro', 'contracts', 'sources', `${source.source_id}.json`), 'utf8');
assert.equal(saveSystemSourceBinding(root, example, { system, source, grant }).status, 'created');
const firstState = JSON.parse(readFileSync(join(root, '.cerebro', 'sistemas', `${system.system_id}.json`), 'utf8'));
assert.equal(firstState.source_bindings.ready_roles, 1);
assert.equal(firstState.source_bindings.status, 'unbound', 'dois papéis obrigatórios ainda não têm binding');

const secondSystem = {
  ...system,
  system_id: 'conteudo-performance',
  name: 'Conteúdo por Performance',
};
const secondGrant = {
  ...grant,
  grant_id: 'grant-content-paid-media-read',
  subject: { type: 'system', ref: secondSystem.system_id },
  scope: { ...grant.scope, system_refs: [secondSystem.system_id], source_refs: [source.source_id] },
};
const secondBinding = {
  ...example,
  binding_id: 'binding-content-paid-media',
  system_ref: secondSystem.system_id,
  grant_ref: secondGrant.grant_id,
};
write(join(root, '.cerebro', 'contracts', 'systems', `${secondSystem.system_id}.json`), secondSystem);
write(join(root, '.cerebro', 'contracts', 'access-grants', `${secondGrant.grant_id}.json`), secondGrant);
assert.deepEqual(validateSystemSourceBindingReferences(secondBinding, {
  system: secondSystem, source, grant: secondGrant,
}), []);
assert.equal(saveSystemSourceBinding(root, secondBinding, {
  system: secondSystem, source, grant: secondGrant,
}).status, 'created');
assert.equal(
  readFileSync(join(root, '.cerebro', 'contracts', 'sources', `${source.source_id}.json`), 'utf8'),
  sourceBefore,
  'reutilizar a Fonte não pode reescrever o Source Contract',
);

let index = indexSystemSourceBindings(root);
assert.equal(index.get('analisar-funil:midia-paga').binding.source_ref, 'paid-media');
assert.equal(index.get('conteudo-performance:midia-paga').binding.source_ref, 'paid-media');

for (const [name, binding, refs, expected] of [
  ['ready sem grant', { ...example, grant_ref: null }, { system, source, grant: null }, /exige grant_ref|Access Grant/],
  ['papel inexistente', { ...example, role: 'crm' }, { system, source, grant }, /role precisa existir/],
  ['versão divergente', { ...example, system_version: '9.0.0' }, { system, source, grant }, /system_version/],
  ['modo incompatível', example, { system, source: { ...source, modes: ['propose'] }, grant }, /não permite modo read/],
  ['grant expirado', { ...example, checked_at: '2026-08-23T19:00:00.000Z' }, { system, source, grant }, /expirado/],
  ['grant ainda não emitido', { ...example, checked_at: '2026-08-23T17:54:00.000Z' }, { system, source, grant }, /ainda não tinha sido emitido/],
  ['grant de outro Sistema', example, { system, source, grant: secondGrant }, /grant_ref|Sistema como sujeito|não cobre o Sistema/],
]) {
  assert.match(validateSystemSourceBindingReferences(binding, refs).join(' · '), expected, name);
}

const duplicate = { ...example, binding_id: 'binding-funnel-paid-media-duplicate' };
assert.equal(saveSystemSourceBinding(root, duplicate, { system, source, grant }).status, 'created');
const issues = [];
index = indexSystemSourceBindings(root, issues);
assert.equal(index.get('analisar-funil:midia-paga').ambiguous, true);
assert(issues.some((issue) => issue.reason_code === 'system-source-binding-ambiguous'));

const plan = spawnSync(process.execPath, [
  resolve(product, 'scripts/system-source-binding.mjs'), 'plan', system.system_id, `--root=${root}`,
], { encoding: 'utf8' });
assert.equal(plan.status, 0, plan.stderr);
const planned = JSON.parse(plan.stdout);
assert.equal(planned.privacy.source_content_read, false);
assert.equal(planned.requirements.find((item) => item.role === 'midia-paga').candidates[0].source_ref, 'paid-media');
assert.equal(planned.requirements.find((item) => item.role === 'receita').candidates[0].status, 'incompatible');

const traversal = spawnSync(process.execPath, [
  resolve(product, 'scripts/system-source-binding.mjs'), 'bind', '../outside.json', `--root=${root}`,
], { encoding: 'utf8' });
assert.notEqual(traversal.status, 0);
assert.match(traversal.stderr, /fora do Cérebro/);

console.log('system-source-binding-v1: ok');
