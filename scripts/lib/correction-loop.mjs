import { randomUUID } from 'node:crypto';
import {
  closeSync,
  existsSync,
  lstatSync,
  mkdirSync,
  openSync,
  readdirSync,
  realpathSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { currentJudgment, readPrivateRoutineOutput } from './judgment-protocol.mjs';
import { runRoutine } from './routine-runtime.mjs';
import { readRoutineRunReceipt } from './routine-protocol.mjs';
import {
  ID_RE,
  REF_ID_RE,
  layout,
  readJson,
  writeJsonAtomic,
} from './system-protocol.mjs';

const LOCAL_REF_RE = /^(?!\.?\.?$)(?!\.?\.?\/)(?!.*\/\.\.(?:\/|$))[A-Za-z0-9.][A-Za-z0-9_./:-]{0,255}$/;
const TERMINAL_STATUSES = new Set(['completed', 'failed', 'denied', 'skipped']);

function object(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function closed(errors, value, path, keys) {
  if (!object(value)) return;
  const allowed = new Set(keys);
  for (const key of Object.keys(value)) if (!allowed.has(key)) errors.push(`${path}.${key} não é permitido`);
}

function validDate(value) {
  return Number.isFinite(Date.parse(value || ''));
}

function privateDirectory(root, configured, fallback, label) {
  const brain = resolve(root);
  const runtime = resolve(root, '.cerebro', 'runtime');
  const target = resolve(root, configured || fallback);
  if (target === brain || !target.startsWith(`${brain}${sep}`)) throw new Error(`${label}-layout-outside-brain`);
  if (target === runtime || !target.startsWith(`${runtime}${sep}`)) throw new Error(`${label}-layout-not-private`);
  if (!existsSync(runtime)) throw new Error(`${label}-runtime-missing`);
  const realBrain = realpathSync(brain);
  const realRuntime = realpathSync(runtime);
  const runtimeRel = relative(realBrain, realRuntime);
  if (!runtimeRel || runtimeRel.startsWith('..') || runtimeRel.startsWith(sep)) throw new Error(`${label}-runtime-outside-brain`);
  let existing = target;
  while (!existsSync(existing)) {
    const parent = resolve(existing, '..');
    if (parent === existing) throw new Error(`${label}-storage-parent-missing`);
    existing = parent;
  }
  if (lstatSync(existing).isSymbolicLink()) throw new Error(`${label}-storage-symlink-blocked`);
  const realExisting = realpathSync(existing);
  const rel = relative(realRuntime, realExisting);
  if (realExisting !== realRuntime && (!rel || rel.startsWith('..') || rel.startsWith(sep))) {
    throw new Error(`${label}-storage-outside-runtime`);
  }
  return target;
}

function correctionDirectory(root) {
  return privateDirectory(
    root,
    layout(root).routineCorrections,
    join('.cerebro', 'runtime', 'corrections'),
    'correction',
  );
}

function learningDirectory(root) {
  return privateDirectory(
    root,
    layout(root).learningCandidates,
    join('.cerebro', 'runtime', 'learning-candidates'),
    'learning',
  );
}

function referenceOnly(errors, value, path) {
  const serialized = JSON.stringify(value);
  if (/"(?:prompt|output|note|raw_error|token|api_key|oauth)"\s*:/i.test(serialized)) {
    errors.push(`${path} contém conteúdo ou credencial`);
  }
}

export function validateCorrectionRunReceipt(value) {
  const errors = [];
  if (!object(value)) return ['correction run receipt precisa ser objeto'];
  closed(errors, value, 'correction_run_receipt', [
    'protocol_version', 'correction_id', 'baseline_routine_receipt_ref',
    'correction_judgment_ref', 'resulting_routine_receipt_ref', 'routine_id',
    'system_ref', 'requested_by', 'requested_at', 'completed_at', 'status',
    'reason_code', 'privacy',
  ]);
  if (value.protocol_version !== 1) errors.push('protocol_version precisa ser 1');
  if (!REF_ID_RE.test(value.correction_id || '')) errors.push('correction_id inválido');
  for (const field of [
    'baseline_routine_receipt_ref', 'correction_judgment_ref', 'resulting_routine_receipt_ref',
  ]) if (!LOCAL_REF_RE.test(value[field] || '')) errors.push(`${field} inválido`);
  if (!String(value.baseline_routine_receipt_ref || '').startsWith('routine-receipt:')) errors.push('baseline precisa ser Routine Run Receipt');
  if (!String(value.correction_judgment_ref || '').startsWith('judgment-receipt:')) errors.push('correção precisa ser Judgment Receipt');
  if (!String(value.resulting_routine_receipt_ref || '').startsWith('routine-receipt:')) errors.push('resultado precisa ser Routine Run Receipt');
  if (!ID_RE.test(value.routine_id || '')) errors.push('routine_id inválido');
  if (!ID_RE.test(value.system_ref || '')) errors.push('system_ref inválido');
  if (!REF_ID_RE.test(value.requested_by || '')) errors.push('requested_by inválido');
  if (!validDate(value.requested_at)) errors.push('requested_at inválido');
  if (!validDate(value.completed_at)) errors.push('completed_at inválido');
  if (validDate(value.requested_at) && validDate(value.completed_at)
    && Date.parse(value.completed_at) < Date.parse(value.requested_at)) errors.push('completed_at anterior ao pedido');
  if (!TERMINAL_STATUSES.has(value.status)) errors.push('status inválido');
  if (!ID_RE.test(value.reason_code || '')) errors.push('reason_code inválido');
  if (!object(value.privacy)) errors.push('privacy precisa ser objeto');
  else {
    closed(errors, value.privacy, 'privacy', [
      'content_shared_with_inevita', 'prompt_recorded', 'output_recorded',
      'judgment_note_recorded', 'correction_shared_with_provider', 'external_action_executed',
    ]);
    if (value.privacy.content_shared_with_inevita !== false) errors.push('conteúdo não pode ir à INEVITA');
    if (value.privacy.prompt_recorded !== false) errors.push('prompt não pode entrar no recibo');
    if (value.privacy.output_recorded !== false) errors.push('output não pode entrar no recibo');
    if (value.privacy.judgment_note_recorded !== false) errors.push('nota não pode entrar no recibo');
    if (typeof value.privacy.correction_shared_with_provider !== 'boolean') errors.push('fronteira do provider inválida');
    if (value.privacy.external_action_executed !== false) errors.push('correção não executa ação externa');
  }
  referenceOnly(errors, value, 'correction_run_receipt');
  return [...new Set(errors)];
}

export function validateLearningCandidate(value) {
  const errors = [];
  if (!object(value)) return ['learning candidate precisa ser objeto'];
  closed(errors, value, 'learning_candidate', [
    'protocol_version', 'candidate_id', 'learning_type', 'system_ref', 'routine_id',
    'source_correction_ref', 'evidence_run_ref', 'approval_judgment_ref', 'status',
    'occurrences', 'promotion_threshold', 'replay_status', 'created_by', 'created_at', 'privacy',
  ]);
  if (value.protocol_version !== 1) errors.push('protocol_version precisa ser 1');
  if (!REF_ID_RE.test(value.candidate_id || '')) errors.push('candidate_id inválido');
  if (value.learning_type !== 'correction-candidate') errors.push('learning_type inválido');
  if (!ID_RE.test(value.system_ref || '')) errors.push('system_ref inválido');
  if (!ID_RE.test(value.routine_id || '')) errors.push('routine_id inválido');
  for (const field of ['source_correction_ref', 'evidence_run_ref', 'approval_judgment_ref']) {
    if (!LOCAL_REF_RE.test(value[field] || '')) errors.push(`${field} inválido`);
  }
  if (!String(value.source_correction_ref || '').startsWith('correction-run:')) errors.push('source_correction_ref inválido');
  if (!String(value.evidence_run_ref || '').startsWith('routine-receipt:')) errors.push('evidence_run_ref inválido');
  if (!String(value.approval_judgment_ref || '').startsWith('judgment-receipt:')) errors.push('approval_judgment_ref inválido');
  if (value.status !== 'candidate') errors.push('status precisa ser candidate');
  if (value.occurrences !== 1) errors.push('primeiro candidato precisa nascer com 1 ocorrência');
  if (!Number.isInteger(value.promotion_threshold) || value.promotion_threshold < 3) errors.push('promotion_threshold precisa ser >= 3');
  if (value.replay_status !== 'not-eligible') errors.push('primeiro candidato ainda não é elegível para replay');
  if (!REF_ID_RE.test(value.created_by || '')) errors.push('created_by inválido');
  if (!validDate(value.created_at)) errors.push('created_at inválido');
  if (!object(value.privacy)) errors.push('privacy precisa ser objeto');
  else {
    closed(errors, value.privacy, 'privacy', [
      'content_shared_with_inevita', 'correction_recorded', 'output_recorded',
      'motor_changed', 'external_action_executed',
    ]);
    for (const field of [
      'content_shared_with_inevita', 'correction_recorded', 'output_recorded',
      'motor_changed', 'external_action_executed',
    ]) if (value.privacy[field] !== false) errors.push(`privacy.${field} precisa ser false`);
  }
  referenceOnly(errors, value, 'learning_candidate');
  return [...new Set(errors)];
}

function readCorrection(path) {
  if (lstatSync(path).isSymbolicLink()) throw new Error('correction-receipt-symlink-blocked');
  const value = readJson(path, 'Correction Run Receipt');
  const errors = validateCorrectionRunReceipt(value);
  if (errors.length) throw new Error('correction-receipt-invalid');
  return value;
}

function readCandidate(path) {
  if (lstatSync(path).isSymbolicLink()) throw new Error('learning-candidate-symlink-blocked');
  const value = readJson(path, 'Learning Candidate');
  const errors = validateLearningCandidate(value);
  if (errors.length) throw new Error('learning-candidate-invalid');
  return value;
}

export function listCorrectionRunReceipts(root) {
  const directory = correctionDirectory(root);
  if (!existsSync(directory)) return [];
  return readdirSync(directory).filter((name) => name.endsWith('.json')).sort()
    .map((name) => readCorrection(join(directory, name)))
    .sort((left, right) => Date.parse(left.requested_at) - Date.parse(right.requested_at));
}

export function listLearningCandidates(root) {
  const directory = learningDirectory(root);
  if (!existsSync(directory)) return [];
  return readdirSync(directory).filter((name) => name.endsWith('.json')).sort()
    .map((name) => readCandidate(join(directory, name)))
    .sort((left, right) => Date.parse(left.created_at) - Date.parse(right.created_at));
}

function correctionForResult(root, receiptId) {
  const ref = `routine-receipt:${receiptId}`;
  return listCorrectionRunReceipts(root).find((item) => item.resulting_routine_receipt_ref === ref) || null;
}

function candidateForCorrection(root, correctionId) {
  const ref = `correction-run:${correctionId}`;
  return listLearningCandidates(root).find((item) => item.source_correction_ref === ref) || null;
}

export function correctionView(root, receiptId) {
  const receiptRef = `routine-receipt:${receiptId}`;
  const all = listCorrectionRunReceipts(root);
  const asResult = all.find((item) => item.resulting_routine_receipt_ref === receiptRef) || null;
  const asBaseline = all.filter((item) => item.baseline_routine_receipt_ref === receiptRef).at(-1) || null;
  const correction = asResult || asBaseline;
  if (!correction) return null;
  const candidate = candidateForCorrection(root, correction.correction_id);
  return {
    role: asResult ? 'candidate' : 'baseline',
    correction_ref: `correction-run:${correction.correction_id}`,
    baseline_receipt_ref: correction.baseline_routine_receipt_ref,
    resulting_receipt_ref: correction.resulting_routine_receipt_ref,
    correction_judgment_ref: correction.correction_judgment_ref,
    status: correction.status,
    comparison_available: correction.status === 'completed',
    learning_candidate: candidate ? {
      candidate_ref: `learning-candidate:${candidate.candidate_id}`,
      status: candidate.status,
      occurrences: candidate.occurrences,
      promotion_threshold: candidate.promotion_threshold,
      replay_status: candidate.replay_status,
      motor_changed: candidate.privacy.motor_changed,
    } : null,
  };
}

export function correctionActions(root, receiptId) {
  const judgment = currentJudgment(root, receiptId);
  const all = listCorrectionRunReceipts(root);
  const alreadyUsed = judgment
    ? all.some((item) => item.correction_judgment_ref === `judgment-receipt:${judgment.judgment_id}`)
    : false;
  const correction = correctionForResult(root, receiptId);
  const candidate = correction ? candidateForCorrection(root, correction.correction_id) : null;
  return {
    can_rerun_with_correction: Boolean(judgment?.verdict === 'changes-requested' && judgment.note.trim() && !alreadyUsed),
    can_compare: correction?.status === 'completed',
    can_create_learning_candidate: Boolean(correction?.status === 'completed' && judgment?.verdict === 'approved' && !candidate),
  };
}

function correctionPrompt(note) {
  return [
    '',
    '---',
    '## Correção humana privada para este replay',
    'Aplique a correção abaixo ao resultado desta execução. Preserve fatos, proveniência, gates e limites do contrato original.',
    'Não execute ação externa. Não trate esta correção isolada como mudança estável do Sistema.',
    '<human-correction>',
    note,
    '</human-correction>',
    'Entregue um novo output completo, pronto para comparação e novo julgamento humano.',
    '',
  ].join('\n');
}

function clockDate(clock) {
  const value = typeof clock === 'function' ? clock() : clock;
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) throw new Error('clock-invalid');
  return date;
}

function acquireMutationLock(directory, id, now, label) {
  const lockDirectory = join(directory, '.locks');
  mkdirSync(lockDirectory, { recursive: true, mode: 0o700 });
  const path = join(lockDirectory, `${id}.lock`);
  try {
    const descriptor = openSync(path, 'wx', 0o600);
    writeFileSync(descriptor, `${now.toISOString()}\n`);
    closeSync(descriptor);
    return { path };
  } catch (error) {
    if (error?.code !== 'EEXIST') throw error;
    try {
      if (now.getTime() - statSync(path).mtimeMs > 60 * 60 * 1000) {
        unlinkSync(path);
        return acquireMutationLock(directory, id, now, label);
      }
    } catch (statError) {
      if (statError?.code === 'ENOENT') return acquireMutationLock(directory, id, now, label);
      throw statError;
    }
    throw new Error(`${label}-in-progress`);
  }
}

function releaseMutationLock(lock) {
  try { unlinkSync(lock.path); } catch { /* O recibo terminal continua sendo a verdade. */ }
}

export async function rerunWithCorrection(root, baselineReceiptId, actorRef, {
  clock = () => new Date(),
  randomId = () => `correction-${randomUUID()}`,
  ...runOptions
} = {}) {
  if (!REF_ID_RE.test(baselineReceiptId || '')) throw new Error('receipt-id-invalid');
  if (!REF_ID_RE.test(actorRef || '')) throw new Error('approved-by-invalid');
  const baseline = readRoutineRunReceipt(root, `routine-receipt:${baselineReceiptId}`);
  if (baseline.status !== 'completed' || !baseline.output_ref) throw new Error('baseline-output-not-available');
  const judgment = currentJudgment(root, baselineReceiptId);
  if (!judgment || judgment.verdict !== 'changes-requested' || !judgment.note.trim()) {
    throw new Error('correction-judgment-required');
  }
  const judgmentRef = `judgment-receipt:${judgment.judgment_id}`;
  const requestedAt = clockDate(clock);
  const directory = correctionDirectory(root);
  const lock = acquireMutationLock(directory, judgment.judgment_id, requestedAt, 'correction-rerun');
  try {
    if (listCorrectionRunReceipts(root).some((item) => item.correction_judgment_ref === judgmentRef)) {
      throw new Error('correction-already-rerun');
    }
    const result = await runRoutine(root, baseline.routine_id, {
      ...runOptions,
      trigger: 'manual',
      clock,
      supplementalPrompt: correctionPrompt(judgment.note),
      supplementalInputRefs: [judgmentRef],
    });
    const value = {
      protocol_version: 1,
      correction_id: randomId(),
      baseline_routine_receipt_ref: `routine-receipt:${baselineReceiptId}`,
      correction_judgment_ref: judgmentRef,
      resulting_routine_receipt_ref: result.receipt_ref,
      routine_id: baseline.routine_id,
      system_ref: baseline.system_ref,
      requested_by: actorRef,
      requested_at: requestedAt.toISOString(),
      completed_at: clockDate(clock).toISOString(),
      status: result.receipt.status,
      reason_code: result.receipt.reason_code,
      privacy: {
        content_shared_with_inevita: false,
        prompt_recorded: false,
        output_recorded: false,
        judgment_note_recorded: false,
        correction_shared_with_provider: result.receipt.content_shared_with_provider,
        external_action_executed: false,
      },
    };
    const errors = validateCorrectionRunReceipt(value);
    if (errors.length) throw new Error('correction-receipt-invalid');
    const path = join(directory, `${value.correction_id}.json`);
    if (existsSync(path)) throw new Error('correction-receipt-already-exists');
    writeJsonAtomic(path, value);
    return { status: result.status, correction: value, correction_ref: `correction-run:${value.correction_id}`, result };
  } finally {
    releaseMutationLock(lock);
  }
}

export function readCorrectionComparison(root, correctedReceiptId) {
  const correction = correctionForResult(root, correctedReceiptId);
  if (!correction || correction.status !== 'completed') throw new Error('correction-comparison-not-available');
  const baselineId = correction.baseline_routine_receipt_ref.slice('routine-receipt:'.length);
  const resultId = correction.resulting_routine_receipt_ref.slice('routine-receipt:'.length);
  const baseline = readPrivateRoutineOutput(root, baselineId);
  const candidate = readPrivateRoutineOutput(root, resultId);
  return {
    correction: correctionView(root, correctedReceiptId),
    baseline: { receipt: baseline.receipt, output: baseline.output },
    candidate: { receipt: candidate.receipt, output: candidate.output },
    privacy: {
      content_shared_with_inevita: false,
      outputs_in_console_read_model: false,
      explicit_local_read: true,
      model_executed: false,
    },
  };
}

export function createLearningCandidate(root, correctedReceiptId, actorRef, {
  clock = () => new Date(),
  randomId = () => `learning-${randomUUID()}`,
} = {}) {
  if (!REF_ID_RE.test(correctedReceiptId || '')) throw new Error('receipt-id-invalid');
  if (!REF_ID_RE.test(actorRef || '')) throw new Error('approved-by-invalid');
  const correction = correctionForResult(root, correctedReceiptId);
  if (!correction || correction.status !== 'completed') throw new Error('completed-correction-required');
  const judgment = currentJudgment(root, correctedReceiptId);
  if (!judgment || judgment.verdict !== 'approved') throw new Error('approved-correction-required');
  const createdAt = clockDate(clock);
  const directory = learningDirectory(root);
  const lock = acquireMutationLock(directory, correction.correction_id, createdAt, 'learning-candidate');
  try {
    const existing = candidateForCorrection(root, correction.correction_id);
    if (existing) return { status: 'no-change', value: existing, ref: `learning-candidate:${existing.candidate_id}` };
    const value = {
      protocol_version: 1,
      candidate_id: randomId(),
      learning_type: 'correction-candidate',
      system_ref: correction.system_ref,
      routine_id: correction.routine_id,
      source_correction_ref: `correction-run:${correction.correction_id}`,
      evidence_run_ref: correction.resulting_routine_receipt_ref,
      approval_judgment_ref: `judgment-receipt:${judgment.judgment_id}`,
      status: 'candidate',
      occurrences: 1,
      promotion_threshold: 3,
      replay_status: 'not-eligible',
      created_by: actorRef,
      created_at: createdAt.toISOString(),
      privacy: {
        content_shared_with_inevita: false,
        correction_recorded: false,
        output_recorded: false,
        motor_changed: false,
        external_action_executed: false,
      },
    };
    const errors = validateLearningCandidate(value);
    if (errors.length) throw new Error('learning-candidate-invalid');
    const path = join(directory, `${value.candidate_id}.json`);
    if (existsSync(path)) throw new Error('learning-candidate-already-exists');
    writeJsonAtomic(path, value);
    return { status: 'created', value, ref: `learning-candidate:${value.candidate_id}`, path };
  } finally {
    releaseMutationLock(lock);
  }
}
