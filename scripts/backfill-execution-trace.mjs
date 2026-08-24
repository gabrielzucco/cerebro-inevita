#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { evaluateRoutineOutput } from './lib/evaluation-runtime.mjs';
import { createExecutionTracer, readExecutionTrace } from './lib/execution-trace-runtime.mjs';
import { judgmentView } from './lib/judgment-protocol.mjs';
import { loadRoutineContract, readRoutineRunReceipt } from './lib/routine-protocol.mjs';
import { appendRunRecord, latestRunRecords, readJson } from './lib/system-protocol.mjs';

function option(name) {
  const prefix = `--${name}=`;
  return process.argv.find((item) => item.startsWith(prefix))?.slice(prefix.length) || '';
}

const root = resolve(option('root') || process.cwd());
const receiptId = option('receipt');
if (!receiptId) {
  console.error('uso: node scripts/backfill-execution-trace.mjs --root=<cerebro> --receipt=<receipt-id>');
  process.exit(2);
}

const receipt = readRoutineRunReceipt(root, `routine-receipt:${receiptId}`);
if (readExecutionTrace(root, receipt.run_id).length) {
  console.log(`no-change · ${receipt.run_id} já possui trace`);
  process.exit(0);
}
const { contract } = loadRoutineContract(root, receipt.routine_id);
let occurredAt = new Date(receipt.started_at);
const tracer = createExecutionTracer(root, {
  runId: receipt.run_id,
  systemRef: receipt.system_ref,
  routineRef: receipt.routine_ref,
  clock: () => occurredAt,
});
tracer.emit({
  stepId: 'run', stepType: 'run', state: 'running', parentStepId: null,
  inputRefs: [contract.context.prompt_ref], extensions: { origin: 'reconstructed' },
});
occurredAt = new Date(receipt.completed_at);
for (const ref of receipt.input_refs.filter((item) => item.startsWith('source:'))) {
  const sourceRef = ref.slice('source:'.length);
  tracer.emit({
    stepId: `access-${sourceRef}`.slice(0, 64), stepType: 'access', state: 'completed',
    sourceRef, inputRefs: [ref], extensions: { origin: 'reconstructed' },
  });
}
const collectorRef = receipt.input_refs.find((item) => item.startsWith('collector-output:'));
if (collectorRef) tracer.emit({
  stepId: 'collector', stepType: 'collector', state: 'completed', outputRefs: [collectorRef],
  extensions: { origin: 'reconstructed' },
});

let record = latestRunRecords(root).find((item) => item.run_id === receipt.run_id) || null;
let evaluation = null;
if (record?.protocol_version === 2) {
  tracer.emit({
    stepId: 'retrieval', stepType: 'retrieval', state: 'completed',
    outputRefs: [record.extensions.context_artifact_ref],
    extensions: {
      origin: 'reconstructed',
      selected_source_count: record.context_snapshot.accesses.length,
      gap_count: record.context_snapshot.gaps.length,
    },
  });
  const systemPath = resolve(root, '.cerebro', 'contracts', 'systems', `${receipt.system_ref}.json`);
  const system = existsSync(systemPath) ? readJson(systemPath, 'System Contract') : null;
  for (const access of record.context_snapshot.accesses) tracer.emit({
    stepId: `source-${access.source_ref.id}`.slice(0, 64), stepType: 'retrieval', state: 'completed',
    parentStepId: 'retrieval', sourceRef: access.source_ref.id, inputRefs: access.selected_refs,
    extensions: { origin: 'reconstructed', role: access.source_ref.role },
  });
  for (const gap of record.context_snapshot.gaps) {
    const source = system?.sources?.find((item) => item.role === gap.source_role);
    tracer.emit({
      stepId: `source-gap-${gap.source_role}`.slice(0, 64), stepType: 'retrieval', state: 'gap',
      parentStepId: 'retrieval', sourceRef: source?.source_id || null, reasonCode: gap.reason_code,
      extensions: { origin: 'reconstructed', role: gap.source_role },
    });
  }
  if (contract.extensions?.evaluation && receipt.output_ref) {
    const artifactId = String(record.extensions.context_artifact_ref || '').replace('context-artifact:', '');
    evaluation = evaluateRoutineOutput(root, contract, {
      artifact_ref: record.extensions.context_artifact_ref,
      artifact_path_ref: `.cerebro/runtime/context-artifacts/${artifactId}.json`,
    }, receipt.output_ref);
  }
}

tracer.emit({
  stepId: 'capability', stepType: 'capability',
  state: receipt.status === 'completed' ? 'completed' : receipt.status,
  capabilityRef: record?.capability
    ? `capability:${record.capability.capability_id}:${record.capability.version}`
    : `system:${receipt.system_ref}`,
  reasonCode: receipt.status === 'completed' ? null : receipt.reason_code,
  extensions: { origin: 'reconstructed', attempts: receipt.attempts },
});
if (receipt.output_ref) tracer.emit({
  stepId: 'output', stepType: 'output', state: receipt.status === 'completed' ? 'completed' : receipt.status,
  outputRefs: [receipt.output_ref], extensions: { origin: 'reconstructed' },
});
if (evaluation?.status === 'completed') {
  tracer.emit({
    stepId: 'eval', stepType: 'eval', state: evaluation.passed ? 'completed' : 'failed',
    reasonCode: evaluation.passed ? null : 'evaluation-gate-failed',
    inputRefs: evaluation.input_refs, evidenceRef: evaluation.evidence_ref,
    extensions: { origin: 'reconstructed', evaluator_ref: evaluation.evaluator_ref, gate_results: evaluation.gate_results },
  });
  if (record.eval.passed === null) {
    record = {
      ...record,
      eval: { ...record.eval, passed: evaluation.passed },
      extensions: {
        ...record.extensions,
        execution_trace_ref: tracer.traceRef,
        evaluation: {
          status: evaluation.status,
          evaluator_ref: evaluation.evaluator_ref,
          evidence_ref: evaluation.evidence_ref,
          gate_results: evaluation.gate_results,
          origin: 'backfilled-from-existing-artifacts',
        },
      },
    };
    appendRunRecord(root, record);
  }
} else tracer.emit({
  stepId: 'eval', stepType: 'eval', state: 'pending', reasonCode: 'evaluation-not-recorded',
  extensions: { origin: 'reconstructed' },
});

let judgment = { status: 'pending', verdict: null };
try { judgment = judgmentView(root, receipt.receipt_id); } catch { /* Pending is the honest fallback. */ }
tracer.emit({
  stepId: 'judgment', stepType: 'judgment',
  state: judgment.status === 'pending' ? 'pending'
    : judgment.verdict === 'approved' ? 'completed'
      : judgment.verdict === 'rejected' ? 'failed' : 'pending',
  inputRefs: receipt.output_ref ? [receipt.output_ref] : [],
  reasonCode: judgment.status === 'pending' ? 'human-decision-pending' : null,
  extensions: { origin: 'reconstructed' },
});
tracer.emit({
  stepId: 'run', stepType: 'run', state: receipt.status === 'completed' ? 'completed' : receipt.status,
  parentStepId: null, reasonCode: receipt.reason_code,
  outputRefs: receipt.output_ref ? [receipt.output_ref] : [],
  extensions: { origin: 'reconstructed' },
});

console.log(`${evaluation?.passed === true ? 'evaluated' : 'reconstructed'} · ${receipt.run_id} · ${readExecutionTrace(root, receipt.run_id).length} eventos`);
