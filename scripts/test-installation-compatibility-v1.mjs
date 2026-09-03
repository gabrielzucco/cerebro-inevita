#!/usr/bin/env node

import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { buildInstallationCompatibility } from './lib/installation-compatibility.mjs';

const product = resolve(process.cwd());
const system = JSON.parse(readFileSync(join(product, 'comunidade/inevita/sistemas-disponiveis/briefing-comercial-inteligente/contract.json'), 'utf8'));
const sourceExample = JSON.parse(readFileSync(join(product, 'protocol/examples/source-contract.v1.json'), 'utf8'));
const root = mkdtempSync(join(tmpdir(), 'installation-compatibility-'));

function write(ref, value) {
  const path = join(root, ref);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

write('.cerebro/layout.json', {
  sourceContracts: '.cerebro/contracts/sources',
  systemContracts: '.cerebro/contracts/systems',
  accessGrants: '.cerebro/contracts/access-grants',
  systemSourceBindings: '.cerebro/runtime/system-source-bindings',
});
write(`comunidade/inevita/sistemas-disponiveis/${system.system_id}/contract.json`, system);

let plan = buildInstallationCompatibility(root, system, { now: new Date('2026-08-27T18:00:00.000Z') });
assert.equal(plan.status, 'missing-source');
assert.equal(plan.next_action, 'register-source');
assert.equal(plan.roles.every((role) => role.status === 'missing-source'), true);

function source(sourceId, name) {
  return {
    ...sourceExample,
    source_id: sourceId,
    name,
    authorized_consumers: [],
    freshness: { ...sourceExample.freshness, observed_at: '2026-08-27T17:00:00.000Z' },
  };
}
write('.cerebro/contracts/sources/crm-history.json', source('crm-history', 'Histórico do CRM'));
write('.cerebro/contracts/sources/approved-offer.json', source('approved-offer', 'Oferta vigente'));

plan = buildInstallationCompatibility(root, system, { now: new Date('2026-08-27T18:00:00.000Z') });
assert.equal(plan.status, 'needs-mapping');
assert.equal(plan.counts.available_sources, 2);
assert.equal(plan.roles[0].candidates.length, 2, 'matching mecânico não deve fingir semântica pelo nome');
assert.equal(plan.roles[0].candidates[0].compatibility, 'semantic-approval-required');

function binding(role, sourceRef, status = 'ready') {
  const approved = status === 'ready';
  return {
    protocol_version: 1,
    binding_id: `binding-briefing-${role}`,
    system_ref: system.system_id,
    system_version: system.version,
    role,
    source_ref: sourceRef,
    requested_access: system.sources.find((item) => item.role === role).access,
    status,
    grant_ref: approved ? 'grant-briefing-sources' : null,
    checked_at: '2026-08-27T18:00:00.000Z',
    reason_codes: approved
      ? ['role-source-compatible', 'grant-active']
      : ['semantic-role-approval-required'],
    approval: approved
      ? { approved_by: 'role-sales-owner', approved_at: '2026-08-27T17:30:00.000Z' }
      : { approved_by: null, approved_at: null },
    privacy: { content_copied: false, credential_stored: false, shared_with_inevita: false },
  };
}
write('.cerebro/runtime/system-source-bindings/binding-briefing-historico-conversas.json', binding('historico-conversas', 'crm-history', 'awaiting-approval'));
const staleBinding = binding('historico-conversas', 'crm-history', 'awaiting-approval');
staleBinding.system_version = '0.1.0';
write('.cerebro/runtime/system-source-bindings/binding-briefing-historico-conversas.json', staleBinding);
plan = buildInstallationCompatibility(root, system, { now: new Date('2026-08-27T18:00:00.000Z') });
assert.equal(plan.status, 'incompatible', 'binding de outra versão não pode parecer só pendente');

write('.cerebro/runtime/system-source-bindings/binding-briefing-historico-conversas.json', binding('historico-conversas', 'crm-history', 'awaiting-approval'));
plan = buildInstallationCompatibility(root, system, { now: new Date('2026-08-27T18:00:00.000Z') });
assert.equal(plan.status, 'awaiting-approval');
assert.equal(plan.roles[0].current_binding.source.name, 'Histórico do CRM');

const grant = {
  protocol_version: 1,
  grant_id: 'grant-briefing-sources',
  subject: { type: 'system', ref: system.system_id },
  scope: {
    company_ref: 'company-local', unit_ref: 'sales', system_refs: [system.system_id],
    source_refs: ['crm-history', 'approved-offer'], actions: ['read-source'],
  },
  mode: 'read',
  assurance: 'runtime-enforced',
  custody: 'runtime-exclusive',
  reason: 'preparar briefing com Fontes confirmadas pelo responsável comercial',
  issued_at: '2026-08-27T17:30:00.000Z',
  expires_at: '2026-08-28T17:30:00.000Z',
  revoked_at: null,
  approved_by: 'role-sales-owner',
  credential_ref: 'os-keychain:briefing-read-session',
  receipts: { use_refs: [], revocation_ref: null },
};
write('.cerebro/contracts/access-grants/grant-briefing-sources.json', grant);
write('.cerebro/runtime/system-source-bindings/binding-briefing-historico-conversas.json', binding('historico-conversas', 'crm-history'));
write('.cerebro/runtime/system-source-bindings/binding-briefing-oferta-aprovada.json', binding('oferta-aprovada', 'approved-offer'));

plan = buildInstallationCompatibility(root, system, { now: new Date('2026-08-27T18:00:00.000Z') });
assert.equal(plan.status, 'ready');
assert.equal(plan.activation_ready, true);
assert.equal(plan.next_action, 'install-package');
assert.equal(plan.counts.ready_roles, 2);
assert.equal(JSON.stringify(plan).includes('credential_ref'), false, 'diagnóstico não pode expor referência de credencial');
assert.equal(JSON.stringify(plan).includes('home_ref'), false, 'diagnóstico não precisa expor casa interna da Fonte');

const expired = buildInstallationCompatibility(root, system, { now: new Date('2026-08-29T18:00:00.000Z') });
assert.equal(expired.status, 'incompatible');
assert.equal(expired.roles.every((role) => role.status === 'incompatible'), true);

const secondSystem = {
  ...system,
  system_id: 'briefing-renovacao',
  name: 'Briefing de renovação',
  version: '0.1.0',
  capability: { ...system.capability, capability_id: 'preparar-briefing-renovacao' },
};
const reuse = buildInstallationCompatibility(root, secondSystem, { now: new Date('2026-08-27T18:00:00.000Z') });
assert.equal(reuse.counts.available_sources, 2, 'as mesmas Fontes precisam continuar reutilizáveis por outro Sistema');
assert.equal(reuse.status, 'needs-mapping');

const cli = spawnSync(process.execPath, [join(product, 'scripts/installation-compatibility.mjs'), 'plan', system.system_id, `--root=${root}`, '--compact'], { encoding: 'utf8' });
assert.equal(cli.status, 0, cli.stderr);
const cliPlan = JSON.parse(cli.stdout);
assert.equal(cliPlan.system_ref, system.system_id);
assert.equal(cliPlan.installed, false, 'CLI precisa diagnosticar pacote ainda não instalado');

console.log('installation-compatibility-v1: ok');
