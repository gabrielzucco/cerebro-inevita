#!/usr/bin/env node
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import {
  systemClassification,
  systemTaxonomy,
} from './lib/system-taxonomy.mjs';

const root = resolve(process.cwd());
const app = readFileSync(join(root, 'console', 'app.js'), 'utf8');
const readModel = readFileSync(join(root, 'scripts', 'lib', 'console-read-model.mjs'), 'utf8');
const taxonomy = systemTaxonomy();

assert.deepEqual(taxonomy.operating_areas.map((item) => item.label), [
  'Comercial', 'Operações & Tecnologia', 'Produto & Comunidade',
]);
assert.deepEqual(taxonomy.business_functions.map((item) => item.label), [
  'Vendas', 'Marketing', 'Produto', 'Operações', 'Comunidade', 'Dados & Tecnologia',
]);
assert.deepEqual(systemClassification({ area_ref: 'crescimento' }), {
  operating_area: 'commercial', business_function: 'unclassified', product_kind: 'business-system', surface: 'systems',
});
assert.deepEqual(systemClassification({}, 'cerebro-base'), {
  operating_area: 'general', business_function: 'unclassified', product_kind: 'brain-native', surface: 'brain',
});
assert.deepEqual(systemClassification({ product_kind: 'brain-native', surface: 'brain' }, 'outro'), {
  operating_area: 'general', business_function: 'unclassified', product_kind: 'brain-native', surface: 'brain',
});

assert.match(app, /system\.business_function/, 'Launcher deve ler função empresarial declarada');
assert.match(app, /system\.operating_area/, 'escopo deve ler área responsável declarada');
assert.match(app, /Área responsável/, 'sidebar deve nomear o eixo de responsabilidade');
assert.doesNotMatch(app, /function systemBusinessCategory/, 'classificação por nome não pode sobreviver');
assert.doesNotMatch(app, /crescimento|fundacao|produto-comunidade/, 'taxonomia legada não pode aparecer no cliente');
assert.match(readModel, /systemClassification\(contract\.extensions, contract\.system_id\)/, 'read model deve classificar pelo contrato e identidade');

const expectedAreas = new Map([
  ['commercial', 7],
  ['operations-technology', 3],
  ['product-community', 7],
]);
const expectedFunctions = new Map([
  ['sales', 4],
  ['marketing', 3],
  ['product', 2],
  ['operations', 1],
  ['community', 3],
  ['data-technology', 4],
]);

const brainRoot = process.env.COMPANY_BRAIN_ROOT;
if (brainRoot) {
  const directory = resolve(brainRoot, '.cerebro', 'contracts', 'systems');
  assert(existsSync(directory), 'COMPANY_BRAIN_ROOT não contém System Contracts');
  const contracts = readdirSync(directory).filter((name) => name.endsWith('.json')).map((name) => (
    JSON.parse(readFileSync(join(directory, name), 'utf8'))
  ));
  assert.equal(contracts.length, 17);
  const areaCounts = new Map();
  const functionCounts = new Map();
  for (const contract of contracts) {
    const classification = systemClassification(contract.extensions);
    assert.notEqual(classification.business_function, 'unclassified', `${contract.system_id} sem função empresarial`);
    areaCounts.set(classification.operating_area, (areaCounts.get(classification.operating_area) || 0) + 1);
    functionCounts.set(classification.business_function, (functionCounts.get(classification.business_function) || 0) + 1);
  }
  assert.deepEqual(areaCounts, expectedAreas);
  assert.deepEqual(functionCounts, expectedFunctions);
}

console.log('company-brain-system-taxonomy-v1: ok');
