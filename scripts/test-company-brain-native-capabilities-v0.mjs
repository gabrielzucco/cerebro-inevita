#!/usr/bin/env node

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { nativeCapabilitiesModel } from './console-server.mjs';

const skill = (skill_id, installation_status = 'available') => ({
  skill_id,
  name: skill_id,
  installation_status,
});

const skillCatalog = {
  skills: [
    skill('fonte'), skill('revisar'), skill('guardar'), skill('daily'), skill('reindex', 'degraded'),
    skill('teste'), skill('arquiteto'), skill('sistematizar'), skill('operar'),
  ],
};
const systemContracts = [
  { system_id: 'gtm', name: 'Próxima Melhor Ação GTM', sources: [{}], retrieval: {}, eval: {}, learning: {} },
  { system_id: 'calls', name: 'Calls', sources: [{}], retrieval: {}, eval: {}, learning: {} },
];
const complete = nativeCapabilitiesModel({
  skillCatalog,
  systemContracts,
  sourceCounts: { total: 4, observed: 3 },
  health: {
    quality: { measured: true, percent: 91.43, cases: 35 },
    operation: { current_status: 'healthy' },
    provider: {
      provider_id: 'company-context-v1',
      name: 'Company Context',
      implementation: 'gbrain',
      implementation_version: '0.46.30.0',
    },
  },
  runs: [
    { eval_passed: true, outcomes: 1 },
    { eval_passed: null, outcomes: 0 },
  ],
  judgments: [{ receipt_id: 'judgment-1' }],
  corrections: [{ receipt_id: 'correction-1' }],
  candidates: [{ candidate_id: 'candidate-1' }],
});

assert.deepEqual(complete.map((item) => item.id), [
  'sources', 'memory', 'retrieval', 'structure', 'evaluation', 'learning',
]);
assert.equal(complete.find((item) => item.id === 'sources').state, 'operational');
assert.equal(complete.find((item) => item.id === 'memory').state, 'available');
assert.match(complete.find((item) => item.id === 'memory').proof.detail, /não emitem recibos canônicos/);
assert.equal(complete.find((item) => item.id === 'retrieval').state, 'measured');
assert.equal(complete.find((item) => item.id === 'retrieval').proof.headline, '91,4% Hit@3');
assert.deepEqual(complete.find((item) => item.id === 'retrieval').provider, {
  provider_id: 'company-context-v1',
  name: 'Company Context',
  implementation: 'gbrain',
  implementation_version: '0.46.30.0',
  substitutable: true,
});
assert.equal(complete.find((item) => item.id === 'retrieval').systems.count, 2);
assert.equal(complete.find((item) => item.id === 'structure').state, 'operational');
assert.equal(complete.find((item) => item.id === 'evaluation').proof.headline, '1/2 Runs avaliados');
assert.equal(complete.find((item) => item.id === 'learning').state, 'operational');

const empty = nativeCapabilitiesModel();
assert.equal(empty.length, 6);
assert(empty.every((item) => item.state === 'declared'));
assert.equal(empty.find((item) => item.id === 'retrieval').proof.headline, 'Benchmark não medido');

const providerOnly = nativeCapabilitiesModel({
  health: { provider: { provider_id: 'provider-local', name: 'Provider local' } },
});
assert.equal(providerOnly.find((item) => item.id === 'retrieval').state, 'available');
const healthy = nativeCapabilitiesModel({ health: { operation: { current_status: 'healthy' } } });
assert.equal(healthy.find((item) => item.id === 'retrieval').state, 'operational');

const notInstalled = nativeCapabilitiesModel({
  skillCatalog: { skills: [skill('guardar', 'motor-only'), skill('daily', 'degraded')] },
});
const memory = notInstalled.find((item) => item.id === 'memory');
assert.equal(memory.state, 'declared');
assert.deepEqual(memory.skills.map((item) => item.status), ['motor-only', 'degraded']);
assert.equal(memory.proof.headline, '1 instaladas · 1 no motor');

const serialized = JSON.stringify(complete);
for (const forbidden of ['skill_body', 'selected_refs', 'query_text', 'raw_error']) {
  assert(!serialized.includes(forbidden), `read model não pode expor ${forbidden}`);
}

const root = resolve(process.cwd());
const app = readFileSync(resolve(root, 'console/app.js'), 'utf8');
const css = readFileSync(resolve(root, 'console/styles.css'), 'utf8');
const server = readFileSync(resolve(root, 'scripts/console-server.mjs'), 'utf8');
assert.match(server, /export function nativeCapabilitiesModel/);
assert.match(server, /substitutable: true/);
assert.match(app, /function renderNativeCapabilities/);
assert.match(app, /O que vem com o Cérebro/);
assert.match(app, /Capacidade é permanente\. Skill é o instrumento\. Provider é substituível\./);
assert.match(app, /data-view="skills"/);
assert.match(app, /data-brain-mode/);
assert.match(css, /\.native-capability-grid/);
assert.match(css, /grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/);

console.log('company-brain-native-capabilities-v0: ok');
