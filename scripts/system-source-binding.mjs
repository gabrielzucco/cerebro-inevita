#!/usr/bin/env node

import { existsSync, lstatSync, readFileSync, readdirSync } from 'node:fs';
import { isAbsolute, join, relative, resolve, sep } from 'node:path';
import { ensureBrain, layout, readJson, validateSourceContract, validateSystemContract } from './lib/system-protocol.mjs';
import {
  listSystemSourceBindings,
  requestedGrantMode,
  saveSystemSourceBinding,
  validateSystemSourceBinding,
  validateSystemSourceBindingReferences,
} from './lib/system-source-binding.mjs';

const args = process.argv.slice(2);
const action = args.find((arg) => !arg.startsWith('--')) || '';
const positional = args.filter((arg) => !arg.startsWith('--')).slice(1);
const option = (name) => args.find((arg) => arg.startsWith(`--${name}=`))?.slice(name.length + 3) || '';
const root = resolve(option('root') || process.cwd());
const confirmed = args.includes('--confirm');

function fail(message) {
  console.error(`✗ ${message}`);
  process.exit(1);
}

function jsonFiles(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory).filter((name) => name.endsWith('.json')).sort()
    .map((name) => join(directory, name))
    .filter((path) => lstatSync(path).isFile() && !lstatSync(path).isSymbolicLink());
}

function safeInputPath(input) {
  if (!input || isAbsolute(input)) fail('binding precisa ser caminho relativo dentro do Cérebro');
  const path = resolve(root, input);
  const rel = relative(root, path);
  if (!rel || rel.startsWith('..') || rel.startsWith(sep)) fail('binding aponta para fora do Cérebro');
  if (!existsSync(path) || !lstatSync(path).isFile() || lstatSync(path).isSymbolicLink()) {
    fail('binding precisa ser arquivo local regular, sem symlink');
  }
  return path;
}

function readContracts(directory, validate) {
  const values = [];
  for (const path of jsonFiles(directory)) {
    try {
      const value = readJson(path);
      if (!validate(value).length) values.push({ value, path });
    } catch { /* contrato inválido não vira candidato */ }
  }
  return values;
}

function findInstalledSystem(systemRef) {
  const configured = resolve(root, layout(root).systemContracts || '.cerebro/contracts/systems');
  for (const entry of readContracts(configured, validateSystemContract)) {
    if (entry.value.system_id === systemRef) return entry;
  }
  const installed = join(root, 'sistemas', 'outros-instalados');
  if (existsSync(installed)) {
    for (const name of readdirSync(installed).sort()) {
      const path = join(installed, name, 'contract.json');
      if (!existsSync(path)) continue;
      const value = readJson(path);
      if (!validateSystemContract(value).length && value.system_id === systemRef) return { value, path };
    }
  }
  const published = join(root, 'comunidade', 'inevita', 'sistemas-disponiveis', systemRef, 'contract.json');
  if (existsSync(published) && lstatSync(published).isFile() && !lstatSync(published).isSymbolicLink()) {
    const value = readJson(published);
    if (!validateSystemContract(value).length && value.system_id === systemRef) return { value, path: published };
  }
  fail(`System Contract não encontrado: ${systemRef}`);
}

function sources() {
  const directory = resolve(root, layout(root).sourceContracts || '.cerebro/contracts/sources');
  return readContracts(directory, validateSourceContract);
}

function grantFor(ref) {
  if (!ref) return null;
  const directory = resolve(root, layout(root).accessGrants || '.cerebro/contracts/access-grants');
  const path = join(directory, `${ref}.json`);
  return existsSync(path) ? readJson(path, `Access Grant ${ref}`) : null;
}

function mechanicalCandidate(requirement, source) {
  const mode = requestedGrantMode(requirement.access);
  const reasons = [];
  if (source.status !== 'active') reasons.push('source-not-active');
  if (!source.modes.includes(mode)) reasons.push('access-mode-not-supported');
  if (requirement.source_id && requirement.source_id !== source.source_id) reasons.push('explicit-source-mismatch');
  return {
    source_ref: source.source_id,
    source_type: source.type,
    status: reasons.length ? 'incompatible' : 'candidate-human-semantic-check-required',
    reason_codes: reasons.length ? reasons : ['mechanical-checks-pass', 'semantic-role-approval-required'],
  };
}

if (!['plan', 'bind', 'list'].includes(action)) fail('ação válida: plan, bind ou list');
ensureBrain(root);

if (action === 'list') {
  const issues = [];
  console.log(JSON.stringify({ bindings: listSystemSourceBindings(root, issues).map((entry) => entry.binding), issues }, null, 2));
  process.exit(0);
}

if (action === 'plan') {
  const systemRef = positional[0];
  if (!systemRef) fail('informe o system_ref');
  const system = findInstalledSystem(systemRef).value;
  const available = sources().map((entry) => entry.value);
  const current = listSystemSourceBindings(root).filter((entry) => entry.binding.system_ref === systemRef);
  console.log(JSON.stringify({
    system_ref: system.system_id,
    system_version: system.version,
    requirements: system.sources.map((requirement) => ({
      role: requirement.role,
      required: requirement.required,
      requested_access: requirement.access,
      purpose: requirement.purpose,
      freshness: requirement.freshness,
      current_binding: current.find((entry) => entry.binding.role === requirement.role)?.binding || null,
      candidates: available.map((source) => mechanicalCandidate(requirement, source)),
    })),
    rule: 'candidate não é compatibilidade semântica; o dono aprova papel, Fonte e grant antes de ready',
    privacy: { source_content_read: false, connector_credential_read: false },
  }, null, 2));
  process.exit(0);
}

const bindingPath = positional[0];
if (!bindingPath) fail('informe o caminho do binding');
const binding = JSON.parse(readFileSync(safeInputPath(bindingPath), 'utf8'));
const bindingErrors = validateSystemSourceBinding(binding);
if (bindingErrors.length) fail(bindingErrors.join(' · '));
const system = findInstalledSystem(binding.system_ref).value;
const sourceEntry = sources().find((entry) => entry.value.source_id === binding.source_ref);
if (!sourceEntry) fail(`Source Contract não encontrado: ${binding.source_ref}`);
const grant = grantFor(binding.grant_ref);
const refs = { system, source: sourceEntry.value, grant };
const errors = validateSystemSourceBindingReferences(binding, refs);
if (errors.length) fail(errors.join(' · '));
if (!confirmed) {
  console.log(JSON.stringify({
    status: 'preview', binding_id: binding.binding_id, system_ref: binding.system_ref,
    role: binding.role, source_ref: binding.source_ref, binding_status: binding.status,
    source_contract_changed: false, connector_changed: false, content_read: false,
    confirm_with: `node scripts/system-source-binding.mjs bind ${bindingPath} --confirm`,
  }, null, 2));
  process.exit(2);
}
const saved = saveSystemSourceBinding(root, binding, refs, { replace: args.includes('--replace') });
console.log(`✓ ${binding.system_ref}:${binding.role} → ${binding.source_ref} · ${saved.status} · ${binding.status}`);
