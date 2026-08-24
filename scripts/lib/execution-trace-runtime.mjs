import { randomUUID } from 'node:crypto';
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  realpathSync,
} from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { layout } from './system-protocol.mjs';

const ID_RE = /^[a-z0-9][a-z0-9-]{0,63}$/;
const REF_RE = /^[A-Za-z0-9][A-Za-z0-9_./:-]{0,255}$/;
const LOCAL_REF_RE = /^(?!.*\.\.(?:\/|$))[A-Za-z0-9.][A-Za-z0-9_./:-]{0,255}$/;
const STEP_TYPES = new Set([
  'run', 'access', 'collector', 'retrieval', 'skill', 'model', 'connector', 'capability', 'output', 'eval', 'judgment',
]);
const STATES = new Set([
  'declared', 'running', 'completed', 'failed', 'denied', 'skipped', 'gap', 'pending',
]);
const SECRET_RE = /Bearer\s+|-----BEGIN .*PRIVATE KEY-----|\b(?:sk|ghp|xoxb)[-_A-Za-z0-9]{12,}/i;
const OPAQUE_REF_RE = /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$/;
const EXPERIMENT_ID_RE = /^EXP-[A-Za-z0-9_-]{1,48}$/;
const MODEL_ASSURANCES = new Set(['requested-not-verified', 'provider-reported', 'verified']);
const CONNECTOR_ASSURANCES = new Set(['exported', 'receipt-audited', 'runtime-enforced']);

function object(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function clockValue(clock) {
  const value = typeof clock === 'function' ? clock() : clock;
  const date = value instanceof Date ? new Date(value) : new Date(value || Date.now());
  if (!Number.isFinite(date.getTime())) throw new Error('trace-clock-invalid');
  return date;
}

function insideRuntime(root, configured, fallback) {
  const runtime = resolve(root, '.cerebro', 'runtime');
  const target = resolve(root, configured || fallback);
  const lexical = relative(runtime, target);
  if (!lexical || lexical.startsWith('..') || lexical.startsWith(sep)) {
    throw new Error('trace-layout-not-private');
  }
  mkdirSync(target, { recursive: true, mode: 0o700 });
  const realRuntime = realpathSync(runtime);
  const realTarget = realpathSync(target);
  const real = relative(realRuntime, realTarget);
  if (!real || real.startsWith('..') || real.startsWith(sep)) throw new Error('trace-layout-outside-runtime');
  return target;
}

export function executionTraceDirectory(root) {
  return insideRuntime(
    root,
    layout(root).executionTraces,
    join('.cerebro', 'runtime', 'traces'),
  );
}

export function validateExecutionTraceEvent(value) {
  const errors = [];
  if (!object(value)) return ['execution trace event precisa ser objeto'];
  const allowed = new Set([
    'protocol_version', 'trace_id', 'event_id', 'run_id', 'sequence', 'step_id', 'step_type',
    'state', 'occurred_at', 'parent_step_id', 'system_ref', 'routine_ref', 'source_ref',
    'capability_ref', 'skill_ref', 'input_refs', 'output_refs', 'reason_code', 'evidence_ref',
    'model_ref', 'connector_ref', 'assurance', 'chain_id', 'mode', 'experiment_ref',
    'handoff_refs', 'privacy', 'extensions',
  ]);
  for (const key of Object.keys(value)) if (!allowed.has(key)) errors.push(`${key} não é permitido`);
  if (value.protocol_version !== 1) errors.push('protocol_version precisa ser 1');
  for (const field of ['trace_id', 'event_id', 'run_id']) {
    if (!REF_RE.test(value[field] || '') || String(value[field]).length < 8) errors.push(`${field} inválido`);
  }
  if (!Number.isInteger(value.sequence) || value.sequence < 1) errors.push('sequence inválida');
  if (!ID_RE.test(value.step_id || '')) errors.push('step_id inválido');
  if (!STEP_TYPES.has(value.step_type)) errors.push('step_type inválido');
  if (!STATES.has(value.state)) errors.push('state inválido');
  if (!Number.isFinite(Date.parse(value.occurred_at || ''))) errors.push('occurred_at inválido');
  for (const field of ['parent_step_id', 'system_ref', 'routine_ref', 'source_ref', 'capability_ref', 'model_ref', 'connector_ref', 'reason_code', 'evidence_ref']) {
    if (value[field] !== null && !REF_RE.test(value[field] || '')) errors.push(`${field} inválido`);
  }
  if (value.skill_ref !== null && !LOCAL_REF_RE.test(value.skill_ref || '')) errors.push('skill_ref inválido');
  for (const field of ['input_refs', 'output_refs']) {
    if (!Array.isArray(value[field])) errors.push(`${field} precisa ser lista`);
    else if (value[field].some((ref) => !LOCAL_REF_RE.test(ref || ''))) errors.push(`${field} contém referência inválida`);
  }
  if (value.skill_ref !== null && value.step_type !== 'skill') errors.push('skill_ref só existe em step_type skill');
  if (value.step_type === 'skill' && value.state === 'completed'
    && (!value.skill_ref || !String(value.evidence_ref || '').startsWith('sha256:'))) {
    errors.push('skill concluída exige skill_ref e evidência sha256');
  }
  if (value.step_type === 'model') {
    if (!value.model_ref) errors.push('step_type model exige model_ref');
    if (!MODEL_ASSURANCES.has(value.assurance)) errors.push('step_type model exige assurance de modelo');
  } else if (value.model_ref != null) errors.push('model_ref só existe em step_type model');
  if (value.step_type === 'connector') {
    if (!value.connector_ref) errors.push('step_type connector exige connector_ref');
    if (!CONNECTOR_ASSURANCES.has(value.assurance)) errors.push('step_type connector exige assurance de conector');
  } else if (value.connector_ref != null) errors.push('connector_ref só existe em step_type connector');
  if (!['model', 'connector'].includes(value.step_type) && value.assurance != null) {
    errors.push('assurance só existe em step_type model ou connector');
  }
  if (value.chain_id != null && !OPAQUE_REF_RE.test(value.chain_id || '')) errors.push('chain_id inválido');
  if (value.chain_id == null && value.mode != null) errors.push('mode exige chain_id');
  if (value.chain_id != null && !['replay', 'live'].includes(value.mode)) errors.push('chain_id exige mode replay ou live');
  if (value.mode != null && !['replay', 'live'].includes(value.mode)) errors.push('mode inválido');
  if (value.experiment_ref != null && !EXPERIMENT_ID_RE.test(value.experiment_ref || '')) errors.push('experiment_ref inválido');
  if (value.experiment_ref && !value.chain_id) errors.push('experiment_ref exige chain_id');
  if (value.handoff_refs !== undefined && !Array.isArray(value.handoff_refs)) errors.push('handoff_refs precisa ser lista');
  else if (Array.isArray(value.handoff_refs)) {
    if (new Set(value.handoff_refs).size !== value.handoff_refs.length) errors.push('handoff_refs não pode repetir valores');
    if (value.handoff_refs.some((ref) => !LOCAL_REF_RE.test(ref || ''))) errors.push('handoff_refs contém referência inválida');
  }
  if (!object(value.privacy)
    || value.privacy.content_shared_with_inevita !== false
    || value.privacy.payload_recorded !== false
    || value.privacy.raw_error_recorded !== false) errors.push('privacy inválida');
  const serialized = JSON.stringify(value);
  if (SECRET_RE.test(serialized)) errors.push('trace parece conter segredo');
  if (/"(?:prompt|output|raw_error|content|payload)"\s*:/i.test(serialized)) {
    errors.push('trace contém payload em vez de referência');
  }
  return [...new Set(errors)];
}

function tracePath(root, runId) {
  if (!REF_RE.test(runId || '')) throw new Error('trace-run-id-invalid');
  return join(executionTraceDirectory(root), `${runId}.jsonl`);
}

export function readExecutionTrace(root, runId) {
  const path = tracePath(root, runId);
  if (!existsSync(path)) return [];
  const events = readFileSync(path, 'utf8').split('\n').filter(Boolean).map((line, index) => {
    let event;
    try { event = JSON.parse(line); } catch { throw new Error(`trace-json-invalid-${index + 1}`); }
    const errors = validateExecutionTraceEvent(event);
    if (errors.length) throw new Error(`trace-event-invalid-${index + 1}`);
    return event;
  });
  for (let index = 0; index < events.length; index += 1) {
    if (events[index].sequence !== index + 1) throw new Error('trace-sequence-invalid');
    if (events[index].run_id !== runId) throw new Error('trace-run-mismatch');
    if (index > 0 && events[index].trace_id !== events[0].trace_id) throw new Error('trace-id-mismatch');
  }
  return events;
}

export function createExecutionTracer(root, {
  runId,
  systemRef,
  routineRef,
  traceId = `execution-trace-${randomUUID()}`,
  chainId = null,
  mode = null,
  experimentRef = null,
  handoffRefs = [],
  clock = () => new Date(),
} = {}) {
  const path = tracePath(root, runId);
  if (existsSync(path)) throw new Error('trace-already-exists');
  let sequence = 0;
  function emit({
    stepId,
    stepType,
    state,
    parentStepId = 'run',
    sourceRef = null,
    capabilityRef = null,
    skillRef = null,
    modelRef = null,
    connectorRef = null,
    assurance = null,
    inputRefs = [],
    outputRefs = [],
    reasonCode = null,
    evidenceRef = null,
    extensions = undefined,
  }) {
    const event = {
      protocol_version: 1,
      trace_id: traceId,
      event_id: `trace-event-${randomUUID()}`,
      run_id: runId,
      sequence: ++sequence,
      step_id: stepId,
      step_type: stepType,
      state,
      occurred_at: clockValue(clock).toISOString(),
      parent_step_id: stepId === 'run' ? null : parentStepId,
      system_ref: systemRef || null,
      routine_ref: routineRef || null,
      source_ref: sourceRef,
      capability_ref: capabilityRef,
      skill_ref: skillRef,
      model_ref: modelRef,
      connector_ref: connectorRef,
      assurance,
      chain_id: chainId,
      mode,
      experiment_ref: experimentRef,
      handoff_refs: handoffRefs,
      input_refs: inputRefs,
      output_refs: outputRefs,
      reason_code: reasonCode,
      evidence_ref: evidenceRef,
      privacy: {
        content_shared_with_inevita: false,
        payload_recorded: false,
        raw_error_recorded: false,
      },
      ...(extensions === undefined ? {} : { extensions }),
    };
    const errors = validateExecutionTraceEvent(event);
    if (errors.length) throw new Error(`trace-event-invalid:${errors.join('|')}`);
    mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
    appendFileSync(path, `${JSON.stringify(event)}\n`, { mode: 0o600 });
    return event;
  }
  return {
    traceId,
    traceRef: `execution-trace:${traceId}`,
    path,
    emit,
  };
}

export function latestStepStates(events) {
  const byStep = new Map();
  for (const event of events) byStep.set(event.step_id, event);
  return byStep;
}
