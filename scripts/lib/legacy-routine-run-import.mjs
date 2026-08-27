import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createExecutionTracer, readExecutionTrace } from './execution-trace-runtime.mjs';
import {
  createSlotKey,
  loadExecutorBinding,
  loadRoutineContract,
  readRoutineRunReceipt,
  writeRoutineRunReceipt,
} from './routine-protocol.mjs';
import { writeJsonAtomic } from './system-protocol.mjs';

const ID_RE = /^[a-z0-9][a-z0-9-]{0,63}$/;
const VERSION_RE = /^\d+\.\d+\.\d+(?:[-+][A-Za-z0-9.-]+)?$/;
const LOCAL_REF_RE = /^(?!\.?\.?$)(?!\.?\?\/)(?!.*\/\.\.(?:\/|$))[A-Za-z0-9.][A-Za-z0-9_./:-]{0,255}$/;
const STATUSES = new Set(['completed', 'failed', 'denied', 'skipped']);

function object(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function closed(value, keys, path, errors) {
  if (!object(value)) return;
  const allowed = new Set(keys);
  for (const key of Object.keys(value)) if (!allowed.has(key)) errors.push(`${path}.${key} não é permitido`);
}

function validDate(value) {
  return typeof value === 'string' && Number.isFinite(Date.parse(value));
}

function deterministicId(prefix, material) {
  return `${prefix}-${createHash('sha256').update(material).digest('hex').slice(0, 24)}`;
}

export function validateLegacyRoutineRunManifest(value) {
  const errors = [];
  if (!object(value)) return ['manifest precisa ser objeto'];
  closed(value, ['protocol_version', 'source', 'routines'], 'manifest', errors);
  if (value.protocol_version !== 1) errors.push('protocol_version precisa ser 1');
  if (!object(value.source)) errors.push('source precisa ser objeto');
  else {
    closed(value.source, ['kind', 'ref', 'observed_at'], 'source', errors);
    if (value.source.kind !== 'codex-automation') errors.push('source.kind precisa ser codex-automation');
    if (!LOCAL_REF_RE.test(value.source.ref || '')) errors.push('source.ref inválido');
    if (!validDate(value.source.observed_at)) errors.push('source.observed_at inválido');
  }
  if (!Array.isArray(value.routines) || value.routines.length === 0) errors.push('routines precisa ter itens');
  const externalKeys = new Set();
  for (const [routineIndex, routine] of (Array.isArray(value.routines) ? value.routines : []).entries()) {
    const path = `routines[${routineIndex}]`;
    if (!object(routine)) {
      errors.push(`${path} precisa ser objeto`);
      continue;
    }
    closed(routine, ['routine_id', 'routine_version', 'runs'], path, errors);
    if (!ID_RE.test(routine.routine_id || '')) errors.push(`${path}.routine_id inválido`);
    if (!VERSION_RE.test(routine.routine_version || '')) errors.push(`${path}.routine_version inválido`);
    if (!Array.isArray(routine.runs) || routine.runs.length === 0) errors.push(`${path}.runs precisa ter itens`);
    for (const [runIndex, run] of (Array.isArray(routine.runs) ? routine.runs : []).entries()) {
      const runPath = `${path}.runs[${runIndex}]`;
      if (!object(run)) {
        errors.push(`${runPath} precisa ser objeto`);
        continue;
      }
      closed(run, [
        'external_run_ref', 'scheduled_for', 'started_at', 'completed_at', 'status',
        'reason_code', 'input_refs', 'skill_refs', 'assurance',
      ], runPath, errors);
      if (!LOCAL_REF_RE.test(run.external_run_ref || '')) errors.push(`${runPath}.external_run_ref inválido`);
      const externalKey = `${routine.routine_id}|${run.external_run_ref}`;
      if (externalKeys.has(externalKey)) errors.push(`${runPath}.external_run_ref repetido`);
      externalKeys.add(externalKey);
      for (const field of ['scheduled_for', 'started_at', 'completed_at']) {
        if (!validDate(run[field])) errors.push(`${runPath}.${field} inválido`);
      }
      if (validDate(run.started_at) && validDate(run.completed_at)
        && Date.parse(run.completed_at) < Date.parse(run.started_at)) {
        errors.push(`${runPath}.completed_at anterior ao início`);
      }
      if (!STATUSES.has(run.status)) errors.push(`${runPath}.status inválido`);
      if (!ID_RE.test(run.reason_code || '')) errors.push(`${runPath}.reason_code inválido`);
      for (const field of ['input_refs', 'skill_refs']) {
        if (!Array.isArray(run[field])) errors.push(`${runPath}.${field} precisa ser lista`);
        for (const ref of Array.isArray(run[field]) ? run[field] : []) {
          if (!LOCAL_REF_RE.test(ref || '')) errors.push(`${runPath}.${field} contém referência inválida`);
        }
        if (Array.isArray(run[field]) && new Set(run[field]).size !== run[field].length) {
          errors.push(`${runPath}.${field} não pode repetir itens`);
        }
      }
      if (!['memory-only', 'thread-observed', 'receipt-audited'].includes(run.assurance)) {
        errors.push(`${runPath}.assurance inválida`);
      }
    }
  }
  const serialized = JSON.stringify(value);
  if (/Bearer\s+|-----BEGIN .*PRIVATE KEY-----|\b(?:sk|ghp|xoxb)[-_A-Za-z0-9]{12,}/i.test(serialized)) {
    errors.push('manifest parece conter segredo');
  }
  if (/"(?:prompt|output|raw_error|token|api_key)"\s*:/i.test(serialized)) {
    errors.push('manifest precisa ser reference-only');
  }
  return [...new Set(errors)];
}

function materialize(root, source, routineEntry, run) {
  const { contract } = loadRoutineContract(root, routineEntry.routine_id);
  const declaredSkills = new Set(contract.context.skill_refs || []);
  for (const skillRef of run.skill_refs) {
    if (!declaredSkills.has(skillRef)) throw new Error(`skill-not-declared:${skillRef}`);
  }
  const { binding } = loadExecutorBinding(root, contract.executor.binding_ref);
  const material = `${routineEntry.routine_id}|${run.external_run_ref}|${run.scheduled_for}`;
  const runId = deterministicId('routine-run-legacy', material);
  const receiptId = deterministicId('routine-receipt-legacy', material);
  const outputRef = run.status === 'completed'
    ? `.cerebro/runtime/outputs/routines/${runId}.legacy.json`
    : null;
  const receipt = {
    protocol_version: 1,
    receipt_id: receiptId,
    run_id: runId,
    routine_ref: `routine:${routineEntry.routine_id}:${routineEntry.routine_version}`,
    routine_id: routineEntry.routine_id,
    routine_version: routineEntry.routine_version,
    system_ref: contract.system_ref,
    binding_ref: contract.executor.binding_ref,
    adapter: binding.adapter,
    requested_model: contract.executor.requested_model,
    model_observation: 'requested-not-verified',
    trigger: 'schedule',
    slot_key: createSlotKey(routineEntry.routine_id, 'schedule', new Date(run.scheduled_for).toISOString()),
    scheduled_for: new Date(run.scheduled_for).toISOString(),
    attempts: run.status === 'skipped' ? 0 : 1,
    status: run.status,
    reason_code: run.reason_code,
    started_at: new Date(run.started_at).toISOString(),
    completed_at: new Date(run.completed_at).toISOString(),
    input_refs: [...new Set([source.ref, run.external_run_ref, ...run.input_refs])],
    output_ref: outputRef,
    access_receipt_refs: [],
    content_shared_with_provider: true,
    privacy: {
      content_shared_with_inevita: false,
      prompt_recorded: false,
      output_recorded: false,
      raw_error_recorded: false,
    },
  };
  return { contract, binding, receipt, run, source };
}

function same(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function writeReconstructedTrace(root, item) {
  const { contract, receipt, run, source } = item;
  const existing = readExecutionTrace(root, receipt.run_id);
  if (existing.length) return { status: 'no-change', events: existing.length };
  let occurredAt = new Date(receipt.started_at);
  const tracer = createExecutionTracer(root, {
    runId: receipt.run_id,
    systemRef: receipt.system_ref,
    routineRef: receipt.routine_ref,
    traceId: deterministicId('execution-trace-legacy', receipt.run_id),
    clock: () => occurredAt,
  });
  const extensions = {
    origin: 'reconstructed',
    import_source: source.ref,
    external_run_ref: run.external_run_ref,
    historical_assurance: run.assurance,
    timing_assurance: receipt.started_at === receipt.completed_at ? 'completion-only' : 'bounded',
  };
  tracer.emit({
    stepId: 'run', stepType: 'run', state: 'running', parentStepId: null,
    inputRefs: receipt.input_refs, evidenceRef: run.external_run_ref, extensions,
  });
  occurredAt = new Date(receipt.completed_at);
  for (const [index, skillRef] of run.skill_refs.entries()) tracer.emit({
    stepId: `skill-${index + 1}`, stepType: 'skill', state: 'declared',
    skillRef, evidenceRef: run.external_run_ref,
    extensions: { ...extensions, load_assurance: 'requested-not-verified' },
  });
  tracer.emit({
    stepId: 'capability', stepType: 'capability',
    state: receipt.status === 'completed' ? 'completed' : receipt.status,
    capabilityRef: `system:${contract.system_ref}`,
    reasonCode: receipt.status === 'completed' ? null : receipt.reason_code,
    evidenceRef: run.external_run_ref, extensions,
  });
  if (receipt.output_ref) tracer.emit({
    stepId: 'output', stepType: 'output', state: 'completed',
    outputRefs: [receipt.output_ref], evidenceRef: run.external_run_ref,
    extensions: { ...extensions, artifact_assurance: 'metadata-only' },
  });
  tracer.emit({
    stepId: 'judgment', stepType: 'judgment', state: 'pending',
    reasonCode: 'human-decision-pending', evidenceRef: run.external_run_ref, extensions,
  });
  tracer.emit({
    stepId: 'run', stepType: 'run',
    state: receipt.status === 'completed' ? 'completed' : receipt.status,
    parentStepId: null, reasonCode: receipt.reason_code,
    evidenceRef: run.external_run_ref, extensions,
  });
  return { status: 'created', events: readExecutionTrace(root, receipt.run_id).length };
}

function writeLegacyOutput(root, item) {
  if (!item.receipt.output_ref) return 'not-applicable';
  const path = join(root, item.receipt.output_ref);
  const value = {
    protocol_version: 1,
    kind: 'legacy-run-metadata',
    run_ref: `run-record:${item.receipt.run_id}`,
    receipt_ref: `routine-receipt:${item.receipt.receipt_id}`,
    external_run_ref: item.run.external_run_ref,
    status: item.receipt.status,
    reason_code: item.receipt.reason_code,
    assurance: item.run.assurance,
    privacy: {
      content_shared_with_inevita: false,
      payload_recorded: false,
    },
  };
  if (existsSync(path)) {
    let current;
    try { current = JSON.parse(readFileSync(path, 'utf8')); } catch { throw new Error('legacy-routine-output-invalid'); }
    if (!same(current, value)) throw new Error(`legacy-routine-output-conflict:${item.receipt.run_id}`);
    return 'no-change';
  }
  writeJsonAtomic(path, value);
  return 'created';
}

export function previewLegacyRoutineRunImport(root, manifest) {
  const errors = validateLegacyRoutineRunManifest(manifest);
  if (errors.length) throw new Error(`legacy-routine-run-manifest-invalid:${errors.join('|')}`);
  const items = [];
  for (const routineEntry of manifest.routines) {
    for (const run of routineEntry.runs) items.push(materialize(root, manifest.source, routineEntry, run));
  }
  return {
    status: 'ready',
    source_ref: manifest.source.ref,
    runs: items.map(({ receipt, run }) => ({
      routine_id: receipt.routine_id,
      receipt_ref: `routine-receipt:${receipt.receipt_id}`,
      run_id: receipt.run_id,
      external_run_ref: run.external_run_ref,
      status: receipt.status,
      trace_origin: 'reconstructed',
    })),
    _items: items,
  };
}

export function importLegacyRoutineRuns(root, manifest, { confirm = false } = {}) {
  const preview = previewLegacyRoutineRunImport(root, manifest);
  if (!confirm) return { ...preview, status: 'preview', _items: undefined };
  const results = [];
  for (const item of preview._items) {
    const receiptRef = `routine-receipt:${item.receipt.receipt_id}`;
    const receiptPath = join(root, '.cerebro', 'runtime', 'receipts', 'routines', `${item.receipt.receipt_id}.json`);
    const outputStatus = writeLegacyOutput(root, item);
    let receiptStatus = 'created';
    if (existsSync(receiptPath)) {
      const current = readRoutineRunReceipt(root, receiptRef);
      if (!same(current, item.receipt)) throw new Error(`legacy-routine-receipt-conflict:${item.receipt.receipt_id}`);
      receiptStatus = 'no-change';
    } else writeRoutineRunReceipt(root, item.receipt);
    const trace = writeReconstructedTrace(root, item);
    results.push({
      routine_id: item.receipt.routine_id,
      receipt_ref: receiptRef,
      run_id: item.receipt.run_id,
      receipt_status: receiptStatus,
      trace_status: trace.status,
      trace_events: trace.events,
      output_status: outputStatus,
    });
  }
  return {
    status: results.every((item) => item.receipt_status === 'no-change' && item.trace_status === 'no-change')
      ? 'no-change' : 'imported',
    source_ref: manifest.source.ref,
    runs: results,
  };
}
