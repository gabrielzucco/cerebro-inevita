#!/usr/bin/env node

import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  importLegacySystemManifests,
  parseSystemManifest,
  previewLegacySystemImport,
} from './lib/legacy-system-import.mjs';

const root = mkdtempSync(join(tmpdir(), 'legacy-system-import-'));

function write(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, typeof value === 'string' ? value : `${JSON.stringify(value, null, 2)}\n`);
}

function example(name) {
  return JSON.parse(readFileSync(new URL(`../protocol/examples/${name}`, import.meta.url), 'utf8'));
}

function manifest({ id, name, status, version = '0.1.0' }) {
  return `---
tipo: sistema
fonte: mente-propria
tema: produto
pode-ir-comunidade: false
criado: 2026-08-24
sistema-id: ${id}
nome: ${name}
dominio: operação
dono: responsável
estado: ${status}
versao: ${version}
resultado: Resultado humano verificável
evidencia: caso-humano
pipeline-status: ativo
rotinas-status: parcial
skills-status: parcial
interfaces-status: ativo
gates-status: ativo
evals-status: parcial
melhoria-status: parcial
publicacao: interno
ultimo-ciclo: 2026-08-24
proximo-gate: aprovar o primeiro replay
ordem: 10
---

# ${name}

## Resultado e setpoint

- **Job:** transformar evidência humana em trabalho útil.
- **Output verificável:** artefato aprovado com proveniência.
- **Setpoint inicial:** um replay aprovado sem lacuna crítica.
- **Não é sucesso:** produzir texto sem evidência.

## Evidência real

Caso humano registrado.
`;
}

function mappedSource(sourceId, name) {
  const source = example('source-contract.v1.json');
  return {
    ...source,
    source_id: sourceId,
    name,
    type: 'knowledge-workspace',
    status: 'mapped',
    truth: { home_ref: `local:${sourceId}`, source_of_truth: true },
    authority: { owner_ref: 'role-system-owner', status: 'confirmed' },
    scope: { purpose: 'fixture de mapa', entity_types: ['decision'], boundaries: ['sem copiar fonte'] },
    pii: { classification: 'possible', handling: 'local-processing' },
    connector: { kind: 'local-reference', binding_ref: null, credential_ref: null, custody: 'agent-direct' },
    assurance: 'receipt-audited',
    authorized_consumers: [],
    freshness: { policy: 'verificada no run', observed_at: null },
    extensions: { migration: { kind: 'manifest-map', protocol_version: 1 } },
  };
}

try {
  write(join(root, '.cerebro', 'layout.json'), {
    version: 3,
    systemContracts: '.cerebro/contracts/systems',
    sourceContracts: '.cerebro/contracts/sources',
  });
  const mappedManifestRef = 'empresa/sistemas/cerebro-operacional.md';
  const aliasManifestRef = 'empresa/sistemas/funil-crescimento.md';
  const mappedManifest = manifest({ id: 'cerebro-operacional', name: 'Cérebro Operacional', status: 'instrumentado', version: '1.0.0' });
  const aliasManifest = manifest({ id: 'funil-crescimento', name: 'Funil e Crescimento', status: 'instrumentado', version: '1.0.0' });
  write(join(root, mappedManifestRef), mappedManifest);
  write(join(root, aliasManifestRef), aliasManifest);

  const activeContract = { ...example('system-contract.v2.json'), status: 'active', extensions: { runtime_vertical: true } };
  write(join(root, '.cerebro', 'contracts', 'systems', 'analisar-funil.json'), activeContract);
  for (const sourceId of ['paid-media', 'sales-ledger', 'experiment-ledger']) {
    write(join(root, '.cerebro', 'contracts', 'sources', `${sourceId}.json`), {
      ...example('source-contract.v1.json'), source_id: sourceId,
    });
  }

  write(join(root, '.cerebro', 'migration', 'system-map.v1.json'), {
    protocol_version: 1,
    company_ref: 'company-sanitized',
    sources: [
      mappedSource('vault-company', 'Vault da empresa'),
      mappedSource('metrics-company', 'Métricas da empresa'),
    ],
    systems: [
      {
        system_id: 'cerebro-operacional', manifest_ref: mappedManifestRef, area_ref: 'fundacao',
        owner_ref: 'role-founder', source_refs: ['vault-company', 'metrics-company'],
      },
      {
        system_id: 'funil-crescimento', manifest_ref: aliasManifestRef, area_ref: 'crescimento',
        owner_ref: 'role-founder', source_refs: ['paid-media', 'sales-ledger', 'experiment-ledger'],
        contract_alias: 'analisar-funil', stage: 'active',
      },
    ],
  });

  assert.equal(parseSystemManifest(mappedManifest).human.output, 'artefato aprovado com proveniência.');
  const beforeMapped = readFileSync(join(root, mappedManifestRef), 'utf8');
  const beforeAlias = readFileSync(join(root, aliasManifestRef), 'utf8');
  const preview = previewLegacySystemImport(root);
  assert.equal(preview.status, 'ready');
  assert.equal(preview.systems, 2);
  assert.equal(preview.sources, 2);
  assert.equal(preview.counts.create, 3);
  assert.equal(preview.counts.update, 1);
  assert.deepEqual(preview.guarantees, {
    duplicate_brain_created: false,
    manifest_edited: false,
    source_moved_or_copied: false,
    raw_opened_or_embedded: false,
  });
  assert.equal(existsSync(join(root, '.cerebro', 'contracts', 'systems', 'cerebro-operacional.json')), false, 'preview não escreve');

  const imported = importLegacySystemManifests(root, { confirm: true });
  assert.equal(imported.status, 'imported');
  assert.equal(readFileSync(join(root, mappedManifestRef), 'utf8'), beforeMapped, 'manifesto humano não pode mudar');
  assert.equal(readFileSync(join(root, aliasManifestRef), 'utf8'), beforeAlias, 'manifesto do alias não pode mudar');
  const generated = JSON.parse(readFileSync(join(root, '.cerebro', 'contracts', 'systems', 'cerebro-operacional.json'), 'utf8'));
  assert.equal(generated.protocol_version, 2);
  assert.equal(generated.status, 'confirmed');
  assert.equal(generated.extensions.migration_stage, 'configured');
  assert.equal(generated.retrieval.source_roles.length, 2);
  const alias = JSON.parse(readFileSync(join(root, '.cerebro', 'contracts', 'systems', 'analisar-funil.json'), 'utf8'));
  assert.equal(alias.status, 'active', 'alias preserva o contrato executável e seus recibos');
  assert.equal(alias.extensions.runtime_vertical, true);
  assert.equal(alias.extensions.portfolio_system_ref, 'funil-crescimento');
  assert.equal(alias.extensions.migration_stage, 'active');
  assert.equal(importLegacySystemManifests(root, { confirm: true }).status, 'no-change', 'repetição precisa ser idempotente');

  const conflictRoot = mkdtempSync(join(tmpdir(), 'legacy-system-conflict-'));
  try {
    write(join(conflictRoot, '.cerebro', 'layout.json'), { version: 3 });
    write(join(conflictRoot, mappedManifestRef), mappedManifest);
    write(join(conflictRoot, '.cerebro', 'contracts', 'systems', 'cerebro-operacional.json'), activeContract);
    write(join(conflictRoot, '.cerebro', 'migration', 'system-map.v1.json'), {
      protocol_version: 1,
      company_ref: 'company-sanitized',
      sources: [mappedSource('vault-company', 'Vault da empresa')],
      systems: [{
        system_id: 'cerebro-operacional', manifest_ref: mappedManifestRef, area_ref: 'fundacao',
        owner_ref: 'role-founder', source_refs: ['vault-company'],
      }],
    });
    assert.throws(() => previewLegacySystemImport(conflictRoot), /não sobrescreve contrato não gerenciado/);
  } finally {
    rmSync(conflictRoot, { recursive: true, force: true });
  }

  console.log('✓ importação aditiva dos manifestos mantém uma única pasta e diferencia mapeado/configurado/ativo');
} finally {
  rmSync(root, { recursive: true, force: true });
}
