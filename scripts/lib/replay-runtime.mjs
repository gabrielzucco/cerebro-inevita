import { existsSync, lstatSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { createExecutionTracer } from './execution-trace-runtime.mjs';
import {
  appendRunRecord, latestRunRecords, layout, readJson, validateRunRecord, validateSystemContract,
} from './system-protocol.mjs';

const LOCAL_REF_RE = /^(?!.*\.\.(?:\/|$))[A-Za-z0-9.][A-Za-z0-9_./:-]{0,255}$/;
const OPAQUE_REF_RE = /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$/;

function date(value, label) {
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) throw new Error(`replay-${label}-invalid`);
  return parsed;
}

function systemContract(root, systemRef) {
  const path = resolve(root, layout(root).systemContracts || join('.cerebro', 'contracts', 'systems'), `${systemRef}.json`);
  if (!existsSync(path) || lstatSync(path).isSymbolicLink()) throw new Error('replay-system-contract-missing');
  const contract = readJson(path, 'System Contract');
  if (validateSystemContract(contract).length || contract.system_id !== systemRef || contract.protocol_version !== 2) {
    throw new Error('replay-system-contract-v2-required');
  }
  return contract;
}

function refs(values, label, { minimum = 0 } = {}) {
  if (!Array.isArray(values) || values.length < minimum
    || values.some((ref) => !LOCAL_REF_RE.test(ref || ''))
    || new Set(values).size !== values.length) throw new Error(`replay-${label}-invalid`);
  return values;
}

export function recordReplayExecution(root, {
  runId,
  systemRef,
  chainId,
  experimentRef = null,
  handoffRefs = [],
  startedAt,
  completedAt,
  accesses,
  inputRefs = [],
  outputRefs,
  modelObservation = null,
  connectorObservations = [],
  evalPassed = true,
  humanDecision = 'approved',
  outcomes = [],
  routineRef = null,
} = {}) {
  if (!OPAQUE_REF_RE.test(runId || '') || !OPAQUE_REF_RE.test(chainId || '')) throw new Error('replay-lineage-invalid');
  if (latestRunRecords(root).some((record) => record.run_id === runId)) throw new Error('replay-run-already-exists');
  if (experimentRef !== null && !/^EXP-[A-Za-z0-9_-]{1,48}$/.test(experimentRef)) throw new Error('replay-experiment-ref-invalid');
  refs(handoffRefs, 'handoff-refs');
  refs(inputRefs, 'input-refs');
  refs(outputRefs, 'output-refs', { minimum: 1 });
  const system = systemContract(root, systemRef);
  if (!Array.isArray(accesses) || accesses.length < 1) throw new Error('replay-accesses-invalid');
  const sourceRefs = accesses.map((access) => access.source_ref);
  const started = date(startedAt, 'started-at');
  const completed = date(completedAt, 'completed-at');
  if (completed < started) throw new Error('replay-time-order-invalid');
  const record = {
    protocol_version: 2,
    run_id: runId,
    chain_id: chainId,
    mode: 'replay',
    experiment_ref: experimentRef,
    handoff_refs: handoffRefs,
    system_id: system.system_id,
    system_version: system.version,
    capability: { capability_id: system.capability.capability_id, version: system.capability.version },
    status: 'completed',
    started_at: started.toISOString(),
    completed_at: completed.toISOString(),
    entity_refs: experimentRef ? [{ role: 'experimento', id: experimentRef }] : [],
    source_refs: sourceRefs,
    output_refs: outputRefs,
    context_snapshot: {
      system_contract_version: system.version,
      retrieval_version: system.retrieval.version,
      observed_at: completed.toISOString(),
      accesses,
      gaps: [], fallbacks: [], conflicts: [],
    },
    eval: { version: system.eval.version, passed: evalPassed },
    human_decision: humanDecision,
    correction_ref: null,
    outcomes,
    privacy: { content_shared_with_inevita: false },
    extensions: {
      origin: 'governed-replay',
      execution_trace_ref: `execution-trace:pending-${runId}`,
      external_actions_executed: false,
    },
  };
  const recordErrors = validateRunRecord(record);
  if (recordErrors.length) throw new Error(`replay-run-record-invalid:${recordErrors.join('|')}`);
  const tracer = createExecutionTracer(root, {
    runId, systemRef, routineRef: routineRef || `replay:${systemRef}`, chainId, mode: 'replay',
    experimentRef, handoffRefs, clock: () => completed,
  });
  tracer.emit({ stepId: 'run', stepType: 'run', state: 'running', parentStepId: null, inputRefs });
  for (const access of accesses) tracer.emit({
    stepId: `source-${access.source_ref.id}`.slice(0, 64), stepType: 'retrieval', state: 'completed',
    sourceRef: access.source_ref.id, inputRefs: access.selected_refs,
    extensions: { role: access.source_ref.role, assurance: access.assurance },
  });
  for (const connector of connectorObservations) tracer.emit({
    stepId: `connector-${connector.connector_ref}`.replace(/[^a-z0-9-]/g, '-').slice(0, 64),
    stepType: 'connector', state: 'completed', sourceRef: connector.source_ref || null,
    connectorRef: connector.connector_ref, assurance: connector.assurance,
    inputRefs: refs(connector.input_refs || [], 'connector-input-refs'),
    outputRefs: refs(connector.output_refs || [], 'connector-output-refs'),
  });
  tracer.emit({
    stepId: 'retrieval', stepType: 'retrieval', state: 'completed',
    inputRefs: accesses.flatMap((access) => access.selected_refs),
  });
  if (modelObservation) tracer.emit({
    stepId: 'model', stepType: 'model', state: 'completed', modelRef: modelObservation.model_ref,
    assurance: modelObservation.assurance, inputRefs,
  });
  tracer.emit({
    stepId: 'capability', stepType: 'capability', state: 'completed',
    capabilityRef: `capability:${system.capability.capability_id}:${system.capability.version}`,
    inputRefs: [...inputRefs, ...accesses.flatMap((access) => access.selected_refs)], outputRefs,
  });
  tracer.emit({ stepId: 'output', stepType: 'output', state: 'completed', outputRefs });
  tracer.emit({
    stepId: 'eval', stepType: 'eval', state: evalPassed ? 'completed' : 'failed',
    reasonCode: evalPassed ? null : 'evaluation-gate-failed',
  });
  tracer.emit({
    stepId: 'judgment', stepType: 'judgment',
    state: humanDecision === 'approved' ? 'completed' : humanDecision === 'pending' ? 'pending' : 'failed',
    inputRefs: outputRefs,
  });
  tracer.emit({ stepId: 'run', stepType: 'run', state: 'completed', parentStepId: null, outputRefs });
  record.extensions.execution_trace_ref = tracer.traceRef;
  appendRunRecord(root, record);
  return { record, record_ref: `run-record:${runId}`, trace_ref: tracer.traceRef };
}
