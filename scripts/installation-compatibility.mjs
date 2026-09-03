#!/usr/bin/env node

import { existsSync, lstatSync, readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { buildInstallationCompatibility } from './lib/installation-compatibility.mjs';
import { ID_RE, layout, validateSystemContract } from './lib/system-protocol.mjs';

const args = process.argv.slice(2);
const action = args.find((arg) => !arg.startsWith('--')) || '';
const positional = args.filter((arg) => !arg.startsWith('--')).slice(1);
const option = (name) => args.find((arg) => arg.startsWith(`--${name}=`))?.slice(name.length + 3) || '';
const root = resolve(option('root') || process.cwd());

function fail(message) {
  console.error(`✗ ${message}`);
  process.exit(1);
}

function regularJson(path) {
  if (!existsSync(path)) return null;
  try {
    if (!lstatSync(path).isFile() || lstatSync(path).isSymbolicLink()) return null;
    const value = JSON.parse(readFileSync(path, 'utf8'));
    return validateSystemContract(value).length ? null : value;
  } catch { return null; }
}

function findSystem(systemRef) {
  const direct = [
    join(root, 'sistemas', 'outros-instalados', systemRef, 'contract.json'),
    join(root, 'comunidade', 'inevita', 'sistemas-disponiveis', systemRef, 'contract.json'),
  ];
  for (const path of direct) {
    const value = regularJson(path);
    if (value?.system_id === systemRef) return value;
  }
  const directory = resolve(root, layout(root).systemContracts || '.cerebro/contracts/systems');
  if (existsSync(directory)) {
    for (const name of readdirSync(directory).filter((item) => item.endsWith('.json')).sort()) {
      const value = regularJson(join(directory, name));
      if (value?.system_id === systemRef) return value;
    }
  }
  fail(`System Contract não encontrado: ${systemRef}`);
}

if (action !== 'plan') fail('ação válida: plan');
const systemRef = positional[0];
if (!ID_RE.test(systemRef || '')) fail('informe um system_ref válido');
const installed = Boolean(regularJson(join(root, 'sistemas', 'outros-instalados', systemRef, 'contract.json')));
const plan = buildInstallationCompatibility(root, findSystem(systemRef), { installed });
console.log(JSON.stringify(plan, null, args.includes('--compact') ? 0 : 2));
