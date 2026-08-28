#!/usr/bin/env node

import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { buildSocietyCatalogReadModel, validateSocietyPackageManifest } from './lib/society-catalog-read-model.mjs';

const product = resolve(process.cwd());
const manifest = JSON.parse(readFileSync(join(product, 'comunidade/inevita/sistemas-disponiveis/briefing-comercial-inteligente/manifest.json'), 'utf8'));
assert.deepEqual(validateSocietyPackageManifest(manifest), []);

const catalog = buildSocietyCatalogReadModel(product, {
  catalogRoot: product,
  installedSystems: [{ system_id: 'briefing-comercial' }],
});
assert.deepEqual(catalog.counts, { visible: 4, validated: 0, validation: 4, installed: 0 });
const byId = new Map(catalog.systems.map((system) => [system.system_id, system]));
assert.deepEqual([...byId.keys()].sort(), [
  'briefing-comercial-inteligente',
  'calls-decisoes',
  'leitura-diaria-funil',
  'radar-de-voz',
]);
const briefing = byId.get('briefing-comercial-inteligente');
assert.equal(briefing.availability, 'validation');
assert.equal(briefing.installation_status, 'not-installed', 'alias parecido não pode contar como instalação');
assert.equal(briefing.install_action, 'approval-required');
assert.equal(briefing.validation.verified_real_cycles, 0);
assert.equal(briefing.validation.required_real_cycles, 3);
assert.equal(briefing.validation.verified_distinct_member_brains, 0);
assert.equal(briefing.validation.required_distinct_member_brains, 2);
assert.equal(briefing.requirements.source_roles[0].label, 'Histórico Conversas');
assert.equal(briefing.requirements.source_roles[1].label, 'Oferta Aprovada');
assert.equal(briefing.release.protocol_version, 1);
assert.equal(briefing.release.release_id, 'briefing-comercial-inteligente-v0-1-1');
assert.equal(briefing.release.system_contract_ref, 'contract.json');
assert.equal(briefing.compatibility.status, 'missing-source');
assert.equal(briefing.compatibility.next_action, 'register-source');
assert.equal(briefing.compatibility.privacy.source_content_read, false);
assert.equal(briefing.compatibility_action, 'inspect');
assert.equal(briefing.experience, null, 'identidade ausente precisa cair no fallback, não ser inventada');
assert.equal(byId.get('calls-decisoes').requirements.source_roles[0].role, 'transcricao');
assert.equal(byId.get('radar-de-voz').requirements.source_roles.some((source) => source.role === 'voz-do-cliente'), true);
assert.equal(byId.get('leitura-diaria-funil').validation.required_real_cycles, 7);
assert.equal(catalog.privacy.package_body_exposed, false);
assert.equal(catalog.privacy.telemetry_content_exposed, false);
assert.equal('telemetry' in catalog.systems[0], false);

const legacyRoot = mkdtempSync(join(tmpdir(), 'society-catalog-legacy-'));
const legacyManifestPath = join(legacyRoot, 'comunidade/inevita/sistemas-disponiveis/briefing-comercial-inteligente/manifest.json');
mkdirSync(dirname(legacyManifestPath), { recursive: true });
writeFileSync(legacyManifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
const legacy = buildSocietyCatalogReadModel(legacyRoot, { catalogRoot: legacyRoot });
assert.equal(legacy.systems.length, 1, 'pacote legado válido precisa continuar visível durante a migração');
assert.equal(legacy.systems[0].release.protocol_version, undefined);
assert.equal(legacy.systems[0].result, manifest.result);

const installed = buildSocietyCatalogReadModel(product, {
  catalogRoot: product,
  installedSystems: [{ system_id: 'briefing-comercial-inteligente' }],
});
assert.equal(installed.counts.installed, 1);
assert.equal(installed.systems[0].installation_status, 'installed');
assert.equal(installed.systems[0].install_action, 'open-installed');

const brokenRoot = mkdtempSync(join(tmpdir(), 'society-catalog-'));
const brokenManifest = join(brokenRoot, 'comunidade/inevita/sistemas-disponiveis/quebrado/manifest.json');
mkdirSync(dirname(brokenManifest), { recursive: true });
writeFileSync(brokenManifest, '{"schema_version":1}\n');
const broken = buildSocietyCatalogReadModel(brokenRoot, { catalogRoot: brokenRoot });
assert.equal(broken.systems.length, 0);
assert.equal(broken.issues[0].reason_code, 'society-package-invalid');

const app = readFileSync(join(product, 'console/app.js'), 'utf8');
const styles = readFileSync(join(product, 'console/styles.css'), 'utf8');
const server = readFileSync(join(product, 'scripts/console-server.mjs'), 'utf8');
assert.match(app, /function renderSocietyCatalog\(/);
assert.match(app, /data-society-open/);
assert.match(app, /Ver compatibilidade/);
assert.match(app, /data-society-copy-command/);
assert.match(app, /Acesso Society/);
assert.match(app, /Membros têm acesso aos Sistemas e capacidades/);
assert.match(app, /Publisher não publicado/);
assert.match(server, /url\.pathname === '\/api\/society'/);
assert.match(styles, /\.society-catalog-grid/);
assert.match(styles, /\.society-compatibility/);

console.log('society-catalog-v0: ok');
