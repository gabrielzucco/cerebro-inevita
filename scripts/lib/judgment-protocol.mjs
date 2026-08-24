import { randomUUID } from 'node:crypto';
import {
  existsSync,
  lstatSync,
  readFileSync,
  readdirSync,
  realpathSync,
  statSync,
} from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import {
  ID_RE,
  REF_ID_RE,
  layout,
  readJson,
  writeJsonAtomic,
} from './system-protocol.mjs';
import {
  readRoutineRunReceipt,
  routineOutputDirectory,
} from './routine-protocol.mjs';

export const MAX_PRIVATE_OUTPUT_BYTES = 512 * 1024;
export const MAX_JUDGMENT_NOTE_CHARS = 2000;

const VERDICTS = new Set(['approved', 'changes-requested', 'rejected']);
const ACTION_INTENTS = new Set(['none', 'propose-action']);
const LOCAL_REF_RE = /^(?!\.?\.?$)(?!\.\.?\/)(?!.*\/\.\.(?:\/|$))[A-Za-z0-9.][A-Za-z0-9_./:-]{0,255}$/;
const SECRET_RE = /Bearer\s+|-----BEGIN .*PRIVATE KEY-----|\b(?:sk|ghp|xoxb)[-_A-Za-z0-9]{12,}/i;

function object(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function closed(errors, value, path, keys) {
  if (!object(value)) return;
  const allowed = new Set(keys);
  for (const key of Object.keys(value)) if (!allowed.has(key)) errors.push(`${path}.${key} não é permitido`);
}

function insideRealDirectory(parent, child) {
  const rel = relative(parent, child);
  return Boolean(rel) && !rel.startsWith('..') && !rel.startsWith(sep);
}

function nearestExistingPath(path) {
  let current = path;
  while (!existsSync(current)) {
    const parent = dirname(current);
    if (parent === current) throw new Error('private-storage-parent-missing');
    current = parent;
  }
  return current;
}

function safePrivateDirectory(root) {
  const brain = resolve(root);
  const privateRoot = resolve(root, '.cerebro', 'runtime');
  const target = resolve(root, layout(root).routineJudgments || join('.cerebro', 'runtime', 'judgments'));
  if (target === brain || !target.startsWith(`${brain}${sep}`)) throw new Error('judgment-layout-outside-brain');
  if (target === privateRoot || !target.startsWith(`${privateRoot}${sep}`)) throw new Error('judgment-layout-not-private');
  if (!existsSync(privateRoot)) throw new Error('judgment-runtime-missing');
  const realBrain = realpathSync(brain);
  const realPrivateRoot = realpathSync(privateRoot);
  if (!insideRealDirectory(realBrain, realPrivateRoot)) throw new Error('judgment-runtime-outside-brain');
  const existing = nearestExistingPath(target);
  if (lstatSync(existing).isSymbolicLink()) throw new Error('judgment-storage-symlink-blocked');
  const realExisting = realpathSync(existing);
  if (realExisting !== realPrivateRoot && !insideRealDirectory(realPrivateRoot, realExisting)) {
    throw new Error('judgment-storage-outside-runtime');
  }
  return target;
}

function judgmentDirectory(root, receiptId) {
  if (!REF_ID_RE.test(receiptId || '')) throw new Error('receipt-id-invalid');
  return join(safePrivateDirectory(root), receiptId);
}

export function validateJudgmentReceipt(value) {
  const errors = [];
  if (!object(value)) return ['judgment receipt precisa ser objeto'];
  closed(errors, value, 'judgment_receipt', [
    'protocol_version', 'judgment_id', 'routine_receipt_ref', 'receipt_id', 'routine_id',
    'run_id', 'verdict', 'action_intent', 'note', 'actor_ref', 'decided_at', 'privacy',
  ]);
  if (value.protocol_version !== 1) errors.push('protocol_version precisa ser 1');
  if (!REF_ID_RE.test(value.judgment_id || '')) errors.push('judgment_id inválido');
  if (!LOCAL_REF_RE.test(value.routine_receipt_ref || '')) errors.push('routine_receipt_ref inválido');
  if (!REF_ID_RE.test(value.receipt_id || '')) errors.push('receipt_id inválido');
  if (value.routine_receipt_ref !== `routine-receipt:${value.receipt_id}`) errors.push('routine_receipt_ref diverge de receipt_id');
  if (!ID_RE.test(value.routine_id || '')) errors.push('routine_id inválido');
  if (!REF_ID_RE.test(value.run_id || '')) errors.push('run_id inválido');
  if (!VERDICTS.has(value.verdict)) errors.push('verdict inválido');
  if (!ACTION_INTENTS.has(value.action_intent)) errors.push('action_intent inválido');
  if (value.action_intent === 'propose-action' && value.verdict !== 'approved') {
    errors.push('propose-action exige verdict approved');
  }
  if (typeof value.note !== 'string' || value.note.length > MAX_JUDGMENT_NOTE_CHARS) errors.push('note inválida');
  if ((value.verdict !== 'approved' || value.action_intent === 'propose-action') && !String(value.note || '').trim()) {
    errors.push('note obrigatória para mudança, rejeição ou intenção de ação');
  }
  if (/\u0000|\r/.test(value.note || '')) errors.push('note contém controle inválido');
  if (SECRET_RE.test(value.note || '')) errors.push('note parece conter segredo');
  if (!REF_ID_RE.test(value.actor_ref || '')) errors.push('actor_ref inválido');
  if (!Number.isFinite(Date.parse(value.decided_at || ''))) errors.push('decided_at inválido');
  if (!object(value.privacy)) errors.push('privacy precisa ser objeto');
  else {
    closed(errors, value.privacy, 'privacy', [
      'content_shared_with_inevita', 'output_recorded', 'note_private', 'external_action_executed',
    ]);
    if (value.privacy.content_shared_with_inevita !== false) errors.push('conteúdo não pode ir à INEVITA');
    if (value.privacy.output_recorded !== false) errors.push('Judgment Receipt não grava output');
    if (value.privacy.note_private !== true) errors.push('nota precisa permanecer privada');
    if (value.privacy.external_action_executed !== false) errors.push('julgamento não executa ação externa');
  }
  const serialized = JSON.stringify(value);
  if (/"(?:prompt|output|raw_error|token|api_key|oauth)"\s*:/i.test(serialized.replace('"output_recorded":false', ''))) {
    errors.push('Judgment Receipt contém payload ou credencial');
  }
  return [...new Set(errors)];
}

function readValidatedJudgment(path) {
  const value = readJson(path, 'Judgment Receipt');
  const errors = validateJudgmentReceipt(value);
  if (errors.length) throw new Error(`judgment-receipt-invalid`);
  return value;
}

export function listJudgmentReceipts(root, receiptId) {
  const directory = judgmentDirectory(root, receiptId);
  if (!existsSync(directory)) return [];
  return readdirSync(directory)
    .filter((name) => name.endsWith('.json'))
    .sort()
    .map((name) => readValidatedJudgment(join(directory, name)))
    .sort((left, right) => Date.parse(left.decided_at) - Date.parse(right.decided_at)
      || left.judgment_id.localeCompare(right.judgment_id));
}

export function currentJudgment(root, receiptId) {
  const history = listJudgmentReceipts(root, receiptId);
  return history.at(-1) || null;
}

function judgmentSummary(value, historyCount = 0) {
  if (!value) return { status: 'pending', verdict: null, action_intent: 'none', actor_ref: null, decided_at: null, history_count: 0 };
  return {
    status: 'decided',
    verdict: value.verdict,
    action_intent: value.action_intent,
    actor_ref: value.actor_ref,
    decided_at: value.decided_at,
    history_count: historyCount,
  };
}

function receiptForOutput(root, receiptId) {
  if (!REF_ID_RE.test(receiptId || '')) throw new Error('receipt-id-invalid');
  let receipt;
  try {
    receipt = readRoutineRunReceipt(root, `routine-receipt:${receiptId}`);
  } catch {
    throw new Error('routine-receipt-not-found');
  }
  if (receipt.status !== 'completed' || !receipt.output_ref) throw new Error('output-not-available');
  return receipt;
}

export function readPrivateRoutineOutput(root, receiptId) {
  const receipt = receiptForOutput(root, receiptId);
  const outputRoot = routineOutputDirectory(root);
  const outputPath = resolve(root, receipt.output_ref);
  const rel = relative(outputRoot, outputPath);
  if (!rel || rel.startsWith('..') || rel.startsWith(sep)) throw new Error('output-outside-runtime');
  if (!existsSync(outputRoot) || !existsSync(outputPath)) throw new Error('output-not-found');
  if (lstatSync(outputRoot).isSymbolicLink()) throw new Error('output-root-symlink-blocked');
  if (lstatSync(outputPath).isSymbolicLink()) throw new Error('output-symlink-blocked');
  const realBrain = realpathSync(resolve(root));
  const realRoot = realpathSync(outputRoot);
  if (!insideRealDirectory(realBrain, realRoot)) throw new Error('output-root-outside-brain');
  const realOutput = realpathSync(outputPath);
  const realRel = relative(realRoot, realOutput);
  if (!realRel || realRel.startsWith('..') || realRel.startsWith(sep)) throw new Error('output-outside-runtime');
  const details = statSync(realOutput);
  if (!details.isFile()) throw new Error('output-not-file');
  if (details.size > MAX_PRIVATE_OUTPUT_BYTES) throw new Error('output-too-large');
  const bytes = readFileSync(realOutput);
  if (bytes.includes(0)) throw new Error('output-binary-blocked');
  let content;
  try {
    content = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    throw new Error('output-encoding-invalid');
  }
  const history = listJudgmentReceipts(root, receiptId);
  return {
    receipt: {
      receipt_id: receipt.receipt_id,
      receipt_ref: `routine-receipt:${receipt.receipt_id}`,
      run_id: receipt.run_id,
      routine_id: receipt.routine_id,
      system_ref: receipt.system_ref,
      trigger: receipt.trigger,
      completed_at: receipt.completed_at,
      output_ref: receipt.output_ref,
    },
    output: { content, bytes: details.size, media_type: 'text/markdown; charset=utf-8' },
    judgment: {
      current: history.at(-1) || null,
      summary: judgmentSummary(history.at(-1), history.length),
      history: history.slice(-50),
    },
    privacy: {
      content_shared_with_inevita: false,
      output_in_console_read_model: false,
      explicit_local_read: true,
    },
  };
}

export function writeJudgmentReceipt(root, receiptId, {
  verdict,
  actionIntent = 'none',
  note = '',
  actorRef,
  clock = () => new Date(),
  randomId = () => `judgment-${randomUUID()}`,
} = {}) {
  const output = readPrivateRoutineOutput(root, receiptId);
  const now = typeof clock === 'function' ? clock() : clock;
  let decidedAt = new Date(now);
  if (!Number.isFinite(decidedAt.getTime())) throw new Error('clock-invalid');
  const previousAt = Date.parse(output.judgment.current?.decided_at || '');
  if (Number.isFinite(previousAt) && decidedAt.getTime() <= previousAt) {
    decidedAt = new Date(previousAt + 1);
  }
  const value = {
    protocol_version: 1,
    judgment_id: randomId(),
    routine_receipt_ref: output.receipt.receipt_ref,
    receipt_id: output.receipt.receipt_id,
    routine_id: output.receipt.routine_id,
    run_id: output.receipt.run_id,
    verdict,
    action_intent: actionIntent,
    note: typeof note === 'string' ? note.trim() : note,
    actor_ref: actorRef,
    decided_at: decidedAt.toISOString(),
    privacy: {
      content_shared_with_inevita: false,
      output_recorded: false,
      note_private: true,
      external_action_executed: false,
    },
  };
  const errors = validateJudgmentReceipt(value);
  if (errors.length) throw new Error(errors[0].replaceAll(' ', '-').toLowerCase());
  const path = join(judgmentDirectory(root, receiptId), `${value.judgment_id}.json`);
  if (existsSync(path)) throw new Error('judgment-receipt-already-exists');
  writeJsonAtomic(path, value);
  return {
    value,
    path,
    ref: `judgment-receipt:${value.judgment_id}`,
    summary: judgmentSummary(value, listJudgmentReceipts(root, receiptId).length),
  };
}

export function judgmentView(root, receiptId) {
  const history = listJudgmentReceipts(root, receiptId);
  return judgmentSummary(history.at(-1), history.length);
}
