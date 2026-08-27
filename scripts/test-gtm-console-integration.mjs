#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildConsoleReadModel } from './lib/console-read-model.mjs';
import { systemWorkspace } from './console-server.mjs';
import { validateCapabilityContract, validateSystemContract } from './lib/system-protocol.mjs';

const root = resolve(process.cwd());
const read = (path) => readFileSync(resolve(root, path), 'utf8');
const contract = JSON.parse(read('sistemas/next-best-gtm/contract.json'));
const capability = JSON.parse(read('sistemas/next-best-gtm/capability.json'));

assert.deepEqual(validateSystemContract(contract), [], 'System Contract do GTM precisa ser válido');
assert.deepEqual(validateCapabilityContract(capability), [], 'Capability do GTM precisa ser válida');
assert.equal(contract.protocol_version, 2);
assert.equal(contract.version, '1.4.3');
assert.equal(contract.extensions.interface_ref, 'http://localhost:3300/');
assert.equal(contract.extensions.migration_stage, 'configured');
assert.match(contract.extensions.next_gate, /primeiro Run.*ledger do Company Brain/i);
assert.doesNotMatch(JSON.stringify(contract), /gbrain|supabase/i, 'contrato de recuperação não pode acoplar provider');
assert.equal(contract.permissions.external_actions, false, 'GTM não pode executar outbound pelo contrato');

const model = buildConsoleReadModel(root);
const gtm = model.systems.find((system) => system.contract_id === 'next-best-gtm');
assert(gtm, 'GTM precisa aparecer no catálogo local');
assert.equal(gtm.name, 'GTM');
assert.equal(gtm.contract_ref, 'sistemas/next-best-gtm/contract.json');
assert.equal(gtm.interface_ref, 'http://localhost:3300/');
assert.equal(gtm.retrieval_status, 'declared');
assert.equal(gtm.source_refs.filter((source) => source.required).length, 3);

const workspace = systemWorkspace(root, 'next-best-gtm');
assert.equal(workspace.contract.retrieval.version, '1.0.0', 'workspace precisa ler o contrato empacotado real');
assert.equal(workspace.contract.pipeline.length, 3);
assert.equal(workspace.sources.length, 4);
assert.equal(workspace.records.length, 0, 'runs externos não podem virar Run Records retroativos');
assert(workspace.sources.every((source) => source.contract_status === null), 'Fontes ausentes precisam permanecer ausentes');

const app = read('console/app.js');
assert.match(app, /function systemPreflight\(system\)/, 'Launcher precisa de pré-diagnóstico');
assert.match(app, /Precisa preparar contexto/, 'ausência de Fonte precisa ter estado honesto');
assert.match(app, /autorizações ainda precisam ser verificadas/, 'Fonte encontrada não equivale a grant');
assert.match(app, /data-readiness=/, 'pré-diagnóstico precisa ser observável no DOM');

console.log('gtm-console-integration: ok');
