import { createHash } from 'node:crypto';
import { lstatSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { rodarGates } from './eval-calls-gates.mjs';
import { safeRelativePath } from './system-protocol.mjs';

const POINTER_RE = /^\/(?:[A-Za-z0-9_.-]+(?:\/[A-Za-z0-9_.-]+)*)?$/;
const MAX_SOURCE_BYTES = 8 * 1024 * 1024;
const MAX_OUTPUT_BYTES = 2 * 1024 * 1024;

function pointer(value, path) {
  if (!POINTER_RE.test(path || '')) throw new Error('evaluation-source-pointer-invalid');
  let current = value;
  for (const segment of path.slice(1).split('/').filter(Boolean)) {
    if (current === null || typeof current !== 'object' || !(segment in current)) {
      throw new Error('evaluation-source-pointer-missing');
    }
    current = current[segment];
  }
  return current;
}
function textFile(root, ref, maximum, label) {
  const safe = safeRelativePath(root, ref, { mustExist: true });
  const path = resolve(root, safe);
  if (lstatSync(path).isSymbolicLink()) throw new Error(`${label}-symlink-blocked`);
  const stat = statSync(path);
  if (!stat.isFile() || stat.size < 1 || stat.size > maximum) throw new Error(`${label}-size-invalid`);
  try {
    return { ref: safe, value: new TextDecoder('utf-8', { fatal: true }).decode(readFileSync(path)) };
  } catch {
    throw new Error(`${label}-encoding-invalid`);
  }
}

function callsEvaluator(root, config, context, outputRef) {
  if (!context?.artifact_path_ref || !context?.artifact_ref) throw new Error('evaluation-context-missing');
  const artifact = textFile(root, context.artifact_path_ref, MAX_SOURCE_BYTES, 'evaluation-artifact');
  let parsed;
  try { parsed = JSON.parse(artifact.value); } catch { throw new Error('evaluation-artifact-json-invalid'); }
  const sourceRef = pointer(parsed, config.source_pointer);
  if (typeof sourceRef !== 'string') throw new Error('evaluation-source-ref-invalid');
  const source = textFile(root, sourceRef, MAX_SOURCE_BYTES, 'evaluation-source');
  const output = textFile(root, outputRef, MAX_OUTPUT_BYTES, 'evaluation-output');
  const results = rodarGates(source.value, output.value).map((result) => ({
    gate_id: result.gate,
    passed: result.ok,
    not_applicable: result.naoAplicavel === true,
    issue_count: result.problemas.length,
  }));
  const passed = results.every((result) => result.passed);
  const digest = createHash('sha256').update(JSON.stringify(results)).digest('hex');
  return {
    status: 'completed',
    evaluator_ref: config.evaluator_ref,
    passed,
    gate_results: results,
    evidence_ref: `sha256:${digest}`,
    input_refs: [
      `${context.artifact_ref}:json-pointer:${config.source_pointer}`,
      output.ref,
    ],
  };
}

export function evaluateRoutineOutput(root, contract, context, outputRef) {
  const config = contract.extensions?.evaluation;
  if (!config) return {
    status: 'not-declared', evaluator_ref: null, passed: null, gate_results: [], evidence_ref: null, input_refs: [],
  };
  if (config.kind !== 'registered-evaluator') throw new Error('evaluation-kind-invalid');
  if (config.evaluator_ref === 'calls-deterministic-v1') {
    return callsEvaluator(root, config, context, outputRef);
  }
  throw new Error('evaluation-evaluator-unsupported');
}
