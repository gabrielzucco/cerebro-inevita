import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';

export const ID_RE = /^[a-z0-9][a-z0-9-]{0,63}$/;
export const REF_ID_RE = /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/;
export const VERSION_RE = /^\d+\.\d+\.\d+(?:[-+][A-Za-z0-9.-]+)?$/;
export const HUMAN_DECISIONS = new Set(['pending', 'approved', 'changes_requested', 'rejected']);
export const SYSTEM_STATUSES = new Set(['proposed', 'confirmed', 'active', 'needs_attention']);

export function versionGreater(next, current) {
  if (!VERSION_RE.test(next) || !VERSION_RE.test(current)) return false;
  const parts = (value) => value.split(/[+-]/, 1)[0].split('.').map(Number);
  const left = parts(next);
  const right = parts(current);
  for (let index = 0; index < 3; index += 1) {
    if (left[index] !== right[index]) return left[index] > right[index];
  }
  return false;
}

function object(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function requiredString(errors, value, path) {
  if (typeof value !== 'string' || !value.trim()) errors.push(`${path} precisa ser texto não vazio`);
}

function requiredArray(errors, value, path, minimum = 0) {
  if (!Array.isArray(value)) errors.push(`${path} precisa ser lista`);
  else if (value.length < minimum) errors.push(`${path} precisa ter pelo menos ${minimum} item(ns)`);
}

function validatePermissions(errors, permissions, path) {
  if (!object(permissions)) {
    errors.push(`${path} precisa ser objeto`);
    return;
  }
  requiredArray(errors, permissions.read, `${path}.read`);
  requiredArray(errors, permissions.write, `${path}.write`);
  if (typeof permissions.external_actions !== 'boolean') {
    errors.push(`${path}.external_actions precisa ser booleano`);
  }
}

export function validateCapabilityContract(value) {
  const errors = [];
  if (!object(value)) return ['capability contract precisa ser objeto'];
  if (value.protocol_version !== 1) errors.push('protocol_version precisa ser 1');
  if (!ID_RE.test(value.capability_id || '')) errors.push('capability_id inválido');
  requiredString(errors, value.name, 'name');
  if (!VERSION_RE.test(value.version || '')) errors.push('version precisa ser semver');
  requiredString(errors, value.task, 'task');
  requiredArray(errors, value.input_roles, 'input_roles', 1);
  for (const [index, role] of (value.input_roles || []).entries()) {
    if (!object(role)) {
      errors.push(`input_roles[${index}] precisa ser objeto`);
      continue;
    }
    if (!ID_RE.test(role.role || '')) errors.push(`input_roles[${index}].role inválido`);
    if (typeof role.required !== 'boolean') errors.push(`input_roles[${index}].required precisa ser booleano`);
    requiredString(errors, role.purpose, `input_roles[${index}].purpose`);
  }
  if (!object(value.output)) errors.push('output precisa ser objeto');
  else {
    if (!ID_RE.test(value.output.type || '')) errors.push('output.type inválido');
    requiredString(errors, value.output.definition_of_done, 'output.definition_of_done');
  }
  validatePermissions(errors, value.permissions, 'permissions');
  requiredArray(errors, value.human_authority, 'human_authority', 1);
  requiredArray(errors, value.evals, 'evals', 1);
  return errors;
}

export function validateSystemContract(value) {
  const errors = [];
  if (!object(value)) return ['system contract precisa ser objeto'];
  if (value.protocol_version !== 1) errors.push('protocol_version precisa ser 1');
  if (!ID_RE.test(value.system_id || '')) errors.push('system_id inválido');
  requiredString(errors, value.name, 'name');
  if (!VERSION_RE.test(value.version || '')) errors.push('version precisa ser semver');
  if (!SYSTEM_STATUSES.has(value.status)) errors.push('status inválido');

  if (!object(value.result)) errors.push('result precisa ser objeto');
  else {
    for (const field of ['statement', 'non_success', 'definition_of_done', 'owner', 'human_gate']) {
      requiredString(errors, value.result[field], `result.${field}`);
    }
    if (!ID_RE.test(value.result.output_type || '')) errors.push('result.output_type inválido');
  }

  if (!object(value.trigger)) errors.push('trigger precisa ser objeto');
  else {
    if (!['manual', 'event', 'schedule'].includes(value.trigger.type)) errors.push('trigger.type inválido');
    requiredString(errors, value.trigger.description, 'trigger.description');
  }

  if (!object(value.capability)) errors.push('capability precisa ser objeto');
  else {
    if (!ID_RE.test(value.capability.capability_id || '')) errors.push('capability.capability_id inválido');
    if (!VERSION_RE.test(value.capability.version || '')) errors.push('capability.version precisa ser semver');
    if (!['local', 'inevita', 'external'].includes(value.capability.origin)) errors.push('capability.origin inválido');
  }

  requiredArray(errors, value.entities, 'entities');
  for (const [index, entity] of (value.entities || []).entries()) {
    if (!object(entity)) {
      errors.push(`entities[${index}] precisa ser objeto`);
      continue;
    }
    if (!ID_RE.test(entity.type || '')) errors.push(`entities[${index}].type inválido`);
    if (!ID_RE.test(entity.role || '')) errors.push(`entities[${index}].role inválido`);
    if (typeof entity.required !== 'boolean') errors.push(`entities[${index}].required precisa ser booleano`);
  }

  requiredArray(errors, value.sources, 'sources');
  for (const [index, source] of (value.sources || []).entries()) {
    if (!object(source)) {
      errors.push(`sources[${index}] precisa ser objeto`);
      continue;
    }
    if (!ID_RE.test(source.role || '')) errors.push(`sources[${index}].role inválido`);
    if (source.source_id !== null && source.source_id !== undefined && !REF_ID_RE.test(source.source_id)) {
      errors.push(`sources[${index}].source_id inválido`);
    }
    if (typeof source.required !== 'boolean') errors.push(`sources[${index}].required precisa ser booleano`);
    if (!['manual', 'read-only', 'write-with-approval'].includes(source.access)) {
      errors.push(`sources[${index}].access inválido`);
    }
    requiredString(errors, source.freshness, `sources[${index}].freshness`);
    requiredString(errors, source.purpose, `sources[${index}].purpose`);
  }

  requiredArray(errors, value.pipeline, 'pipeline', 1);
  for (const [index, state] of (value.pipeline || []).entries()) {
    if (!object(state)) {
      errors.push(`pipeline[${index}] precisa ser objeto`);
      continue;
    }
    if (!ID_RE.test(state.state || '')) errors.push(`pipeline[${index}].state inválido`);
    for (const field of ['input', 'output', 'gate']) requiredString(errors, state[field], `pipeline[${index}].${field}`);
  }

  validatePermissions(errors, value.permissions, 'permissions');
  if (!object(value.eval)) errors.push('eval precisa ser objeto');
  else {
    if (!VERSION_RE.test(value.eval.version || '')) errors.push('eval.version precisa ser semver');
    requiredArray(errors, value.eval.deterministic_gates, 'eval.deterministic_gates', 1);
    requiredArray(errors, value.eval.human_questions, 'eval.human_questions', 1);
    requiredString(errors, value.eval.outcome_measure, 'eval.outcome_measure');
  }
  if (!object(value.learning)) errors.push('learning precisa ser objeto');
  else {
    if (value.learning.correction_policy !== 'candidate-first') errors.push('learning.correction_policy inválido');
    if (!Number.isInteger(value.learning.promotion_threshold) || value.learning.promotion_threshold < 3) {
      errors.push('learning.promotion_threshold precisa ser inteiro >= 3');
    }
    if (value.learning.requires_replay !== true) errors.push('learning.requires_replay precisa ser true');
    if (value.learning.requires_human_approval !== true) errors.push('learning.requires_human_approval precisa ser true');
  }
  return errors;
}

function validateRefList(errors, refs, path) {
  requiredArray(errors, refs, path);
  for (const [index, ref] of (refs || []).entries()) {
    if (!object(ref) || !ID_RE.test(ref.role || '') || !REF_ID_RE.test(ref.id || '')) {
      errors.push(`${path}[${index}] precisa ter role e id válidos`);
    }
  }
}

export function validateRunRecord(value) {
  const errors = [];
  if (!object(value)) return ['run record precisa ser objeto'];
  if (value.protocol_version !== 1) errors.push('protocol_version precisa ser 1');
  if (!REF_ID_RE.test(value.run_id || '')) errors.push('run_id inválido');
  if (!ID_RE.test(value.system_id || '')) errors.push('system_id inválido');
  requiredString(errors, value.system_version, 'system_version');
  if (!['started', 'completed'].includes(value.status)) errors.push('status inválido');
  if (!Number.isFinite(Date.parse(value.started_at || ''))) errors.push('started_at inválido');
  if (value.status === 'completed' && !Number.isFinite(Date.parse(value.completed_at || ''))) {
    errors.push('completed_at obrigatório no run concluído');
  }
  validateRefList(errors, value.entity_refs, 'entity_refs');
  validateRefList(errors, value.source_refs, 'source_refs');
  requiredArray(errors, value.output_refs, 'output_refs');
  if (!object(value.eval) || typeof value.eval.version !== 'string') errors.push('eval inválido');
  if (!HUMAN_DECISIONS.has(value.human_decision)) errors.push('human_decision inválida');
  if (!object(value.privacy) || value.privacy.content_shared_with_inevita !== false) {
    errors.push('privacy.content_shared_with_inevita precisa ser false');
  }
  return errors;
}

export function parseRoleRefs(values, label) {
  return values.map((value) => {
    const separator = value.indexOf(':');
    const role = separator >= 0 ? value.slice(0, separator) : '';
    const id = separator >= 0 ? value.slice(separator + 1) : '';
    if (!ID_RE.test(role) || !REF_ID_RE.test(id)) throw new Error(`${label} inválida: ${value}; use papel:id-opaco`);
    return { role, id };
  });
}

export function parseOutcomes(values) {
  return values.map((value) => {
    const separator = value.indexOf(':');
    const measure = separator >= 0 ? value.slice(0, separator) : '';
    const raw = separator >= 0 ? value.slice(separator + 1) : '';
    if (!ID_RE.test(measure) || raw === '') throw new Error(`outcome inválido: ${value}; use medida:valor`);
    let parsed = raw;
    if (raw === 'true' || raw === 'false') parsed = raw === 'true';
    else if (Number.isFinite(Number(raw))) parsed = Number(raw);
    return { measure, value: parsed };
  });
}

export function safeRelativePath(root, value, { mustExist = false } = {}) {
  if (!value || isAbsolute(value)) throw new Error('referência precisa ser caminho relativo ao Cérebro');
  const absolute = resolve(root, value);
  const rel = relative(root, absolute);
  if (!rel || rel.startsWith('..') || isAbsolute(rel)) throw new Error(`referência fora do Cérebro: ${value}`);
  if (mustExist && !existsSync(absolute)) throw new Error(`referência não encontrada: ${value}`);
  return rel.replaceAll('\\', '/');
}

export function readJson(path, label = path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    throw new Error(`${label} inválido`);
  }
}

export function writeJsonAtomic(path, value, mode = 0o600) {
  mkdirSync(dirname(path), { recursive: true });
  const temporary = `${path}.tmp`;
  writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, { mode });
  renameSync(temporary, path);
}

export function layout(root) {
  const path = join(root, '.cerebro', 'layout.json');
  return existsSync(path) ? readJson(path, '.cerebro/layout.json') : {};
}

export function ledgerPath(root) {
  const configured = layout(root).runLedger;
  return configured ? resolve(root, configured) : join(root, '.cerebro', 'ledger', 'runs.jsonl');
}

export function appendRunRecord(root, record) {
  const errors = validateRunRecord(record);
  if (errors.length) throw new Error(`run record inválido: ${errors.join(' · ')}`);
  const path = ledgerPath(root);
  mkdirSync(dirname(path), { recursive: true });
  appendFileSync(path, `${JSON.stringify(record)}\n`, { mode: 0o600 });
  return path;
}

export function readRunLedger(root) {
  const path = ledgerPath(root);
  if (!existsSync(path)) return [];
  return readFileSync(path, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((line, index) => {
      try {
        return JSON.parse(line);
      } catch {
        throw new Error(`ledger inválido na linha ${index + 1}`);
      }
    });
}

export function latestRunRecords(root) {
  const byRun = new Map();
  for (const record of readRunLedger(root)) byRun.set(record.run_id, record);
  return [...byRun.values()].sort((left, right) => String(left.started_at).localeCompare(String(right.started_at)));
}

export function ensureBrain(root) {
  if (!existsSync(join(root, '.cerebro')) || !existsSync(join(root, 'VERSION'))
    || (!existsSync(join(root, 'COMECE-AQUI.md')) && !existsSync(join(root, 'START-HERE.md')))) {
    throw new Error('a pasta não é um Cérebro INEVITA reconhecido');
  }
}
