#!/usr/bin/env node

import assert from 'node:assert/strict';
import {
  chmodSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import {
  buildCompatibilityDiagnostic,
  validateBrainManifest,
} from './lib/compatibility-diagnostic.mjs';

const ROOT = resolve(process.cwd());
const sandboxes = [];
const fixedNow = new Date('2026-08-24T16:00:00.000Z');

function sandbox(prefix) {
  const root = mkdtempSync(join(tmpdir(), prefix));
  sandboxes.push(root);
  return root;
}

function write(root, relativePath, value) {
  const path = join(root, relativePath);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, typeof value === 'string' ? value : `${JSON.stringify(value, null, 2)}\n`);
}

function example(name) {
  return JSON.parse(readFileSync(join(ROOT, 'protocol', 'examples', name), 'utf8'));
}

function manifest(profile = 'full') {
  return { ...example('brain-manifest.v1.json'), profile };
}

function baseLayout() {
  return {
    version: 3,
    companyMap: 'company/map.md',
    sourceContracts: '.cerebro/contracts/sources',
    systemContracts: '.cerebro/contracts/systems',
    routineContracts: '.cerebro/contracts/routines',
    accessGrants: '.cerebro/contracts/access-grants',
    runLedger: '.cerebro/runtime/ledger/runs.jsonl',
  };
}

function installFoundation(root, profile = 'full') {
  write(root, '.cerebro/manifest.json', manifest(profile));
  write(root, '.cerebro/layout.json', baseLayout());
  write(root, 'VERSION', '1.32.0\n');
  write(root, 'COMECE-AQUI.md', '# technical entrypoint\n');
  write(root, 'AGENTS.md', '# technical entrypoint\n');
  write(root, 'company/map.md', '# private company map\n');
}

try {
  const validManifest = manifest();
  assert.deepEqual(validateBrainManifest(validManifest), []);
  const unknown = structuredClone(validManifest);
  unknown.systems = [];
  assert(validateBrainManifest(unknown).some((error) => error.includes('não é permitido')),
    'Manifest não pode virar inventário operacional paralelo');
  const unsafe = structuredClone(validManifest);
  unsafe.layout_ref = '../outside.json';
  assert(validateBrainManifest(unsafe).some((error) => error.includes('referência relativa segura')),
    'Manifest precisa recusar referência fora do cérebro');

  const emptyRoot = sandbox('brain-compat-empty-');
  const empty = buildCompatibilityDiagnostic(emptyRoot, { now: fixedNow });
  assert.equal(empty.target.classification, 'new');
  assert.equal(empty.guarantees.read_only, true);
  assert.equal(empty.score.met, 0);

  const organizedRoot = sandbox('brain-compat-organized-');
  write(organizedRoot, 'company/map.md', '# conteúdo humano que o scanner não abre\n');
  const privatePath = join(organizedRoot, 'company', 'private-source.txt');
  write(organizedRoot, 'company/private-source.txt', 'NUNCA LER\n');
  chmodSync(privatePath, 0o000);
  const organized = buildCompatibilityDiagnostic(organizedRoot, { now: fixedNow });
  assert.equal(organized.target.classification, 'organized-context');
  assert.equal(organized.guarantees.content_files_opened, false);
  chmodSync(privatePath, 0o600);

  const legacyRoot = sandbox('brain-compat-legacy-');
  write(legacyRoot, 'AGENTS.md', '# legacy entrypoint\n');
  write(legacyRoot, '.cerebro/legacy-brain.json', {
    protocol: 'company-brain', compatibility: 'legacy-vault', protocol_version: 1,
  });
  write(legacyRoot, '.cerebro/layout.json', baseLayout());
  const legacy = buildCompatibilityDiagnostic(legacyRoot, { now: fixedNow });
  assert.equal(legacy.target.classification, 'partial-brain');
  assert.equal(legacy.target.recognized_as, 'legacy-vault');
  assert.equal(legacy.checks.find((item) => item.id === 'manifest').status, 'partial');
  assert(legacy.recommendations.adapt.includes('legacy-marker-only'));

  const starterRoot = sandbox('brain-compat-starter-');
  installFoundation(starterRoot, 'starter');
  const starter = buildCompatibilityDiagnostic(starterRoot, { now: fixedNow });
  assert.equal(starter.target.classification, 'inevita-compatible');
  assert.equal(starter.target.activation_stage, 'foundation');
  assert.equal(starter.manifest.status, 'valid');
  assert.equal(starter.inventory.runs.valid, 0);
  assert.equal(starter.system_readiness.ready.length, 0);

  const operationalRoot = sandbox('brain-compat-operational-');
  installFoundation(operationalRoot);
  const source = example('source-contract.v1.json');
  for (const sourceId of ['paid-media', 'sales-ledger', 'experiment-ledger']) {
    write(operationalRoot, `.cerebro/contracts/sources/${sourceId}.json`, {
      ...source,
      source_id: sourceId,
      name: sourceId,
      truth: { ...source.truth, home_ref: `provider:${sourceId}/fixture` },
      connector: { ...source.connector, binding_ref: `connector:${sourceId}`, credential_ref: `os-keychain:${sourceId}` },
    });
  }
  const system = example('system-contract.v2.json');
  write(operationalRoot, '.cerebro/contracts/systems/analisar-funil.json', { ...system, status: 'active' });
  write(operationalRoot, '.cerebro/runtime/ledger/runs.jsonl', `${JSON.stringify(example('run-record.v2.json'))}\n`);
  const operational = buildCompatibilityDiagnostic(operationalRoot, { now: fixedNow });
  assert.equal(operational.target.activation_stage, 'operational');
  assert.equal(operational.inventory.sources.valid, 3);
  assert.equal(operational.inventory.systems.retrieval_v2, 1);
  assert.equal(operational.inventory.runs.context_snapshot_v2, 1);
  assert.deepEqual(operational.system_readiness.ready, [{ system_id: 'analisar-funil' }]);
  assert.equal(operational.checks.every((item) => item.status === 'met'), true);
  assert.equal(operational.score.percent, 100);

  const cli = JSON.parse(execFileSync(process.execPath, [
    join(ROOT, 'scripts', 'compatibility-diagnostic.mjs'), `--root=${starterRoot}`, '--compact',
  ], { encoding: 'utf8' }));
  assert.equal(cli.target.classification, 'inevita-compatible');
  assert.equal(cli.guarantees.migration_performed, false);
} finally {
  for (const root of sandboxes) rmSync(root, { recursive: true, force: true });
}

console.log('✓ Compatibility Doctor separa protocolo, maturidade e observação sem abrir conteúdo ou migrar o alvo');
