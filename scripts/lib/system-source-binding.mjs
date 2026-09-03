import { existsSync, lstatSync, mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import {
  ID_RE,
  REF_ID_RE,
  VERSION_RE,
  layout,
  validateAccessGrant,
  validateSourceContract,
  validateSystemContract,
  writeJsonAtomic,
} from './system-protocol.mjs';

const STATUSES = new Set(['proposed', 'awaiting-approval', 'ready', 'degraded', 'incompatible', 'revoked']);
const ACCESS = new Set(['manual', 'read-only', 'write-with-approval']);

function object(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function closed(errors, value, path, allowed) {
  if (!object(value)) {
    errors.push(`${path} precisa ser objeto`);
    return;
  }
  const keys = new Set(allowed);
  for (const key of Object.keys(value)) if (!keys.has(key)) errors.push(`${path}.${key} não é permitido`);
}

function date(value) {
  return typeof value === 'string' && Number.isFinite(Date.parse(value));
}

export function requestedGrantMode(access) {
  return access === 'write-with-approval' ? 'write-with-approval' : 'read';
}

export function validateSystemSourceBinding(value) {
  const errors = [];
  closed(errors, value, 'system_source_binding', [
    'protocol_version', 'binding_id', 'system_ref', 'system_version', 'role', 'source_ref',
    'requested_access', 'status', 'grant_ref', 'checked_at', 'reason_codes', 'approval', 'privacy',
  ]);
  if (!object(value)) return errors;
  if (value.protocol_version !== 1) errors.push('protocol_version precisa ser 1');
  if (!REF_ID_RE.test(value.binding_id || '')) errors.push('binding_id inválido');
  if (!ID_RE.test(value.system_ref || '')) errors.push('system_ref inválido');
  if (!VERSION_RE.test(value.system_version || '')) errors.push('system_version inválido');
  if (!ID_RE.test(value.role || '')) errors.push('role inválido');
  if (!REF_ID_RE.test(value.source_ref || '')) errors.push('source_ref inválido');
  if (!ACCESS.has(value.requested_access)) errors.push('requested_access inválido');
  if (!STATUSES.has(value.status)) errors.push('status inválido');
  if (value.grant_ref !== null && !REF_ID_RE.test(value.grant_ref || '')) errors.push('grant_ref inválido');
  if (!date(value.checked_at)) errors.push('checked_at inválido');
  if (!Array.isArray(value.reason_codes) || !value.reason_codes.length
    || value.reason_codes.some((code) => !ID_RE.test(code))) errors.push('reason_codes inválido');

  closed(errors, value.approval, 'approval', ['approved_by', 'approved_at']);
  if (object(value.approval)) {
    if (value.approval.approved_by !== null && !REF_ID_RE.test(value.approval.approved_by || '')) {
      errors.push('approval.approved_by inválido');
    }
    if (value.approval.approved_at !== null && !date(value.approval.approved_at)) {
      errors.push('approval.approved_at inválido');
    }
    if ((value.approval.approved_by === null) !== (value.approval.approved_at === null)) {
      errors.push('approval precisa ter aprovador e instante juntos');
    }
  }

  closed(errors, value.privacy, 'privacy', ['content_copied', 'credential_stored', 'shared_with_inevita']);
  if (object(value.privacy)) {
    if (value.privacy.content_copied !== false) errors.push('privacy.content_copied precisa ser false');
    if (value.privacy.credential_stored !== false) errors.push('privacy.credential_stored precisa ser false');
    if (value.privacy.shared_with_inevita !== false) errors.push('privacy.shared_with_inevita precisa ser false');
  }

  if (value.status === 'ready') {
    if (!value.grant_ref) errors.push('binding ready exige grant_ref');
    if (!value.approval?.approved_by || !value.approval?.approved_at) errors.push('binding ready exige aprovação humana');
    if (!value.reason_codes?.includes('role-source-compatible') || !value.reason_codes?.includes('grant-active')) {
      errors.push('binding ready exige reason_codes role-source-compatible e grant-active');
    }
  }
  if (['proposed', 'awaiting-approval'].includes(value.status)) {
    if (value.grant_ref !== null) errors.push(`${value.status} não pode declarar grant ativo`);
    if (value.approval?.approved_by !== null || value.approval?.approved_at !== null) {
      errors.push(`${value.status} não pode declarar aprovação concluída`);
    }
  }
  return errors;
}

function includesConsumer(source, systemRef) {
  const consumers = Array.isArray(source.authorized_consumers) ? source.authorized_consumers : [];
  if (!consumers.length) return true;
  return consumers.some((consumer) => consumer.subject_type === 'system' && consumer.subject_ref === systemRef);
}

export function validateSystemSourceBindingReferences(binding, { system, source, grant = null }) {
  const errors = [...validateSystemSourceBinding(binding)];
  const systemErrors = validateSystemContract(system);
  const sourceErrors = validateSourceContract(source);
  if (systemErrors.length) errors.push(`System Contract inválido: ${systemErrors.join(' · ')}`);
  if (sourceErrors.length) errors.push(`Source Contract inválido: ${sourceErrors.join(' · ')}`);
  if (systemErrors.length || sourceErrors.length) return errors;

  if (system.system_id !== binding.system_ref) errors.push('system_ref não corresponde ao System Contract');
  if (system.version !== binding.system_version) errors.push('system_version não corresponde ao System Contract');
  if (source.source_id !== binding.source_ref) errors.push('source_ref não corresponde ao Source Contract');
  const requirements = system.sources.filter((item) => item.role === binding.role);
  if (requirements.length !== 1) errors.push('role precisa existir exatamente uma vez no System Contract');
  const requirement = requirements[0];
  if (requirement) {
    if (requirement.access !== binding.requested_access) errors.push('requested_access diverge do papel no System Contract');
    if (requirement.source_id && requirement.source_id !== binding.source_ref) {
      errors.push('Source Contract diverge do source_id explícito do Sistema');
    }
    const mode = requestedGrantMode(requirement.access);
    if (!source.modes.includes(mode)) errors.push(`Source Contract não permite modo ${mode}`);
  }
  if (binding.status === 'ready' && source.status !== 'active') errors.push('binding ready exige Source Contract ativo');
  if (!includesConsumer(source, binding.system_ref)) errors.push('Source Contract não autoriza este Sistema');

  if (binding.status === 'ready') {
    if (!grant) errors.push('binding ready exige Access Grant existente');
    else {
      const grantErrors = validateAccessGrant(grant);
      if (grantErrors.length) errors.push(`Access Grant inválido: ${grantErrors.join(' · ')}`);
      else {
        const checkedAt = Date.parse(binding.checked_at);
        if (grant.grant_id !== binding.grant_ref) errors.push('grant_ref não corresponde ao Access Grant');
        if (grant.subject.type !== 'system' || grant.subject.ref !== binding.system_ref) {
          errors.push('Access Grant precisa ter o Sistema como sujeito');
        }
        if (!grant.scope.system_refs.includes(binding.system_ref)) errors.push('Access Grant não cobre o Sistema');
        if (!grant.scope.source_refs.includes(binding.source_ref)) errors.push('Access Grant não cobre a Fonte');
        if (grant.mode !== requestedGrantMode(binding.requested_access)) errors.push('Access Grant não cobre o modo solicitado');
        if (grant.assurance !== source.assurance) errors.push('Access Grant diverge da garantia da Fonte');
        if (Date.parse(grant.issued_at) > checkedAt) errors.push('Access Grant ainda não tinha sido emitido');
        if (grant.revoked_at && Date.parse(grant.revoked_at) <= checkedAt) errors.push('Access Grant revogado');
        if (grant.expires_at && Date.parse(grant.expires_at) <= checkedAt) errors.push('Access Grant expirado');
        if (grant.approved_by !== binding.approval.approved_by) errors.push('aprovador do binding diverge do Access Grant');
        if (Date.parse(binding.approval.approved_at) > checkedAt) errors.push('aprovação ocorreu depois da checagem');
      }
    }
  }
  return errors;
}

function inside(root, configured, fallback) {
  const brain = resolve(root);
  const directory = resolve(root, configured || fallback);
  const rel = relative(brain, directory);
  if (!rel || rel.startsWith('..') || rel.startsWith(sep)) throw new Error('systemSourceBindings aponta para fora do Cérebro');
  return directory;
}

export function systemSourceBindingDirectory(root) {
  return inside(root, layout(root).systemSourceBindings, '.cerebro/runtime/system-source-bindings');
}

export function saveSystemSourceBinding(root, binding, refs, { replace = false } = {}) {
  const errors = validateSystemSourceBindingReferences(binding, refs);
  if (errors.length) throw new Error(`System Source Binding inválido: ${errors.join(' · ')}`);
  const directory = systemSourceBindingDirectory(root);
  const path = join(directory, `${binding.binding_id}.json`);
  const existed = existsSync(path);
  if (existed && !replace) throw new Error('system-source-binding-exists');
  mkdirSync(directory, { recursive: true, mode: 0o700 });
  writeJsonAtomic(path, binding, 0o600);
  syncSystemSourceBindingState(root, refs.system);
  return { status: existed ? 'updated' : 'created', binding, path };
}

export function listSystemSourceBindings(root, issues = []) {
  const directory = systemSourceBindingDirectory(root);
  if (!existsSync(directory)) return [];
  const bindings = [];
  for (const name of readdirSync(directory).filter((item) => item.endsWith('.json')).sort()) {
    const path = join(directory, name);
    try {
      if (!lstatSync(path).isFile() || lstatSync(path).isSymbolicLink()) throw new Error('not-file');
      const binding = JSON.parse(readFileSync(path, 'utf8'));
      const errors = validateSystemSourceBinding(binding);
      if (errors.length) throw new Error(errors.join(' · '));
      bindings.push({ binding, path });
    } catch {
      issues.push({ reason_code: 'system-source-binding-invalid', ref: relative(root, path).replaceAll('\\', '/') });
    }
  }
  return bindings;
}

export function indexSystemSourceBindings(root, issues = []) {
  const byRole = new Map();
  for (const entry of listSystemSourceBindings(root, issues)) {
    const key = `${entry.binding.system_ref}:${entry.binding.role}`;
    if (byRole.has(key)) {
      byRole.set(key, { binding: null, path: null, ambiguous: true });
      issues.push({ reason_code: 'system-source-binding-ambiguous', ref: key });
    } else byRole.set(key, entry);
  }
  return byRole;
}

export function summarizeSystemSourceBindings(root, system) {
  const requirements = Array.isArray(system.sources) ? system.sources : [];
  if (!requirements.length) return { total_roles: 0, required_roles: 0, ready_roles: 0, status: 'not-required' };
  const byRole = indexSystemSourceBindings(root);
  const resolved = requirements.map((requirement) => ({
    requirement,
    entry: byRole.get(`${system.system_id}:${requirement.role}`) || null,
  }));
  const required = resolved.filter((item) => item.requirement.required === true);
  const readyRoles = resolved.filter((item) => item.entry?.binding?.status === 'ready').length;
  let status = 'unbound';
  if (required.some((item) => item.entry?.ambiguous
    || ['incompatible', 'revoked'].includes(item.entry?.binding?.status))) status = 'incompatible';
  else if (required.some((item) => ['proposed', 'awaiting-approval'].includes(item.entry?.binding?.status))) {
    status = 'awaiting-approval';
  } else if (required.some((item) => item.entry?.binding?.status === 'degraded')) status = 'degraded';
  else if (required.every((item) => item.entry?.binding?.status === 'ready')) {
    const optionalDegraded = resolved.some((item) => item.requirement.required !== true
      && item.entry && (item.entry.ambiguous || ['degraded', 'incompatible', 'revoked'].includes(item.entry.binding?.status)));
    status = optionalDegraded ? 'degraded' : 'ready';
  }
  return {
    total_roles: requirements.length,
    required_roles: required.length,
    ready_roles: readyRoles,
    status,
  };
}

export function syncSystemSourceBindingState(root, system) {
  const path = join(root, '.cerebro', 'sistemas', `${system.system_id}.json`);
  if (!existsSync(path)) return { status: 'state-missing', summary: summarizeSystemSourceBindings(root, system) };
  const state = JSON.parse(readFileSync(path, 'utf8'));
  const summary = summarizeSystemSourceBindings(root, system);
  writeJsonAtomic(path, { ...state, source_bindings: summary, updated_at: new Date().toISOString() }, 0o600);
  return { status: 'updated', summary };
}
