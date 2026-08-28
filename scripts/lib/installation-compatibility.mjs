import { existsSync, lstatSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import {
  layout,
  validateSourceContract,
  validateSystemContract,
} from './system-protocol.mjs';
import {
  listSystemSourceBindings,
  requestedGrantMode,
  validateSystemSourceBindingReferences,
} from './system-source-binding.mjs';

function safeDirectory(root, configured, fallback) {
  const brain = resolve(root);
  const directory = resolve(root, configured || fallback);
  const rel = relative(brain, directory);
  if (!rel || rel.startsWith('..') || rel.startsWith(sep)) throw new Error('layout aponta para fora do Cérebro');
  return directory;
}

function jsonFiles(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory).filter((name) => name.endsWith('.json')).sort()
    .map((name) => join(directory, name))
    .filter((path) => lstatSync(path).isFile() && !lstatSync(path).isSymbolicLink());
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

export function listInstallationSources(root, issues = []) {
  const directory = safeDirectory(root, layout(root).sourceContracts, '.cerebro/contracts/sources');
  const sources = [];
  for (const path of jsonFiles(directory)) {
    try {
      const source = readJson(path);
      const errors = validateSourceContract(source);
      if (errors.length) throw new Error('invalid');
      sources.push(source);
    } catch {
      issues.push({ reason_code: 'source-contract-invalid', ref: relative(root, path).replaceAll('\\', '/') });
    }
  }
  return sources;
}

function grant(root, grantRef) {
  if (!grantRef) return null;
  const directory = safeDirectory(root, layout(root).accessGrants, '.cerebro/contracts/access-grants');
  const path = join(directory, `${grantRef}.json`);
  if (!existsSync(path) || !lstatSync(path).isFile() || lstatSync(path).isSymbolicLink()) return null;
  try { return readJson(path); } catch { return null; }
}

function sourceView(source) {
  return {
    source_ref: source.source_id,
    name: source.name,
    type: source.type,
    status: source.status,
    modes: [...source.modes],
    assurance: source.assurance,
  };
}

function mechanicalCandidate(requirement, source) {
  const requestedMode = requestedGrantMode(requirement.access);
  const reasons = [];
  if (source.status !== 'active') reasons.push('source-not-active');
  if (!source.modes.includes(requestedMode)) reasons.push('access-mode-not-supported');
  if (requirement.source_id && requirement.source_id !== source.source_id) reasons.push('explicit-source-mismatch');
  return {
    ...sourceView(source),
    compatibility: reasons.length ? 'incompatible' : 'semantic-approval-required',
    reason_codes: reasons.length ? reasons : ['mechanical-checks-pass', 'semantic-role-approval-required'],
  };
}

function bindingState(root, system, requirement, entries, sourceById, now) {
  if (entries.length > 1) {
    return {
      status: 'incompatible',
      binding_ref: null,
      source: null,
      reason_codes: ['system-source-binding-ambiguous'],
    };
  }
  if (!entries.length) return null;
  const binding = entries[0].binding;
  if (binding.system_version !== system.version) {
    return {
      status: 'incompatible', binding_ref: binding.binding_id, source: null,
      reason_codes: ['binding-system-version-mismatch'],
    };
  }
  const source = sourceById.get(binding.source_ref);
  if (!source) {
    return {
      status: 'incompatible', binding_ref: binding.binding_id, source: null,
      reason_codes: ['bound-source-not-found'],
    };
  }
  const candidate = mechanicalCandidate(requirement, source);
  if (candidate.compatibility === 'incompatible') {
    return {
      status: 'incompatible', binding_ref: binding.binding_id, source: sourceView(source),
      reason_codes: candidate.reason_codes,
    };
  }
  if (['revoked', 'incompatible'].includes(binding.status)) {
    return {
      status: 'incompatible', binding_ref: binding.binding_id, source: sourceView(source),
      reason_codes: [`binding-${binding.status}`],
    };
  }
  if (binding.status === 'degraded') {
    return {
      status: 'degraded', binding_ref: binding.binding_id, source: sourceView(source),
      reason_codes: ['binding-degraded'],
    };
  }
  if (['proposed', 'awaiting-approval'].includes(binding.status)) {
    return {
      status: 'awaiting-approval', binding_ref: binding.binding_id, source: sourceView(source),
      reason_codes: ['semantic-role-approval-required', 'access-grant-required'],
    };
  }
  const observed = { ...binding, checked_at: now.toISOString() };
  const errors = validateSystemSourceBindingReferences(observed, {
    system,
    source,
    grant: grant(root, binding.grant_ref),
  });
  return errors.length
    ? {
      status: 'incompatible', binding_ref: binding.binding_id, source: sourceView(source),
      reason_codes: ['binding-reference-invalid'],
    }
    : {
      status: 'ready', binding_ref: binding.binding_id, source: sourceView(source),
      reason_codes: ['role-source-compatible', 'grant-active'],
    };
}

function overallStatus(roles) {
  const required = roles.filter((role) => role.required);
  if (!required.length) return 'not-required';
  if (required.some((role) => role.status === 'missing-source')) return 'missing-source';
  if (required.some((role) => role.status === 'incompatible')) return 'incompatible';
  if (required.some((role) => role.status === 'awaiting-approval')) return 'awaiting-approval';
  if (required.some((role) => role.status === 'needs-mapping')) return 'needs-mapping';
  if (required.some((role) => role.status === 'degraded')) return 'degraded';
  return 'ready';
}

function nextAction(status, installed) {
  if (status === 'missing-source') return 'register-source';
  if (status === 'incompatible' || status === 'degraded') return 'repair-binding';
  if (status === 'needs-mapping') return 'map-sources';
  if (status === 'awaiting-approval') return 'approve-bindings-and-grants';
  if (status === 'ready') return installed ? 'run-first-case' : 'install-package';
  return installed ? 'run-first-case' : 'install-package';
}

export function buildInstallationCompatibility(root, system, {
  installed = false,
  now = new Date(),
} = {}) {
  const systemErrors = validateSystemContract(system);
  if (systemErrors.length) throw new Error(`System Contract inválido: ${systemErrors.join(' · ')}`);
  const issues = [];
  const sources = listInstallationSources(root, issues);
  const sourceById = new Map(sources.map((source) => [source.source_id, source]));
  const bindingIssues = [];
  const bindings = listSystemSourceBindings(root, bindingIssues)
    .filter((entry) => entry.binding.system_ref === system.system_id);
  issues.push(...bindingIssues);
  const roles = system.sources.map((requirement) => {
    const entries = bindings.filter((entry) => entry.binding.role === requirement.role);
    const current = bindingState(root, system, requirement, entries, sourceById, now);
    const candidates = sources.map((source) => mechanicalCandidate(requirement, source));
    const viable = candidates.filter((candidate) => candidate.compatibility === 'semantic-approval-required');
    return {
      role: requirement.role,
      required: requirement.required,
      requested_access: requirement.access,
      purpose: requirement.purpose,
      freshness: requirement.freshness,
      status: current?.status || (viable.length ? 'needs-mapping' : 'missing-source'),
      current_binding: current,
      candidates,
    };
  });
  const status = overallStatus(roles);
  return {
    system_ref: system.system_id,
    system_version: system.version,
    status,
    installed,
    activation_ready: status === 'ready' || status === 'not-required',
    next_action: nextAction(status, installed),
    counts: {
      roles: roles.length,
      required_roles: roles.filter((role) => role.required).length,
      ready_roles: roles.filter((role) => role.required && role.status === 'ready').length,
      available_sources: sources.length,
    },
    roles,
    issues,
    agent_command: `node scripts/installation-compatibility.mjs plan ${system.system_id}`,
    rule: 'candidato mecânico não prova compatibilidade semântica; o dono aprova binding e grant antes de ready',
    privacy: {
      source_content_read: false,
      connector_credential_read: false,
      inventory_shared_with_inevita: false,
      reference_only: true,
    },
  };
}
