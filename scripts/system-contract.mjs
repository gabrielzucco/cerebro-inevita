#!/usr/bin/env node

import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import {
  ensureBrain,
  ID_RE,
  readJson,
  validateSystemContract,
  writeJsonAtomic,
} from './lib/system-protocol.mjs';

const ROOT = resolve(process.env.CEREBRO_INSTALL_ROOT
  || join(dirname(fileURLToPath(import.meta.url)), '..'));
const [action = '', target = ''] = process.argv.slice(2).filter((arg) => !arg.startsWith('--'));
const confirmed = process.argv.includes('--confirm');

function fail(message) {
  console.error(`✗ ${message}`);
  process.exit(1);
}

function refreshBrief() {
  const script = join(ROOT, 'scripts', 'generate-operating-brief.mjs');
  if (!existsSync(script)) return;
  spawnSync(process.execPath, [script], {
    cwd: ROOT,
    env: { ...process.env, CEREBRO_INSTALL_ROOT: ROOT },
    stdio: 'ignore',
    timeout: 2500,
  });
}

try {
  ensureBrain(ROOT);
  if (action === 'validate') {
    if (!target) fail('informe o caminho do contract.json');
    const contract = readJson(resolve(ROOT, target), target);
    const errors = validateSystemContract(contract);
    if (errors.length) fail(errors.join(' · '));
    console.log(`✓ System Contract válido: ${contract.system_id}@${contract.version}`);
    process.exit(0);
  }

  if (action === 'show') {
    if (!ID_RE.test(target)) fail('informe um system_id válido');
    const path = join(ROOT, '.cerebro', 'contracts', `${target}.json`);
    if (!existsSync(path)) fail(`System Contract não registrado: ${target}`);
    console.log(JSON.stringify(readJson(path), null, 2));
    process.exit(0);
  }

  if (action !== 'register') fail('ação válida: validate, register ou show');
  if (!confirmed) fail('registro exige aprovação explícita: repita com --confirm');
  if (!target) fail('informe o caminho do contract.json');
  const contract = readJson(resolve(ROOT, target), target);
  const errors = validateSystemContract(contract);
  if (errors.length) fail(errors.join(' · '));

  const contractPath = join(ROOT, '.cerebro', 'contracts', `${contract.system_id}.json`);
  const statePath = join(ROOT, '.cerebro', 'sistemas', `${contract.system_id}.json`);
  const previous = existsSync(statePath) ? readJson(statePath, 'estado local do Sistema') : {};
  const status = contract.status === 'active' ? 'active' : (previous.status || 'configuring');
  const now = new Date().toISOString();
  writeJsonAtomic(contractPath, contract);
  writeJsonAtomic(statePath, {
    ...previous,
    slug: contract.system_id,
    system_id: contract.system_id,
    package_version: contract.version,
    capability: contract.capability,
    contract_path: `.cerebro/contracts/${contract.system_id}.json`,
    contract_status: contract.status,
    status,
    updated_at: now,
  });
  refreshBrief();
  console.log(`✓ ${contract.system_id}@${contract.version} registrado no control plane local`);
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
}
