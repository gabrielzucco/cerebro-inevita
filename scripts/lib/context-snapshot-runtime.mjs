import { createHash } from 'node:crypto';
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  renameSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { readRoutineRunReceipt } from './routine-protocol.mjs';
import {
  appendRunRecord,
  latestRunRecords,
  layout,
  readJson,
  runRecordView,
  safeRelativePath,
  validateSourceContract,
  validateSystemContract,
} from './system-protocol.mjs';

const MAX_CONTEXT_ARTIFACT_BYTES = 4 * 1024 * 1024;
const MAX_RETRIEVAL_RECEIPT_BYTES = 256 * 1024;
const POINTER_RE = /^\/(?:[A-Za-z0-9_.-]+(?:\/[A-Za-z0-9_.-]+)*)?$/;
const RETRIEVAL_RECEIPT_REF_RE = /^retrieval-receipt:(retrieval-receipt-[A-Za-z0-9-]{8,128})$/;
const DOCUMENT_REF_RE = /^document:[A-Za-z0-9][A-Za-z0-9_.-]{0,127}$/;
const SHA256_RE = /^[a-f0-9]{64}$/;
const FORBIDDEN_RECEIPT_KEYS = new Set(['query', 'snippet', 'content', 'raw_error', 'prompt', 'output']);
const RETRIEVAL_RECEIPT_KEYS = new Set([
  'protocol_version',
  'receipt_id',
  'kind',
  'status',
  'decision',
  'reason_code',
  'query_sha256',
  'profile_sha256',
  'started_at',
  'completed_at',
  'latency_ms',
  'adapter_invoked',
  'transport',
  'selected_refs',
  'evidence',
  'privacy',
]);
const RETRIEVAL_EVIDENCE_KEYS = new Set(['candidate_similarity', 'domain_coverage', 'agreement']);
const RETRIEVAL_PRIVACY_KEYS = new Set([
  'query_recorded',
  'snippet_recorded',
  'content_recorded',
  'raw_error_recorded',
  'content_shared_with_inevita',
]);
const ASSURANCE_RANK = new Map([
  ['exported', 0],
  ['receipt-audited', 1],
  ['runtime-enforced', 2],
]);

function inside(root, configured, fallback, boundary) {
  const brain = resolve(root);
  const target = resolve(root, configured || fallback);
  const rel = relative(brain, target);
  if (!rel || rel.startsWith('..') || rel.startsWith(sep)) throw new Error('context-layout-outside-brain');
  const privateBoundary = resolve(root, boundary);
  const privateRel = relative(privateBoundary, target);
  if (!privateRel || privateRel.startsWith('..') || privateRel.startsWith(sep)) {
    throw new Error('context-layout-not-private');
  }
  return target;
}

function contextArtifactDirectory(root) {
  return inside(
    root,
    layout(root).contextArtifacts,
    join('.cerebro', 'runtime', 'context-artifacts'),
    join('.cerebro', 'runtime'),
  );
}

function retrievalReceiptDirectory(root) {
  return inside(
    root,
    layout(root).retrievalReceipts,
    join('.cerebro', 'runtime', 'receipts', 'retrieval'),
    join('.cerebro', 'runtime'),
  );
}

function safeArtifact(root, artifactRef) {
  const ref = safeRelativePath(root, artifactRef, { mustExist: true });
  const path = resolve(root, ref);
  if (lstatSync(path).isSymbolicLink()) throw new Error('context-artifact-symlink-blocked');
  const stat = statSync(path);
  if (!stat.isFile()) throw new Error('context-artifact-not-file');
  if (stat.size < 2 || stat.size > MAX_CONTEXT_ARTIFACT_BYTES) throw new Error('context-artifact-size-invalid');
  const realRoot = realpathSync(root);
  const realPath = realpathSync(path);
  const rel = relative(realRoot, realPath);
  if (!rel || rel.startsWith('..') || rel.startsWith(sep)) throw new Error('context-artifact-outside-brain');
  const bytes = readFileSync(realPath);
  let text;
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    throw new Error('context-artifact-encoding-invalid');
  }
  let value;
  try {
    value = JSON.parse(text);
  } catch {
    throw new Error('context-artifact-json-invalid');
  }
  return { ref, path: realPath, stat, bytes, value };
}

function jsonPointer(value, pointer) {
  if (!POINTER_RE.test(pointer || '')) return { found: false, value: undefined };
  let current = value;
  for (const segment of pointer.slice(1).split('/').filter(Boolean)) {
    if (current === null || typeof current !== 'object' || !(segment in current)) {
      return { found: false, value: undefined };
    }
    current = current[segment];
  }
  return { found: true, value: current };
}

function hasForbiddenReceiptKey(value) {
  if (Array.isArray(value)) return value.some(hasForbiddenReceiptKey);
  if (value === null || typeof value !== 'object') return false;
  return Object.entries(value).some(([key, child]) => (
    FORBIDDEN_RECEIPT_KEYS.has(key) || hasForbiddenReceiptKey(child)
  ));
}

function hasExactKeys(value, keys) {
  if (!value || Array.isArray(value) || typeof value !== 'object') return false;
  const current = Object.keys(value);
  return current.length === keys.size && current.every((key) => keys.has(key));
}

function validNullableNumber(value) {
  return value === null || (typeof value === 'number' && Number.isFinite(value));
}

function safeRetrievalReceipt(root, artifactValue, selection) {
  const resolved = jsonPointer(artifactValue, selection.retrieval_receipt_pointer);
  if (!resolved.found || typeof resolved.value !== 'string') {
    throw new Error('context-retrieval-receipt-ref-missing');
  }
  const match = RETRIEVAL_RECEIPT_REF_RE.exec(resolved.value);
  if (!match) throw new Error('context-retrieval-receipt-ref-invalid');
  const receiptRef = resolved.value;
  const receiptId = match[1];
  const directory = retrievalReceiptDirectory(root);
  if (!existsSync(directory)) throw new Error('context-retrieval-receipt-root-missing');
  if (lstatSync(directory).isSymbolicLink()) throw new Error('context-retrieval-receipt-root-symlink-blocked');
  const path = join(directory, `${receiptId}.json`);
  if (!existsSync(path)) throw new Error('context-retrieval-receipt-missing');
  if (lstatSync(path).isSymbolicLink()) throw new Error('context-retrieval-receipt-symlink-blocked');
  const stat = statSync(path);
  if (!stat.isFile() || stat.size < 2 || stat.size > MAX_RETRIEVAL_RECEIPT_BYTES) {
    throw new Error('context-retrieval-receipt-size-invalid');
  }
  if (process.platform !== 'win32' && (stat.mode & 0o077) !== 0) {
    throw new Error('context-retrieval-receipt-permission-invalid');
  }
  const realDirectory = realpathSync(directory);
  const realPath = realpathSync(path);
  const rel = relative(realDirectory, realPath);
  if (!rel || rel.startsWith('..') || rel.startsWith(sep)) {
    throw new Error('context-retrieval-receipt-outside-runtime');
  }
  let receipt;
  try {
    const bytes = readFileSync(realPath);
    const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    receipt = JSON.parse(text);
  } catch {
    throw new Error('context-retrieval-receipt-json-invalid');
  }
  if (hasForbiddenReceiptKey(receipt)) throw new Error('context-retrieval-receipt-payload-forbidden');
  if (!hasExactKeys(receipt, RETRIEVAL_RECEIPT_KEYS)
    || !hasExactKeys(receipt.evidence, RETRIEVAL_EVIDENCE_KEYS)
    || !hasExactKeys(receipt.privacy, RETRIEVAL_PRIVACY_KEYS)) {
    throw new Error('context-retrieval-receipt-shape-invalid');
  }
  if (receipt.protocol_version !== 1 || receipt.kind !== 'retrieval-receipt'
    || receipt.receipt_id !== receiptId || receipt.transport !== 'gbrain-vector-daemon') {
    throw new Error('context-retrieval-receipt-identity-invalid');
  }
  if (!SHA256_RE.test(receipt.query_sha256 || '') || !SHA256_RE.test(receipt.profile_sha256 || '')
    || receipt.profile_sha256 !== selection.expected_profile_sha256) {
    throw new Error('context-retrieval-receipt-profile-invalid');
  }
  if (!Number.isFinite(Date.parse(receipt.started_at || ''))
    || !Number.isFinite(Date.parse(receipt.completed_at || ''))
    || Date.parse(receipt.completed_at) < Date.parse(receipt.started_at)
    || typeof receipt.latency_ms !== 'number' || !Number.isFinite(receipt.latency_ms)
    || receipt.latency_ms < 0 || typeof receipt.adapter_invoked !== 'boolean') {
    throw new Error('context-retrieval-receipt-time-invalid');
  }
  if (typeof receipt.reason_code !== 'string' || !receipt.reason_code
    || receipt.reason_code.length > 128 || /[\u0000\r\n]/.test(receipt.reason_code)
    || !validNullableNumber(receipt.evidence.candidate_similarity)
    || !validNullableNumber(receipt.evidence.domain_coverage)
    || !validNullableNumber(receipt.evidence.agreement)) {
    throw new Error('context-retrieval-receipt-evidence-invalid');
  }
  const privacy = receipt.privacy;
  if (!privacy || privacy.query_recorded !== false || privacy.snippet_recorded !== false
    || privacy.content_recorded !== false || privacy.raw_error_recorded !== false
    || privacy.content_shared_with_inevita !== false) {
    throw new Error('context-retrieval-receipt-privacy-invalid');
  }
  if (!Array.isArray(receipt.selected_refs)) throw new Error('context-retrieval-receipt-refs-invalid');
  const rankedRefs = [];
  const ranks = new Set();
  for (const item of receipt.selected_refs) {
    if (!hasExactKeys(item, new Set(['rank', 'document_ref']))
      || !Number.isInteger(item.rank) || item.rank < 1 || ranks.has(item.rank)
      || !DOCUMENT_REF_RE.test(item.document_ref || '')) {
      throw new Error('context-retrieval-receipt-refs-invalid');
    }
    ranks.add(item.rank);
    rankedRefs.push(item);
  }
  rankedRefs.sort((left, right) => left.rank - right.rank);
  if (rankedRefs.some((item, index) => item.rank !== index + 1)) {
    throw new Error('context-retrieval-receipt-refs-invalid');
  }
  const selectedRefs = rankedRefs.map((item) => item.document_ref);
  const validState = (
    (receipt.status === 'completed' && receipt.decision === 'accepted' && selectedRefs.length > 0)
    || (receipt.status === 'abstained' && receipt.decision === 'insufficient_evidence' && selectedRefs.length === 0)
    || (receipt.status === 'failed' && receipt.decision === 'retrieval_unavailable' && selectedRefs.length === 0)
  );
  if (!validState) throw new Error('context-retrieval-receipt-state-invalid');
  return { receipt, receiptRef, selectedRefs };
}

function contractFile(root, configured, fallback, id, label) {
  const directory = resolve(root, configured || fallback);
  const rootPath = realpathSync(root);
  const lexicalRel = relative(resolve(root), directory);
  if (!lexicalRel || lexicalRel.startsWith('..') || lexicalRel.startsWith(sep)) {
    throw new Error(`context-${label}-layout-outside-brain`);
  }
  const path = join(directory, `${id}.json`);
  if (!existsSync(path)) throw new Error(`context-${label}-contract-missing`);
  if (lstatSync(path).isSymbolicLink()) throw new Error(`context-${label}-contract-symlink-blocked`);
  const realPath = realpathSync(path);
  const realRel = relative(rootPath, realPath);
  if (!realRel || realRel.startsWith('..') || realRel.startsWith(sep)) {
    throw new Error(`context-${label}-contract-outside-brain`);
  }
  return realPath;
}

function systemContract(root, systemRef) {
  const path = contractFile(
    root,
    layout(root).systemContracts,
    join('.cerebro', 'contracts', 'systems'),
    systemRef,
    'system',
  );
  const contract = readJson(path, 'System Contract');
  const errors = validateSystemContract(contract);
  if (errors.length) throw new Error('context-system-contract-invalid');
  if (contract.system_id !== systemRef) throw new Error('context-system-ref-mismatch');
  return contract;
}

function sourceContract(root, sourceRef) {
  const path = contractFile(
    root,
    layout(root).sourceContracts,
    join('.cerebro', 'contracts', 'sources'),
    sourceRef,
    'source',
  );
  const contract = readJson(path, 'Source Contract');
  const errors = validateSourceContract(contract);
  if (errors.length || contract.source_id !== sourceRef) throw new Error('context-source-contract-invalid');
  return contract;
}

function weakerAssurance(left, right) {
  if (!ASSURANCE_RANK.has(left) || !ASSURANCE_RANK.has(right)) throw new Error('context-assurance-invalid');
  return ASSURANCE_RANK.get(left) <= ASSURANCE_RANK.get(right) ? left : right;
}

function persistArtifact(root, artifact) {
  const digest = createHash('sha256').update(artifact.bytes).digest('hex');
  const artifactId = `sha256-${digest}`;
  const directory = contextArtifactDirectory(root);
  mkdirSync(directory, { recursive: true, mode: 0o700 });
  if (lstatSync(directory).isSymbolicLink()) throw new Error('context-artifact-root-symlink-blocked');
  const privateRuntime = realpathSync(resolve(root, '.cerebro', 'runtime'));
  const realDirectory = realpathSync(directory);
  const directoryRel = relative(privateRuntime, realDirectory);
  if (!directoryRel || directoryRel.startsWith('..') || directoryRel.startsWith(sep)) {
    throw new Error('context-artifact-root-outside-runtime');
  }
  const path = join(directory, `${artifactId}.json`);
  if (existsSync(path)) {
    const current = readFileSync(path);
    if (!current.equals(artifact.bytes)) throw new Error('context-artifact-hash-collision');
  } else {
    const temporary = `${path}.tmp`;
    writeFileSync(temporary, artifact.bytes, { mode: 0o600 });
    renameSync(temporary, path);
  }
  return {
    artifact_id: artifactId,
    artifact_ref: `context-artifact:${artifactId}`,
    artifact_path_ref: relative(resolve(root), path).replaceAll('\\', '/'),
    digest,
  };
}

function freshnessMarker(artifactId, artifactValue, pointer) {
  if (!pointer) return `artifact:${artifactId}`;
  const resolved = jsonPointer(artifactValue, pointer);
  if (!resolved.found || !['string', 'number', 'boolean'].includes(typeof resolved.value)) {
    throw new Error('context-freshness-marker-invalid');
  }
  const value = String(resolved.value);
  if (!value || value.length > 128 || /[\u0000\r\n]/.test(value)) throw new Error('context-freshness-marker-invalid');
  return `observed:${value}`;
}

export function prepareContextSnapshot(root, routineContract, accessResults) {
  const system = systemContract(root, routineContract.system_ref);
  if (system.protocol_version !== 2) {
    return { status: 'not-declared', system, input_refs: [] };
  }
  const preparation = routineContract.extensions?.preparation;
  const selections = preparation?.source_selections;
  if (!preparation || !Array.isArray(selections) || selections.length === 0) {
    throw new Error('context-selection-not-declared');
  }
  const artifact = safeArtifact(root, preparation.output_ref);
  const stored = persistArtifact(root, artifact);
  const selectionBySource = new Map(selections.map((item) => [item.source_ref, item]));
  if (selectionBySource.size !== selections.length) throw new Error('context-selection-duplicate');
  const declaredSources = new Set(system.sources.map((source) => source.source_id));
  if (selections.some((item) => !declaredSources.has(item.source_ref))) {
    throw new Error('context-selection-source-unknown');
  }
  const accessBySource = new Map(accessResults.map((item) => [item.source_ref, item]));
  const retrievalByRole = new Map(system.retrieval.source_roles.map((item) => [item.role, item]));
  const accesses = [];
  const gaps = [];
  const retrievalReceiptRefs = [];

  for (const source of system.sources) {
    const selection = selectionBySource.get(source.source_id);
    const retrieval = retrievalByRole.get(source.role);
    const access = accessBySource.get(source.source_id);
    if (!retrieval) throw new Error('context-retrieval-role-missing');
    if (!access) {
      if (source.required) throw new Error('context-access-missing');
      gaps.push({ source_role: source.role, reason_code: 'access-missing', detail_ref: null });
      continue;
    }
    if (!selection) {
      if (source.required) throw new Error('context-required-selection-missing');
      gaps.push({ source_role: source.role, reason_code: 'selection-missing', detail_ref: null });
      continue;
    }
    const sourceValue = sourceContract(root, source.source_id);
    if (selection.retrieval_receipt_pointer) {
      const retrievalReceipt = safeRetrievalReceipt(root, artifact.value, selection);
      retrievalReceiptRefs.push(retrievalReceipt.receiptRef);
      if (retrievalReceipt.receipt.decision !== 'accepted') {
        const reasonCode = retrievalReceipt.receipt.decision === 'insufficient_evidence'
          ? 'insufficient-evidence'
          : 'retrieval-unavailable';
        if (source.required) throw new Error(`context-required-${reasonCode}`);
        gaps.push({
          source_role: source.role,
          reason_code: reasonCode,
          detail_ref: retrievalReceipt.receiptRef,
        });
        continue;
      }
      accesses.push({
        source_ref: { role: source.role, id: source.source_id },
        selected_refs: retrievalReceipt.selectedRefs,
        query: `${retrievalReceipt.receiptRef}:query-sha256:${retrievalReceipt.receipt.query_sha256}`,
        filters: retrieval.filters,
        window: retrieval.window,
        freshness_marker: `observed:${retrievalReceipt.receipt.completed_at}`,
        assurance: weakerAssurance(
          weakerAssurance(sourceValue.assurance, access.assurance),
          'receipt-audited',
        ),
      });
      continue;
    }
    const selectedRefs = [];
    for (const pointer of selection.selected_pointers) {
      if (!jsonPointer(artifact.value, pointer).found) {
        if (source.required) throw new Error('context-required-pointer-missing');
        continue;
      }
      selectedRefs.push(`${stored.artifact_ref}:json-pointer:${pointer}`);
    }
    if (selectedRefs.length === 0) {
      if (source.required) throw new Error('context-required-selection-empty');
      gaps.push({ source_role: source.role, reason_code: 'selection-empty', detail_ref: null });
      continue;
    }
    accesses.push({
      source_ref: { role: source.role, id: source.source_id },
      selected_refs: selectedRefs,
      query: `selection:${retrieval.selection}:${source.role}`,
      filters: retrieval.filters,
      window: retrieval.window,
      freshness_marker: freshnessMarker(stored.artifact_id, artifact.value, selection.freshness_pointer),
      assurance: weakerAssurance(sourceValue.assurance, access.assurance),
    });
  }

  const requiredAccesses = system.sources.filter((source) => source.required).length;
  if (accesses.length < requiredAccesses) throw new Error('context-required-sources-incomplete');
  const observedAt = new Date(artifact.stat.mtimeMs);
  if (!Number.isFinite(observedAt.getTime())) throw new Error('context-observed-at-invalid');
  return {
    status: 'recorded',
    system,
    source_refs: accesses.map((item) => item.source_ref),
    context_snapshot: {
      system_contract_version: system.version,
      retrieval_version: system.retrieval.version,
      observed_at: observedAt.toISOString(),
      accesses,
      gaps,
      fallbacks: [],
      conflicts: [],
    },
    artifact_ref: stored.artifact_ref,
    artifact_path_ref: stored.artifact_path_ref,
    input_refs: [stored.artifact_ref, ...new Set(retrievalReceiptRefs)],
  };
}

export function appendCompletedRunRecord(root, routineContract, context, {
  runId,
  receiptId,
  startedAt,
  completedAt,
  outputRef,
  accessReceiptRefs,
  correctionRef = null,
  evaluation = null,
  executionTraceRef = null,
  skillLoadRefs = [],
  chainId = null,
  mode = null,
  experimentRef = null,
  handoffRefs = [],
}) {
  if (context.status !== 'recorded') return null;
  const system = context.system;
  const record = {
    protocol_version: 2,
    run_id: runId,
    chain_id: chainId,
    mode,
    experiment_ref: experimentRef,
    handoff_refs: handoffRefs,
    system_id: system.system_id,
    system_version: system.version,
    capability: {
      capability_id: system.capability.capability_id,
      version: system.capability.version,
    },
    status: 'completed',
    started_at: startedAt.toISOString(),
    completed_at: completedAt.toISOString(),
    entity_refs: [],
    source_refs: context.source_refs,
    output_refs: [outputRef],
    context_snapshot: context.context_snapshot,
    eval: { version: system.eval.version, passed: evaluation?.passed ?? null },
    human_decision: 'pending',
    correction_ref: correctionRef,
    outcomes: [],
    privacy: { content_shared_with_inevita: false },
    extensions: {
      routine_ref: `routine:${routineContract.routine_id}:${routineContract.version}`,
      routine_receipt_ref: `routine-receipt:${receiptId}`,
      context_artifact_ref: context.artifact_ref,
      access_receipt_refs: accessReceiptRefs,
      execution_trace_ref: executionTraceRef,
      skill_load_refs: skillLoadRefs,
      evaluation: evaluation ? {
        status: evaluation.status,
        evaluator_ref: evaluation.evaluator_ref,
        evidence_ref: evaluation.evidence_ref,
        gate_results: evaluation.gate_results,
      } : null,
    },
  };
  appendRunRecord(root, record);
  return { record, ref: `run-record:${record.run_id}` };
}

export function readRoutineRunContext(root, receiptId) {
  const receipt = readRoutineRunReceipt(root, `routine-receipt:${receiptId}`);
  const record = latestRunRecords(root).find((item) => item.run_id === receipt.run_id);
  if (!record) throw new Error('context-not-recorded');
  if (record.extensions?.routine_receipt_ref !== `routine-receipt:${receipt.receipt_id}`) {
    throw new Error('context-receipt-link-mismatch');
  }
  const view = runRecordView(record);
  if (view.context_status !== 'recorded') throw new Error('context-not-recorded');
  return {
    run_record_ref: `run-record:${record.run_id}`,
    routine_receipt_ref: `routine-receipt:${receipt.receipt_id}`,
    run_id: record.run_id,
    system_ref: record.system_id,
    system_version: record.system_version,
    human_decision: record.human_decision,
    context_snapshot: view.context_snapshot,
    privacy: {
      content_shared_with_inevita: false,
      artifact_content_exposed: false,
      model_executed: false,
      explicit_local_read: true,
    },
  };
}
