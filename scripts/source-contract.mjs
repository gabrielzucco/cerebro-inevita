#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ensureBrain,
  ID_RE,
  readJson,
  safeRelativePath,
  validateSourceContract,
  writeJsonAtomic,
} from './lib/system-protocol.mjs';

const SCRIPT_ROOT = resolve(join(dirname(fileURLToPath(import.meta.url)), '..'));

function fail(message) {
  console.error(`✗ ${message}`);
  process.exit(1);
}

function parseArgs(argv) {
  const positional = [];
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--confirm') options.confirm = true;
    else if (arg.startsWith('--') && arg.includes('=')) {
      const separator = arg.indexOf('=');
      options[arg.slice(2, separator)] = arg.slice(separator + 1);
    } else if (arg.startsWith('--')) {
      const key = arg.slice(2);
      if (!argv[index + 1] || argv[index + 1].startsWith('--')) fail(`falta valor para --${key}`);
      options[key] = argv[index + 1];
      index += 1;
    } else positional.push(arg);
  }
  return { positional, options };
}

export function sourceContractFromRegistryEntry(source) {
  const observedAt = typeof source.updatedAt === 'string' && Number.isFinite(Date.parse(source.updatedAt))
    ? source.updatedAt
    : null;
  const status = source.status === 'active'
    ? 'active'
    : (source.status === 'revoked' ? 'revoked' : (source.status === 'degraded' ? 'degraded' : 'mapped'));
  return {
    protocol_version: 1,
    source_id: source.id,
    name: source.label,
    type: ID_RE.test(source.type || '') ? source.type : 'source-adapter',
    status,
    truth: {
      home_ref: source.location,
      source_of_truth: source.sourceOfTruth === true,
    },
    authority: {
      owner_ref: null,
      status: 'unconfirmed',
    },
    scope: {
      purpose: source.scope || 'escopo não declarado',
      entity_types: [],
      boundaries: ['migrado do registro simples; autoridade e retenção aguardam confirmação'],
    },
    sensitivity: ['private', 'team', 'public'].includes(source.sensitivity)
      ? source.sensitivity
      : 'private',
    pii: {
      classification: 'unknown',
      handling: 'local-processing',
    },
    modes: ['read'],
    freshness: {
      policy: source.refresh || 'manual',
      observed_at: observedAt,
    },
    retention: {
      policy: 'not-declared',
      until: null,
    },
    revocation: {
      method: 'remover o ponteiro local e registrar recibo',
      effect: 'receipt-only',
      revocable: true,
    },
    connector: {
      kind: ID_RE.test(source.type || '') ? source.type : 'source-adapter',
      binding_ref: null,
      credential_ref: null,
      custody: 'agent-direct',
    },
    authorized_consumers: [],
    assurance: 'receipt-audited',
  };
}

export function planRegistryMigration(root, outputDirectory = '.cerebro/contracts/sources') {
  const registryPath = join(root, 'conexoes', 'configuradas', 'fontes.json');
  if (!existsSync(registryPath)) throw new Error('registro simples não encontrado em conexoes/configuradas/fontes.json');
  const registry = readJson(registryPath, 'registro simples de fontes');
  if (registry.version !== 1 || !Array.isArray(registry.sources)) throw new Error('schema do registro simples incompatível');
  const outputRelative = safeRelativePath(root, outputDirectory);
  if (!outputRelative.startsWith('.cerebro/contracts/')) {
    throw new Error('Source Contracts precisam ficar na área privada .cerebro/contracts/');
  }
  const seen = new Set();
  const changes = registry.sources.map((source, index) => {
    if (!source || typeof source !== 'object') throw new Error(`fonte ${index + 1} do registro é inválida`);
    const contract = sourceContractFromRegistryEntry(source);
    const validationErrors = validateSourceContract(contract);
    if (validationErrors.length) throw new Error(`fonte ${index + 1} não pode migrar: ${validationErrors.join(' · ')}`);
    if (seen.has(contract.source_id)) throw new Error(`source_id duplicado no registro: ${contract.source_id}`);
    seen.add(contract.source_id);
    const path = join(root, outputRelative, `${contract.source_id}.json`);
    const before = existsSync(path) ? readJson(path, `Source Contract ${contract.source_id}`) : null;
    const action = before === null
      ? 'create'
      : (JSON.stringify(before) === JSON.stringify(contract) ? 'no-change' : 'conflict');
    return {
      source_id: contract.source_id,
      action,
      output_ref: `${outputRelative}/${contract.source_id}.json`,
      before,
      after: contract,
    };
  });
  return {
    migration: 'source-registry-v1-to-source-contract-v1',
    mode: 'preview',
    registry_ref: 'conexoes/configuradas/fontes.json',
    output_ref: outputRelative,
    changes,
    source_guarantee: {
      opened: false,
      copied: false,
      modified: false,
    },
    rollback: {
      registry_unchanged: true,
      strategy: 'remover somente os contratos listados como create',
    },
  };
}

export function applyRegistryMigration(root, plan) {
  const conflicts = plan.changes.filter((change) => change.action === 'conflict');
  if (conflicts.length) {
    throw new Error(`migração bloqueada: contratos existentes divergem (${conflicts.map((item) => item.source_id).join(', ')})`);
  }
  const created = [];
  for (const change of plan.changes) {
    if (change.action !== 'create') continue;
    writeJsonAtomic(join(root, change.output_ref), change.after);
    created.push(change.output_ref);
  }
  return {
    ...plan,
    mode: 'applied',
    created,
    unchanged: plan.changes.filter((change) => change.action === 'no-change').map((change) => change.output_ref),
  };
}

function main() {
  const { positional, options } = parseArgs(process.argv.slice(2));
  const [action = '', target = ''] = positional;
  const root = resolve(options.brain || process.env.CEREBRO_INSTALL_ROOT || SCRIPT_ROOT);
  try {
    ensureBrain(root);
    if (action === 'validate') {
      if (!target) fail('informe o caminho do Source Contract');
      const contract = readJson(resolve(root, target), target);
      const errors = validateSourceContract(contract);
      if (errors.length) fail(errors.join(' · '));
      console.log(`✓ Source Contract válido: ${contract.source_id}`);
      return;
    }
    if (action === 'show') {
      if (!ID_RE.test(target || '')) fail('informe um source_id válido');
      const path = join(root, '.cerebro', 'contracts', 'sources', `${target}.json`);
      if (!existsSync(path)) fail(`Source Contract não encontrado: ${target}`);
      console.log(readFileSync(path, 'utf8').trimEnd());
      return;
    }
    if (action !== 'migrate-registry') {
      fail('ação válida: validate, show ou migrate-registry');
    }
    const plan = planRegistryMigration(root, options.output || '.cerebro/contracts/sources');
    if (!options.confirm) {
      console.log(JSON.stringify(plan, null, 2));
      return;
    }
    console.log(JSON.stringify(applyRegistryMigration(root, plan), null, 2));
  } catch (error) {
    fail(error instanceof Error ? error.message : String(error));
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
