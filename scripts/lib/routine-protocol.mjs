import { createHash, randomUUID } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { isAbsolute, join, relative, resolve, sep } from 'node:path';
import {
  ID_RE,
  REF_ID_RE,
  VERSION_RE,
  layout,
  readJson,
  safeRelativePath,
  writeJsonAtomic,
} from './system-protocol.mjs';

const LOCAL_REF_RE = /^(?!\.?\.?$)(?!\.\.?\/)(?!.*\/\.\.(?:\/|$))[A-Za-z0-9.][A-Za-z0-9_./:-]{0,255}$/;
const ADAPTERS = new Set(['codex-cli', 'claude-code']);
const RECEIPT_ADAPTERS = new Set([...ADAPTERS, 'unresolved']);
const AUTH_STATUSES = new Set(['ready', 'missing', 'authentication-required', 'degraded']);
const PERMISSIONS = new Set(['read-only', 'workspace-write']);
const REASONING = new Set(['low', 'medium', 'high', 'xhigh', 'max']);
const RUN_STATUSES = new Set(['completed', 'failed', 'denied', 'skipped']);
const MODES = new Set(['read', 'propose', 'write-with-approval']);
const WEEKDAYS = new Set(['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU']);
const MIGRATION_SOURCES = new Set([
  'claude-scheduled-task', 'codex-automation', 'launchd', 'cron', 'github-actions', 'other',
]);
const MIGRATION_STATUSES = new Set([
  'awaiting-legacy-pause', 'ready-for-activation', 'cutover-completed', 'cancelled',
]);
const COLLECTOR_EXECUTABLES = new Set(['python3', 'node']);
const COLLECTOR_ARG_RE = /^(?!-c$)(?!.*[;&|`$<>])[A-Za-z0-9._/:=-]{1,255}$/;
const JSON_POINTER_RE = /^\/(?:[A-Za-z0-9_.-]+(?:\/[A-Za-z0-9_.-]+)*)?$/;
const WEEKDAY_FROM_INTL = { Mon: 'MO', Tue: 'TU', Wed: 'WE', Thu: 'TH', Fri: 'FR', Sat: 'SA', Sun: 'SU' };
const SECRET_RE = /Bearer\s+|-----BEGIN .*PRIVATE KEY-----|\b(?:sk|ghp|xoxb)[-_A-Za-z0-9]{12,}/i;
const MAX_SCHEDULE_LOOKBACK_MINUTES = 62 * 24 * 60;

function object(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function closed(errors, value, path, keys) {
  if (!object(value)) return;
  const allowed = new Set(keys);
  for (const key of Object.keys(value)) if (!allowed.has(key)) errors.push(`${path}.${key} não é permitido`);
}

function text(errors, value, path) {
  if (typeof value !== 'string' || !value.trim()) errors.push(`${path} precisa ser texto não vazio`);
}

function date(errors, value, path, nullable = false) {
  if (nullable && value === null) return;
  if (!Number.isFinite(Date.parse(value || ''))) errors.push(`${path} inválido`);
}

function localRef(errors, value, path, { relativePath = false, allowDot = false } = {}) {
  if (relativePath && allowDot && value === '.') return;
  if (!LOCAL_REF_RE.test(value || '')) {
    errors.push(`${path} inválido`);
    return;
  }
  if (relativePath) {
    if (value === '.' || isAbsolute(value) || value.split(/[\\/]/).includes('..')) errors.push(`${path} precisa ficar dentro do Cérebro`);
  }
}

function unique(errors, values, path) {
  if (Array.isArray(values) && new Set(values).size !== values.length) errors.push(`${path} não pode repetir itens`);
}

function list(errors, value, path) {
  if (!Array.isArray(value)) errors.push(`${path} precisa ser lista`);
}

function validTimezone(value) {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

function referenceOnly(errors, value, path) {
  const serialized = JSON.stringify(value);
  if (SECRET_RE.test(serialized)) errors.push(`${path} parece conter segredo`);
  if (/"(?:prompt|output|raw_error|token|api_key|oauth)"\s*:/i.test(serialized)) {
    errors.push(`${path} contém payload ou credencial em vez de referência`);
  }
}

export function validateRoutineContract(value) {
  const errors = [];
  if (!object(value)) return ['routine contract precisa ser objeto'];
  closed(errors, value, 'routine_contract', [
    'protocol_version', 'routine_id', 'version', 'name', 'lifecycle', 'system_ref', 'trigger',
    'placement', 'executor', 'context', 'permission_mode', 'destination', 'operations',
    'approval', 'privacy', 'extensions',
  ]);
  if (value.protocol_version !== 1) errors.push('protocol_version precisa ser 1');
  if (!ID_RE.test(value.routine_id || '')) errors.push('routine_id inválido');
  if (!VERSION_RE.test(value.version || '')) errors.push('version inválida');
  text(errors, value.name, 'name');
  if (!['draft', 'approved', 'retired'].includes(value.lifecycle)) errors.push('lifecycle inválido');
  if (!ID_RE.test(value.system_ref || '')) errors.push('system_ref inválido');

  if (!object(value.trigger)) errors.push('trigger precisa ser objeto');
  else {
    closed(errors, value.trigger, 'trigger', ['type', 'schedule']);
    if (!['manual', 'schedule'].includes(value.trigger.type)) errors.push('trigger.type inválido');
    if (value.trigger.type === 'manual' && value.trigger.schedule !== null) errors.push('trigger manual exige schedule null');
    if (value.trigger.type === 'schedule' && !object(value.trigger.schedule)) errors.push('trigger schedule exige calendário');
    if (object(value.trigger.schedule)) {
      const schedule = value.trigger.schedule;
      closed(errors, schedule, 'trigger.schedule', [
        'cadence', 'time', 'timezone', 'weekdays', 'month_days', 'not_before', 'missed_run_policy',
      ]);
      if (!['daily', 'weekly', 'monthly'].includes(schedule.cadence)) errors.push('trigger.schedule.cadence inválida');
      if (!/^(?:[01][0-9]|2[0-3]):[0-5][0-9]$/.test(schedule.time || '')) errors.push('trigger.schedule.time inválido');
      if (!validTimezone(schedule.timezone)) errors.push('trigger.schedule.timezone inválido');
      list(errors, schedule.weekdays, 'trigger.schedule.weekdays');
      const weekdays = Array.isArray(schedule.weekdays) ? schedule.weekdays : [];
      for (const day of weekdays) if (!WEEKDAYS.has(day)) errors.push('trigger.schedule.weekdays contém valor inválido');
      unique(errors, schedule.weekdays, 'trigger.schedule.weekdays');
      list(errors, schedule.month_days, 'trigger.schedule.month_days');
      const monthDays = Array.isArray(schedule.month_days) ? schedule.month_days : [];
      for (const day of monthDays) {
        if (!Number.isInteger(day) || day < 1 || day > 28) errors.push('trigger.schedule.month_days contém valor inválido');
      }
      unique(errors, schedule.month_days, 'trigger.schedule.month_days');
      if (schedule.cadence === 'weekly' && weekdays.length === 0) errors.push('cadência semanal exige weekdays');
      if (schedule.cadence !== 'weekly' && weekdays.length !== 0) errors.push('weekdays só existe na cadência semanal');
      if (schedule.cadence === 'monthly' && monthDays.length === 0) errors.push('cadência mensal exige month_days');
      if (schedule.cadence !== 'monthly' && monthDays.length !== 0) errors.push('month_days só existe na cadência mensal');
      date(errors, schedule.not_before, 'trigger.schedule.not_before');
      if (!['run-on-wake', 'skip'].includes(schedule.missed_run_policy)) errors.push('missed_run_policy inválida');
    }
  }

  if (!object(value.placement)) errors.push('placement precisa ser objeto');
  else {
    closed(errors, value.placement, 'placement', ['host_ref', 'workspace_ref']);
    if (!REF_ID_RE.test(value.placement.host_ref || '')) errors.push('placement.host_ref inválido');
    if (!REF_ID_RE.test(value.placement.workspace_ref || '')) errors.push('placement.workspace_ref inválido');
  }
  if (!object(value.executor)) errors.push('executor precisa ser objeto');
  else {
    closed(errors, value.executor, 'executor', ['binding_ref', 'requested_model', 'reasoning_effort']);
    if (!REF_ID_RE.test(value.executor.binding_ref || '')) errors.push('executor.binding_ref inválido');
    localRef(errors, value.executor.requested_model, 'executor.requested_model');
    if (!REASONING.has(value.executor.reasoning_effort)) errors.push('executor.reasoning_effort inválido');
  }
  if (!object(value.context)) errors.push('context precisa ser objeto');
  else {
    closed(errors, value.context, 'context', ['prompt_ref', 'skill_refs', 'access_requests']);
    localRef(errors, value.context.prompt_ref, 'context.prompt_ref', { relativePath: true });
    if (value.context.skill_refs !== undefined) {
      list(errors, value.context.skill_refs, 'context.skill_refs');
      for (const ref of Array.isArray(value.context.skill_refs) ? value.context.skill_refs : []) {
        localRef(errors, ref, 'context.skill_refs[]', { relativePath: true });
      }
      unique(errors, value.context.skill_refs, 'context.skill_refs');
    }
    list(errors, value.context.access_requests, 'context.access_requests');
    const grantRefs = [];
    const accessRequests = Array.isArray(value.context.access_requests) ? value.context.access_requests : [];
    for (const [index, request] of accessRequests.entries()) {
      const path = `context.access_requests[${index}]`;
      if (!object(request)) {
        errors.push(`${path} precisa ser objeto`);
        continue;
      }
      closed(errors, request, path, ['grant_ref', 'source_ref', 'action', 'mode']);
      if (!REF_ID_RE.test(request.grant_ref || '')) errors.push(`${path}.grant_ref inválido`);
      if (!REF_ID_RE.test(request.source_ref || '')) errors.push(`${path}.source_ref inválido`);
      if (!ID_RE.test(request.action || '')) errors.push(`${path}.action inválida`);
      if (!MODES.has(request.mode)) errors.push(`${path}.mode inválido`);
      grantRefs.push(request.grant_ref);
    }
    unique(errors, grantRefs, 'context.access_requests.grant_ref');
  }
  if (!PERMISSIONS.has(value.permission_mode)) errors.push('permission_mode inválido');
  if (value.permission_mode === 'read-only'
    && Array.isArray(value.context?.access_requests)
    && value.context.access_requests.some((request) => request?.mode === 'write-with-approval')) {
    errors.push('write-with-approval exige permission_mode workspace-write');
  }
  if (!object(value.destination)) errors.push('destination precisa ser objeto');
  else {
    closed(errors, value.destination, 'destination', ['kind', 'ref']);
    if (!['runtime-output', 'local-file'].includes(value.destination.kind)) errors.push('destination.kind inválido');
    localRef(errors, value.destination.ref, 'destination.ref', { relativePath: value.destination.kind === 'local-file' });
  }
  if (!object(value.operations)) errors.push('operations precisa ser objeto');
  else {
    closed(errors, value.operations, 'operations', ['timeout_seconds', 'retry', 'concurrency']);
    if (!Number.isInteger(value.operations.timeout_seconds) || value.operations.timeout_seconds < 10
      || value.operations.timeout_seconds > 7200) errors.push('operations.timeout_seconds inválido');
    if (value.operations.concurrency !== 'forbid') errors.push('operations.concurrency precisa ser forbid');
    if (!object(value.operations.retry)) errors.push('operations.retry precisa ser objeto');
    else {
      const retry = value.operations.retry;
      closed(errors, retry, 'operations.retry', ['max_attempts', 'backoff_seconds', 'idempotency_scope']);
      if (!Number.isInteger(retry.max_attempts) || retry.max_attempts < 1 || retry.max_attempts > 3) errors.push('retry.max_attempts inválido');
      if (!Number.isInteger(retry.backoff_seconds) || retry.backoff_seconds < 0 || retry.backoff_seconds > 900) errors.push('retry.backoff_seconds inválido');
      if (retry.idempotency_scope !== 'scheduled-slot') errors.push('retry.idempotency_scope precisa ser scheduled-slot');
    }
  }
  if (!object(value.approval)) errors.push('approval precisa ser objeto');
  else {
    closed(errors, value.approval, 'approval', ['required_before_schedule', 'approved_by', 'approved_at']);
    if (value.approval.required_before_schedule !== true) errors.push('approval.required_before_schedule precisa ser true');
    if (value.approval.approved_by !== null && !REF_ID_RE.test(value.approval.approved_by || '')) errors.push('approval.approved_by inválido');
    date(errors, value.approval.approved_at, 'approval.approved_at', true);
    if (value.lifecycle === 'approved' && (!value.approval.approved_by || !value.approval.approved_at)) {
      errors.push('routine approved exige approved_by e approved_at');
    }
    if (value.lifecycle === 'draft' && (value.approval.approved_by !== null || value.approval.approved_at !== null)) {
      errors.push('routine draft não pode fingir aprovação');
    }
  }
  if (!object(value.privacy) || value.privacy.content_shared_with_inevita !== false
    || Object.keys(value.privacy || {}).some((key) => key !== 'content_shared_with_inevita')) {
    errors.push('privacy inválida');
  }
  if (value.extensions !== undefined && !object(value.extensions)) errors.push('extensions precisa ser objeto');
  if (object(value.extensions?.preparation)) {
    const preparation = value.extensions.preparation;
    closed(errors, preparation, 'extensions.preparation', [
      'kind', 'binding_ref', 'output_ref', 'source_selections',
    ]);
    if (preparation.kind !== 'trusted-local-command') errors.push('extensions.preparation.kind inválido');
    if (!REF_ID_RE.test(preparation.binding_ref || '')) errors.push('extensions.preparation.binding_ref inválido');
    localRef(errors, preparation.output_ref, 'extensions.preparation.output_ref', { relativePath: true });
    if (preparation.source_selections !== undefined) {
      list(errors, preparation.source_selections, 'extensions.preparation.source_selections');
      const sourceRefs = [];
      const selections = Array.isArray(preparation.source_selections) ? preparation.source_selections : [];
      for (const [index, selection] of selections.entries()) {
        const path = `extensions.preparation.source_selections[${index}]`;
        if (!object(selection)) {
          errors.push(`${path} precisa ser objeto`);
          continue;
        }
        closed(errors, selection, path, ['source_ref', 'selected_pointers', 'freshness_pointer']);
        if (!REF_ID_RE.test(selection.source_ref || '')) errors.push(`${path}.source_ref inválido`);
        sourceRefs.push(selection.source_ref);
        list(errors, selection.selected_pointers, `${path}.selected_pointers`);
        const pointers = Array.isArray(selection.selected_pointers) ? selection.selected_pointers : [];
        if (pointers.length === 0) errors.push(`${path}.selected_pointers precisa ter pelo menos 1 item`);
        for (const pointer of pointers) {
          if (!JSON_POINTER_RE.test(pointer || '')) errors.push(`${path}.selected_pointers contém JSON Pointer inválido`);
        }
        unique(errors, selection.selected_pointers, `${path}.selected_pointers`);
        if (selection.freshness_pointer !== null
          && !JSON_POINTER_RE.test(selection.freshness_pointer || '')) {
          errors.push(`${path}.freshness_pointer inválido`);
        }
      }
      unique(errors, sourceRefs, 'extensions.preparation.source_selections.source_ref');
    }
  } else if (value.extensions?.preparation !== undefined) {
    errors.push('extensions.preparation precisa ser objeto');
  }
  if (object(value.extensions?.evaluation)) {
    const evaluation = value.extensions.evaluation;
    closed(errors, evaluation, 'extensions.evaluation', ['kind', 'evaluator_ref', 'source_pointer']);
    if (evaluation.kind !== 'registered-evaluator') errors.push('extensions.evaluation.kind inválido');
    if (evaluation.evaluator_ref !== 'calls-deterministic-v1') {
      errors.push('extensions.evaluation.evaluator_ref inválido');
    }
    if (!JSON_POINTER_RE.test(evaluation.source_pointer || '')) {
      errors.push('extensions.evaluation.source_pointer inválido');
    }
    if (!object(value.extensions?.preparation) || !Array.isArray(value.extensions.preparation.source_selections)) {
      errors.push('extensions.evaluation exige preparation com source_selections');
    }
  } else if (value.extensions?.evaluation !== undefined) {
    errors.push('extensions.evaluation precisa ser objeto');
  }
  referenceOnly(errors, value, 'routine_contract');
  return [...new Set(errors)];
}

export function validateExecutorBinding(value) {
  const errors = [];
  if (!object(value)) return ['executor binding precisa ser objeto'];
  closed(errors, value, 'executor_binding', [
    'protocol_version', 'binding_id', 'adapter', 'host_ref', 'workspace_ref', 'workspace_path',
    'auth', 'model_policy', 'permission_profile', 'observed_at', 'privacy',
  ]);
  if (value.protocol_version !== 1) errors.push('protocol_version precisa ser 1');
  if (!REF_ID_RE.test(value.binding_id || '')) errors.push('binding_id inválido');
  if (!ADAPTERS.has(value.adapter)) errors.push('adapter inválido');
  if (!REF_ID_RE.test(value.host_ref || '')) errors.push('host_ref inválido');
  if (!REF_ID_RE.test(value.workspace_ref || '')) errors.push('workspace_ref inválido');
  localRef(errors, value.workspace_path, 'workspace_path', { relativePath: true, allowDot: true });
  if (!object(value.auth)) errors.push('auth precisa ser objeto');
  else {
    closed(errors, value.auth, 'auth', ['type', 'status']);
    if (value.auth.type !== 'provider-session') errors.push('auth.type precisa ser provider-session');
    if (!AUTH_STATUSES.has(value.auth.status)) errors.push('auth.status inválido');
  }
  if (!object(value.model_policy)) errors.push('model_policy precisa ser objeto');
  else {
    closed(errors, value.model_policy, 'model_policy', ['default_model', 'allowed_models']);
    localRef(errors, value.model_policy.default_model, 'model_policy.default_model');
    list(errors, value.model_policy.allowed_models, 'model_policy.allowed_models');
    const allowedModels = Array.isArray(value.model_policy.allowed_models) ? value.model_policy.allowed_models : [];
    for (const model of allowedModels) localRef(errors, model, 'model_policy.allowed_models[]');
    unique(errors, value.model_policy.allowed_models, 'model_policy.allowed_models');
    if (allowedModels.length > 0 && !allowedModels.includes(value.model_policy.default_model)) {
      errors.push('default_model precisa estar em allowed_models quando a lista é fechada');
    }
  }
  if (!PERMISSIONS.has(value.permission_profile)) errors.push('permission_profile inválido');
  date(errors, value.observed_at, 'observed_at');
  if (!object(value.privacy) || value.privacy.credential_stored !== false
    || value.privacy.content_shared_with_inevita !== false
    || Object.keys(value.privacy || {}).some((key) => !['credential_stored', 'content_shared_with_inevita'].includes(key))) {
    errors.push('privacy inválida');
  }
  referenceOnly(errors, value, 'executor_binding');
  return [...new Set(errors)];
}

export function validateCollectorBinding(value) {
  const errors = [];
  if (!object(value)) return ['collector binding precisa ser objeto'];
  closed(errors, value, 'collector_binding', [
    'protocol_version', 'binding_id', 'kind', 'executable', 'args', 'workspace_ref',
    'workspace_path', 'output_ref', 'timeout_seconds', 'status', 'observed_at', 'privacy',
  ]);
  if (value.protocol_version !== 1) errors.push('protocol_version precisa ser 1');
  if (!REF_ID_RE.test(value.binding_id || '')) errors.push('binding_id inválido');
  if (value.kind !== 'trusted-local-command') errors.push('kind inválido');
  if (!COLLECTOR_EXECUTABLES.has(value.executable)) errors.push('executable inválido');
  list(errors, value.args, 'args');
  if (!Array.isArray(value.args) || value.args.length < 1 || value.args.length > 16) errors.push('args exige 1 a 16 itens');
  for (const argument of Array.isArray(value.args) ? value.args : []) {
    if (!COLLECTOR_ARG_RE.test(argument || '') || isAbsolute(argument)
      || argument.split(/[\\/]/).includes('..')) errors.push('args contém item inseguro');
  }
  if (!REF_ID_RE.test(value.workspace_ref || '')) errors.push('workspace_ref inválido');
  localRef(errors, value.workspace_path, 'workspace_path', { relativePath: true, allowDot: true });
  localRef(errors, value.output_ref, 'output_ref', { relativePath: true });
  if (!Number.isInteger(value.timeout_seconds) || value.timeout_seconds < 10 || value.timeout_seconds > 1800) {
    errors.push('timeout_seconds inválido');
  }
  if (!['ready', 'missing', 'degraded'].includes(value.status)) errors.push('status inválido');
  date(errors, value.observed_at, 'observed_at');
  if (!object(value.privacy) || value.privacy.credential_stored !== false
    || value.privacy.stdout_recorded !== false || value.privacy.content_shared_with_inevita !== false
    || Object.keys(value.privacy || {}).some((key) => ![
      'credential_stored', 'stdout_recorded', 'content_shared_with_inevita',
    ].includes(key))) errors.push('privacy inválida');
  referenceOnly(errors, value, 'collector_binding');
  return [...new Set(errors)];
}

export function validateRoutineRunReceipt(value) {
  const errors = [];
  if (!object(value)) return ['routine run receipt precisa ser objeto'];
  closed(errors, value, 'routine_run_receipt', [
    'protocol_version', 'receipt_id', 'run_id', 'routine_ref', 'routine_id', 'routine_version',
    'system_ref', 'binding_ref', 'adapter', 'requested_model', 'model_observation', 'trigger',
    'slot_key', 'scheduled_for', 'attempts', 'status', 'reason_code', 'started_at', 'completed_at',
    'input_refs', 'output_ref', 'access_receipt_refs', 'content_shared_with_provider', 'privacy',
  ]);
  if (value.protocol_version !== 1) errors.push('protocol_version precisa ser 1');
  if (!REF_ID_RE.test(value.receipt_id || '')) errors.push('receipt_id inválido');
  if (!REF_ID_RE.test(value.run_id || '')) errors.push('run_id inválido');
  localRef(errors, value.routine_ref, 'routine_ref');
  if (!ID_RE.test(value.routine_id || '')) errors.push('routine_id inválido');
  if (!VERSION_RE.test(value.routine_version || '')) errors.push('routine_version inválida');
  if (value.routine_ref !== `routine:${value.routine_id}:${value.routine_version}`) errors.push('routine_ref não corresponde ao id/versão');
  if (!ID_RE.test(value.system_ref || '')) errors.push('system_ref inválido');
  if (!REF_ID_RE.test(value.binding_ref || '')) errors.push('binding_ref inválido');
  if (!RECEIPT_ADAPTERS.has(value.adapter)) errors.push('adapter inválido');
  localRef(errors, value.requested_model, 'requested_model');
  if (value.model_observation !== 'requested-not-verified') errors.push('model_observation inválido');
  if (!['manual', 'schedule'].includes(value.trigger)) errors.push('trigger inválido');
  if (!REF_ID_RE.test(value.slot_key || '')) errors.push('slot_key inválido');
  date(errors, value.scheduled_for, 'scheduled_for', true);
  if (value.trigger === 'schedule' && value.scheduled_for === null) errors.push('trigger schedule exige scheduled_for');
  if (value.trigger === 'manual' && value.scheduled_for !== null) errors.push('trigger manual exige scheduled_for null');
  if (!Number.isInteger(value.attempts) || value.attempts < 0 || value.attempts > 3) errors.push('attempts inválido');
  if (!RUN_STATUSES.has(value.status)) errors.push('status inválido');
  if (!ID_RE.test(value.reason_code || '')) errors.push('reason_code inválido');
  date(errors, value.started_at, 'started_at');
  date(errors, value.completed_at, 'completed_at');
  if (Date.parse(value.completed_at || '') < Date.parse(value.started_at || '')) errors.push('completed_at anterior a started_at');
  list(errors, value.input_refs, 'input_refs');
  for (const ref of Array.isArray(value.input_refs) ? value.input_refs : []) localRef(errors, ref, 'input_refs[]');
  unique(errors, value.input_refs, 'input_refs');
  if (value.output_ref !== null) localRef(errors, value.output_ref, 'output_ref', { relativePath: true });
  if (value.status === 'completed' && value.output_ref === null) errors.push('run concluído exige output_ref');
  if (['denied', 'skipped'].includes(value.status) && value.output_ref !== null) errors.push('run não executado não pode ter output_ref');
  list(errors, value.access_receipt_refs, 'access_receipt_refs');
  for (const ref of Array.isArray(value.access_receipt_refs) ? value.access_receipt_refs : []) localRef(errors, ref, 'access_receipt_refs[]');
  unique(errors, value.access_receipt_refs, 'access_receipt_refs');
  if (typeof value.content_shared_with_provider !== 'boolean') errors.push('content_shared_with_provider precisa ser booleano');
  if (value.attempts === 0 && value.content_shared_with_provider !== false) errors.push('zero tentativas não pode alegar envio ao provider');
  if (!object(value.privacy) || value.privacy.content_shared_with_inevita !== false
    || value.privacy.prompt_recorded !== false || value.privacy.output_recorded !== false
    || value.privacy.raw_error_recorded !== false
    || Object.keys(value.privacy || {}).some((key) => ![
      'content_shared_with_inevita', 'prompt_recorded', 'output_recorded', 'raw_error_recorded',
    ].includes(key))) errors.push('privacy inválida');
  referenceOnly(errors, value, 'routine_run_receipt');
  return [...new Set(errors)];
}

export function validateRoutineMigration(value) {
  const errors = [];
  if (!object(value)) return ['routine migration precisa ser objeto'];
  closed(errors, value, 'routine_migration', [
    'protocol_version', 'migration_id', 'routine_id', 'routine_ref', 'source', 'status',
    'duplicate_run_risk', 'observed_at', 'legacy_pause', 'cutover', 'privacy',
  ]);
  if (value.protocol_version !== 1) errors.push('protocol_version precisa ser 1');
  if (!REF_ID_RE.test(value.migration_id || '')) errors.push('migration_id inválido');
  if (!ID_RE.test(value.routine_id || '')) errors.push('routine_id inválido');
  const routineMatch = String(value.routine_ref || '').match(/^routine:([a-z0-9][a-z0-9-]{0,63}):(\d+\.\d+\.\d+(?:[-+][A-Za-z0-9.-]+)?)$/);
  if (!routineMatch || routineMatch[1] !== value.routine_id) errors.push('routine_ref inválido');
  if (!object(value.source)) errors.push('source precisa ser objeto');
  else {
    closed(errors, value.source, 'source', ['kind', 'schedule_ref', 'schedule_summary']);
    if (!MIGRATION_SOURCES.has(value.source.kind)) errors.push('source.kind inválido');
    localRef(errors, value.source.schedule_ref, 'source.schedule_ref');
    text(errors, value.source.schedule_summary, 'source.schedule_summary');
    if (typeof value.source.schedule_summary === 'string' && value.source.schedule_summary.length > 240) {
      errors.push('source.schedule_summary excede 240 caracteres');
    }
  }
  if (!MIGRATION_STATUSES.has(value.status)) errors.push('status inválido');
  if (typeof value.duplicate_run_risk !== 'boolean') errors.push('duplicate_run_risk precisa ser booleano');
  date(errors, value.observed_at, 'observed_at');

  if (!object(value.legacy_pause)) errors.push('legacy_pause precisa ser objeto');
  else {
    closed(errors, value.legacy_pause, 'legacy_pause', ['status', 'evidence_ref', 'confirmed_by', 'confirmed_at']);
    const pause = value.legacy_pause;
    if (!['unknown', 'confirmed', 'not-required'].includes(pause.status)) errors.push('legacy_pause.status inválido');
    if (pause.evidence_ref !== null) localRef(errors, pause.evidence_ref, 'legacy_pause.evidence_ref');
    if (pause.confirmed_by !== null && !REF_ID_RE.test(pause.confirmed_by || '')) errors.push('legacy_pause.confirmed_by inválido');
    date(errors, pause.confirmed_at, 'legacy_pause.confirmed_at', true);
    const hasReadback = pause.evidence_ref && pause.confirmed_by && pause.confirmed_at;
    if (pause.status === 'confirmed' && !hasReadback) errors.push('pausa confirmada exige evidência, autor e data');
    if (pause.status === 'unknown' && [pause.evidence_ref, pause.confirmed_by, pause.confirmed_at].some((item) => item !== null)) {
      errors.push('pausa desconhecida não pode fingir readback');
    }
    if (value.duplicate_run_risk && pause.status === 'not-required') errors.push('risco de duplicidade exige pausa confirmada');
    if (value.status === 'awaiting-legacy-pause' && pause.status !== 'unknown') errors.push('status awaiting exige pausa desconhecida');
    if (value.status === 'ready-for-activation' && !['confirmed', 'not-required'].includes(pause.status)) {
      errors.push('status ready exige readback da agenda legada');
    }
  }

  if (!object(value.cutover)) errors.push('cutover precisa ser objeto');
  else {
    closed(errors, value.cutover, 'cutover', ['activation_receipt_ref', 'completed_at']);
    if (value.cutover.activation_receipt_ref !== null) localRef(errors, value.cutover.activation_receipt_ref, 'cutover.activation_receipt_ref');
    date(errors, value.cutover.completed_at, 'cutover.completed_at', true);
    if (value.status === 'cutover-completed'
      && (!value.cutover.activation_receipt_ref || !value.cutover.completed_at)) {
      errors.push('cutover concluído exige recibo de ativação e data');
    }
    if (value.status !== 'cutover-completed'
      && (value.cutover.activation_receipt_ref !== null || value.cutover.completed_at !== null)) {
      errors.push('cutover pendente não pode fingir conclusão');
    }
  }
  if (!object(value.privacy) || value.privacy.content_shared_with_inevita !== false
    || value.privacy.legacy_payload_recorded !== false
    || Object.keys(value.privacy || {}).some((key) => ![
      'content_shared_with_inevita', 'legacy_payload_recorded',
    ].includes(key))) errors.push('privacy inválida');
  referenceOnly(errors, value, 'routine_migration');
  return [...new Set(errors)];
}

function safeDirectory(root, configured, fallback, privateBase) {
  const brainRoot = resolve(root);
  const target = resolve(root, configured || fallback);
  if (target === brainRoot || !target.startsWith(`${brainRoot}${sep}`)) throw new Error('layout de Rotinas aponta para fora do Cérebro');
  const boundary = resolve(root, privateBase);
  if (target === boundary || !target.startsWith(`${boundary}${sep}`)) {
    throw new Error(`layout de Rotinas precisa ficar em ${privateBase}`);
  }
  return target;
}

export function routineContractPath(root, routineId) {
  if (!ID_RE.test(routineId || '')) throw new Error('routine_id inválido');
  return join(safeDirectory(root, layout(root).routineContracts,
    join('.cerebro', 'contracts', 'routines'), join('.cerebro', 'contracts')), `${routineId}.json`);
}

export function executorBindingPath(root, bindingId) {
  if (!REF_ID_RE.test(bindingId || '')) throw new Error('binding_id inválido');
  return join(safeDirectory(root, layout(root).executorBindings,
    join('.cerebro', 'runtime', 'executors'), join('.cerebro', 'runtime')), `${bindingId}.json`);
}

export function collectorBindingPath(root, bindingId) {
  if (!REF_ID_RE.test(bindingId || '')) throw new Error('binding_id inválido');
  return join(safeDirectory(root, layout(root).collectorBindings,
    join('.cerebro', 'runtime', 'collectors'), join('.cerebro', 'runtime')), `${bindingId}.json`);
}

function routineReceiptDirectory(root) {
  return safeDirectory(root, layout(root).routineReceipts,
    join('.cerebro', 'runtime', 'receipts', 'routines'), join('.cerebro', 'runtime'));
}

function routineStateDirectory(root) {
  return safeDirectory(root, layout(root).routineState,
    join('.cerebro', 'runtime', 'routines'), join('.cerebro', 'runtime'));
}

function routineMigrationDirectory(root) {
  return safeDirectory(root, layout(root).routineMigrations,
    join('.cerebro', 'runtime', 'migrations', 'routines'), join('.cerebro', 'runtime'));
}

export function routineOutputDirectory(root) {
  return safeDirectory(root, layout(root).routineOutputs,
    join('.cerebro', 'runtime', 'outputs', 'routines'), join('.cerebro', 'runtime'));
}

function manifestRuleMatches(rule, value) {
  const normalized = rule.replaceAll('\\', '/');
  if (normalized.endsWith('/*')) return value.startsWith(normalized.slice(0, -1));
  if (normalized.endsWith('/')) return value.startsWith(normalized);
  return value === normalized || value.startsWith(`${normalized}/`);
}

export function safeRoutineDestination(root, value) {
  const ref = safeRelativePath(root, value);
  const manifestPath = join(root, '.cerebro', 'private-ignore.manifest');
  if (!existsSync(manifestPath)) throw new Error('manifesto privado ausente');
  const protectedByManifest = readFileSync(manifestPath, 'utf8').split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#') && !line.startsWith('!'))
    .some((rule) => manifestRuleMatches(rule, ref));
  if (!protectedByManifest) throw new Error('destino da rotina precisa ser privado');
  return ref;
}

export function registerRoutineContract(root, contract) {
  const errors = validateRoutineContract(contract);
  if (errors.length) throw new Error(`Routine Contract inválido: ${errors.join(' · ')}`);
  const path = routineContractPath(root, contract.routine_id);
  if (existsSync(path)) {
    const current = readJson(path, `Routine Contract ${contract.routine_id}`);
    if (JSON.stringify(current) === JSON.stringify(contract)) return { status: 'no-change', contract: current, path };
    throw new Error('Routine Contract existente diverge; substituição silenciosa bloqueada');
  }
  writeJsonAtomic(path, contract);
  return { status: 'created', contract, path, ref: `routine:${contract.routine_id}:${contract.version}` };
}

export function loadRoutineContract(root, routineId) {
  const path = routineContractPath(root, routineId);
  if (!existsSync(path)) throw new Error(`Routine Contract não encontrado: ${routineId}`);
  const contract = readJson(path, `Routine Contract ${routineId}`);
  const errors = validateRoutineContract(contract);
  if (errors.length) throw new Error(`Routine Contract inválido: ${errors.join(' · ')}`);
  return { contract, path, ref: `routine:${contract.routine_id}:${contract.version}` };
}

export function listRoutineContracts(root) {
  const directory = safeDirectory(root, layout(root).routineContracts,
    join('.cerebro', 'contracts', 'routines'), join('.cerebro', 'contracts'));
  if (!existsSync(directory)) return [];
  return readdirSync(directory).filter((name) => name.endsWith('.json')).sort().map((name) => {
    const value = readJson(join(directory, name), `Routine Contract ${name}`);
    const errors = validateRoutineContract(value);
    if (errors.length) throw new Error(`Routine Contract ${name} inválido: ${errors.join(' · ')}`);
    return value;
  });
}

export function saveExecutorBinding(root, binding, { replace = false } = {}) {
  const errors = validateExecutorBinding(binding);
  if (errors.length) throw new Error(`Executor Binding inválido: ${errors.join(' · ')}`);
  const path = executorBindingPath(root, binding.binding_id);
  if (existsSync(path) && !replace) {
    const current = readJson(path, `Executor Binding ${binding.binding_id}`);
    if (JSON.stringify(current) === JSON.stringify(binding)) return { status: 'no-change', binding: current, path };
    throw new Error('Executor Binding existente diverge; use refresh explícito');
  }
  writeJsonAtomic(path, binding);
  return { status: existsSync(path) && replace ? 'updated' : 'created', binding, path, ref: `executor-binding:${binding.binding_id}` };
}

export function loadExecutorBinding(root, bindingId) {
  const path = executorBindingPath(root, bindingId);
  if (!existsSync(path)) throw new Error(`Executor Binding não encontrado: ${bindingId}`);
  const binding = readJson(path, `Executor Binding ${bindingId}`);
  const errors = validateExecutorBinding(binding);
  if (errors.length) throw new Error(`Executor Binding inválido: ${errors.join(' · ')}`);
  return { binding, path, ref: `executor-binding:${binding.binding_id}` };
}

export function saveCollectorBinding(root, binding, { replace = false } = {}) {
  const errors = validateCollectorBinding(binding);
  if (errors.length) throw new Error(`Collector Binding inválido: ${errors.join(' · ')}`);
  const path = collectorBindingPath(root, binding.binding_id);
  if (existsSync(path) && !replace) {
    const current = readJson(path, `Collector Binding ${binding.binding_id}`);
    if (JSON.stringify(current) === JSON.stringify(binding)) return { status: 'no-change', binding: current, path };
    throw new Error('Collector Binding existente diverge; substituição silenciosa bloqueada');
  }
  const existed = existsSync(path);
  writeJsonAtomic(path, binding);
  return { status: existed && replace ? 'updated' : 'created', binding, path, ref: `collector-binding:${binding.binding_id}` };
}

export function loadCollectorBinding(root, bindingId) {
  const path = collectorBindingPath(root, bindingId);
  if (!existsSync(path)) throw new Error(`Collector Binding não encontrado: ${bindingId}`);
  const binding = readJson(path, `Collector Binding ${bindingId}`);
  const errors = validateCollectorBinding(binding);
  if (errors.length) throw new Error(`Collector Binding inválido: ${errors.join(' · ')}`);
  return { binding, path, ref: `collector-binding:${binding.binding_id}` };
}

export function routineStatePath(root, routineId) {
  if (!ID_RE.test(routineId || '')) throw new Error('routine_id inválido');
  return join(routineStateDirectory(root), `${routineId}.state.json`);
}

export function defaultRoutineState(routineId) {
  return {
    runtime_version: 1,
    routine_id: routineId,
    status: 'disabled',
    activated_at: null,
    activated_by: null,
    activation_evidence_ref: null,
    paused_at: null,
    paused_by: null,
    last_checked_at: null,
    last_scheduled_for: null,
    last_receipt_ref: null,
  };
}

export function validateRoutineState(value) {
  const errors = [];
  if (!object(value)) return ['routine state precisa ser objeto'];
  closed(errors, value, 'routine_state', [
    'runtime_version', 'routine_id', 'status', 'activated_at', 'activated_by',
    'activation_evidence_ref', 'paused_at', 'paused_by', 'last_checked_at',
    'last_scheduled_for', 'last_receipt_ref',
  ]);
  if (value.runtime_version !== 1) errors.push('runtime_version precisa ser 1');
  if (!ID_RE.test(value.routine_id || '')) errors.push('routine_id inválido');
  if (!['disabled', 'active', 'paused'].includes(value.status)) errors.push('status inválido');
  for (const field of ['activated_at', 'paused_at', 'last_checked_at', 'last_scheduled_for']) date(errors, value[field], field, true);
  for (const field of ['activated_by', 'paused_by']) {
    if (value[field] !== null && !REF_ID_RE.test(value[field] || '')) errors.push(`${field} inválido`);
  }
  for (const field of ['activation_evidence_ref', 'last_receipt_ref']) {
    if (value[field] !== null) localRef(errors, value[field], field);
  }
  if (value.status === 'active' && (!value.activated_at || !value.activated_by || !value.activation_evidence_ref)) {
    errors.push('estado active exige ativação e evidência');
  }
  if (value.status === 'paused' && (!value.paused_at || !value.paused_by)) errors.push('estado paused exige autor e data');
  return [...new Set(errors)];
}

export function loadRoutineState(root, routineId) {
  const path = routineStatePath(root, routineId);
  if (!existsSync(path)) return { state: defaultRoutineState(routineId), path };
  const state = readJson(path, `Routine State ${routineId}`);
  const errors = validateRoutineState(state);
  if (errors.length) throw new Error(`Routine State inválido: ${errors.join(' · ')}`);
  return { state, path };
}

export function saveRoutineState(root, state) {
  const errors = validateRoutineState(state);
  if (errors.length) throw new Error(`Routine State inválido: ${errors.join(' · ')}`);
  const path = routineStatePath(root, state.routine_id);
  writeJsonAtomic(path, state);
  return path;
}

export function writeRoutineRunReceipt(root, receipt) {
  const errors = validateRoutineRunReceipt(receipt);
  if (errors.length) throw new Error(`Routine Run Receipt inválido: ${errors.join(' · ')}`);
  const path = join(routineReceiptDirectory(root), `${receipt.receipt_id}.json`);
  if (existsSync(path)) throw new Error('Routine Run Receipt já existe');
  writeJsonAtomic(path, receipt);
  return { value: receipt, path, ref: `routine-receipt:${receipt.receipt_id}` };
}

export function readRoutineRunReceipt(root, receiptRef) {
  const prefix = 'routine-receipt:';
  const receiptId = receiptRef?.startsWith(prefix) ? receiptRef.slice(prefix.length) : '';
  if (!REF_ID_RE.test(receiptId)) throw new Error('Routine Run Receipt inválido');
  const path = join(routineReceiptDirectory(root), `${receiptId}.json`);
  if (!existsSync(path)) throw new Error('Routine Run Receipt não encontrado');
  const value = readJson(path, 'Routine Run Receipt');
  const errors = validateRoutineRunReceipt(value);
  if (errors.length) throw new Error(`Routine Run Receipt inválido: ${errors.join(' · ')}`);
  return value;
}

export function listRoutineRunReceipts(root, routineId = null) {
  const directory = routineReceiptDirectory(root);
  if (!existsSync(directory)) return [];
  return readdirSync(directory).filter((name) => name.endsWith('.json')).sort().map((name) => {
    const value = readJson(join(directory, name), `Routine Run Receipt ${name}`);
    const errors = validateRoutineRunReceipt(value);
    if (errors.length) throw new Error(`Routine Run Receipt ${name} inválido: ${errors.join(' · ')}`);
    return value;
  }).filter((value) => routineId === null || value.routine_id === routineId);
}

export function routineMigrationPath(root, routineId) {
  if (!ID_RE.test(routineId || '')) throw new Error('routine_id inválido');
  return join(routineMigrationDirectory(root), `${routineId}.json`);
}

export function registerRoutineMigration(root, migration) {
  const errors = validateRoutineMigration(migration);
  if (errors.length) throw new Error(`Routine Migration inválido: ${errors.join(' · ')}`);
  const contract = loadRoutineContract(root, migration.routine_id).contract;
  if (migration.routine_ref !== `routine:${contract.routine_id}:${contract.version}`) {
    throw new Error('Routine Migration aponta para versão diferente do contrato instalado');
  }
  const path = routineMigrationPath(root, migration.routine_id);
  if (existsSync(path)) {
    const current = readJson(path, `Routine Migration ${migration.routine_id}`);
    if (JSON.stringify(current) === JSON.stringify(migration)) return { status: 'no-change', migration: current, path };
    throw new Error('Routine Migration existente diverge; transição silenciosa bloqueada');
  }
  writeJsonAtomic(path, migration);
  return { status: 'created', migration, path, ref: `routine-migration:${migration.migration_id}` };
}

export function loadRoutineMigration(root, routineId, { optional = false } = {}) {
  const path = routineMigrationPath(root, routineId);
  if (!existsSync(path)) {
    if (optional) return { migration: null, path, ref: null };
    throw new Error(`Routine Migration não encontrada: ${routineId}`);
  }
  const migration = readJson(path, `Routine Migration ${routineId}`);
  const errors = validateRoutineMigration(migration);
  if (errors.length) throw new Error(`Routine Migration inválido: ${errors.join(' · ')}`);
  return { migration, path, ref: `routine-migration:${migration.migration_id}` };
}

export function listRoutineMigrations(root) {
  const directory = routineMigrationDirectory(root);
  if (!existsSync(directory)) return [];
  return readdirSync(directory).filter((name) => name.endsWith('.json')).sort().map((name) => {
    const migration = readJson(join(directory, name), `Routine Migration ${name}`);
    const errors = validateRoutineMigration(migration);
    if (errors.length) throw new Error(`Routine Migration ${name} inválido: ${errors.join(' · ')}`);
    return migration;
  });
}

export function confirmLegacySchedulePaused(root, routineId, evidenceRef, confirmedBy, {
  clock = () => new Date(),
} = {}) {
  if (!LOCAL_REF_RE.test(evidenceRef || '')) throw new Error('evidence_ref inválido');
  if (!REF_ID_RE.test(confirmedBy || '')) throw new Error('confirmed_by inválido');
  const loaded = loadRoutineMigration(root, routineId);
  if (loaded.migration.status === 'cutover-completed') return loaded.migration;
  if (loaded.migration.status === 'cancelled') throw new Error('routine-migration-cancelled');
  const now = typeof clock === 'function' ? clock() : clock;
  const confirmedAt = new Date(now);
  if (!Number.isFinite(confirmedAt.getTime())) throw new Error('relógio inválido');
  const migration = {
    ...loaded.migration,
    status: 'ready-for-activation',
    legacy_pause: {
      status: 'confirmed',
      evidence_ref: evidenceRef,
      confirmed_by: confirmedBy,
      confirmed_at: confirmedAt.toISOString(),
    },
  };
  const errors = validateRoutineMigration(migration);
  if (errors.length) throw new Error(`Routine Migration inválido: ${errors.join(' · ')}`);
  writeJsonAtomic(loaded.path, migration);
  return migration;
}

export function routineMigrationBlocker(root, routineId) {
  const { migration } = loadRoutineMigration(root, routineId, { optional: true });
  if (!migration) return null;
  if (migration.status === 'cancelled') return 'routine-migration-cancelled';
  if (migration.duplicate_run_risk && migration.legacy_pause.status !== 'confirmed') {
    return 'legacy-schedule-not-paused';
  }
  return null;
}

export function completeRoutineMigration(root, routineId, activationReceiptRef, {
  clock = () => new Date(),
} = {}) {
  const loaded = loadRoutineMigration(root, routineId, { optional: true });
  if (!loaded.migration) return null;
  const blocker = routineMigrationBlocker(root, routineId);
  if (blocker) throw new Error(blocker);
  if (loaded.migration.status === 'cutover-completed') return loaded.migration;
  const now = typeof clock === 'function' ? clock() : clock;
  const completedAt = new Date(now);
  if (!Number.isFinite(completedAt.getTime())) throw new Error('relógio inválido');
  const migration = {
    ...loaded.migration,
    status: 'cutover-completed',
    cutover: {
      activation_receipt_ref: activationReceiptRef,
      completed_at: completedAt.toISOString(),
    },
  };
  const errors = validateRoutineMigration(migration);
  if (errors.length) throw new Error(`Routine Migration inválido: ${errors.join(' · ')}`);
  writeJsonAtomic(loaded.path, migration);
  return migration;
}

export function createSlotKey(routineId, trigger, scheduledFor = null, nonce = randomUUID()) {
  const material = trigger === 'schedule' ? `${routineId}|schedule|${scheduledFor}` : `${routineId}|manual|${nonce}`;
  return `slot-${createHash('sha256').update(material).digest('hex').slice(0, 24)}`;
}

// Intl.DateTimeFormat é caro de CONSTRUIR (~1ms) e barato de USAR. Os loops de
// agenda andam minuto a minuto; sem memoização isso custava segundos por request.
const ZONED_FORMATTERS = new Map();
const ZONED_PARTS_CACHE = new Map();
const ZONED_PARTS_CACHE_MAX = 400000;

function zonedFormatter(timezone) {
  let formatter = ZONED_FORMATTERS.get(timezone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hourCycle: 'h23', weekday: 'short',
    });
    ZONED_FORMATTERS.set(timezone, formatter);
  }
  return formatter;
}

function zonedParts(dateValue, timezone) {
  const epochMinute = Math.floor(new Date(dateValue).getTime() / 60000);
  const cacheKey = `${epochMinute}|${timezone}`;
  const cached = ZONED_PARTS_CACHE.get(cacheKey);
  if (cached) return cached;
  const parts = zonedFormatter(timezone).formatToParts(dateValue);
  const value = Object.fromEntries(parts.filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]));
  const result = {
    localDate: `${value.year}-${value.month}-${value.day}`,
    day: Number(value.day),
    time: `${value.hour}:${value.minute}`,
    weekday: WEEKDAY_FROM_INTL[value.weekday],
  };
  if (ZONED_PARTS_CACHE.size >= ZONED_PARTS_CACHE_MAX) ZONED_PARTS_CACHE.clear();
  ZONED_PARTS_CACHE.set(cacheKey, result);
  return result;
}

function scheduleMatches(schedule, instant) {
  if (instant.getTime() < Date.parse(schedule.not_before)) return false;
  const parts = zonedParts(instant, schedule.timezone);
  if (parts.time !== schedule.time) return false;
  if (schedule.cadence === 'weekly' && !schedule.weekdays.includes(parts.weekday)) return false;
  if (schedule.cadence === 'monthly' && !schedule.month_days.includes(parts.day)) return false;
  return true;
}

export function scheduledSlotsBetween(schedule, after, until) {
  const end = new Date(until);
  const afterDate = new Date(after);
  if (!Number.isFinite(end.getTime()) || !Number.isFinite(afterDate.getTime()) || end <= afterDate) return [];
  const floorEnd = Math.floor(end.getTime() / 60000) * 60000;
  const cappedAfter = Math.max(afterDate.getTime(), floorEnd - MAX_SCHEDULE_LOOKBACK_MINUTES * 60000);
  let cursor = Math.floor(cappedAfter / 60000) * 60000 + 60000;
  const slots = new Map();
  for (; cursor <= floorEnd; cursor += 60000) {
    const instant = new Date(cursor);
    if (!scheduleMatches(schedule, instant)) continue;
    const local = zonedParts(instant, schedule.timezone);
    const localKey = `${local.localDate}-${schedule.time}-${schedule.timezone}`;
    if (!slots.has(localKey)) slots.set(localKey, instant.toISOString());
  }
  return [...slots.values()];
}
