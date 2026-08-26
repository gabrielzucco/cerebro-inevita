// Decision Case V1 — o Console prepara o caso; o humano dá o martelo.
//
// Regra dura da mesa: nenhuma decisão nasce aqui. O Console reúne o item que espera
// julgamento, resolve a evidência (com proveniência carimbada), monta o diff exato do
// que iria para a fonte canônica e para. Só um humano — com autoria, texto verbatim e
// confirmação do diff que ele acabou de ler — escreve a nota de decisão no vault.
//
// Fonte canônica de uma decisão neste cérebro: `01-nucleo-privado/decisoes/` (a casa
// de `tipo: decisao` no schema do vault). Recibo, snapshot e histórico do caso vivem no
// runtime privado; a nota é o único artefato canônico que o caso escreve.
import { createHash, randomUUID } from 'node:crypto';
import {
  closeSync,
  existsSync,
  lstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  readdirSync,
  realpathSync,
  statSync,
  unlinkSync,
  writeFileSync,
  writeSync,
} from 'node:fs';
import { basename, join, relative, resolve, sep } from 'node:path';
import {
  REF_ID_RE,
  latestRunRecords,
  layout,
  readJson,
  writeJsonAtomic,
} from './system-protocol.mjs';

export const DECISION_VERDICTS = new Set(['decided', 'dropped', 'deferred']);
export const DECISION_THEMES = new Set(['comunidade', 'aquisicao', 'produto', 'metodo', 'operacao']);
export const ROLLBACK_REASONS = new Set(['wrong-verdict', 'wrong-evidence', 'duplicate', 'superseded', 'mistake']);
export const MIN_DECISION_TEXT_CHARS = 40;
export const MAX_DECISION_TEXT_CHARS = 8000;
export const MIN_TITLE_CHARS = 8;
export const MAX_TITLE_CHARS = 120;
export const MAX_EVIDENCE = 20;
export const PREVIEW_TTL_MS = 15 * 60 * 1000;

const TIMEZONE = 'America/Sao_Paulo';
const LOCAL_REF_RE = /^(?!\.?\.?$)(?!\.\.?\/)(?!.*\/\.\.(?:\/|$))[A-Za-z0-9.][A-Za-z0-9_./:-]{0,255}$/;
const SECRET_RE = /Bearer\s+|-----BEGIN .*PRIVATE KEY-----|\b(?:sk|ghp|xoxb)[-_A-Za-z0-9]{12,}/i;
// PII é a fronteira inviolável do vault: e-mail, telefone e CPF nunca entram numa nota.
const EMAIL_RE = /[A-Za-z0-9_.+-]+@[A-Za-z0-9-]+\.[A-Za-z0-9-.]+/;
const PHONE_RE = /\+55\s?\(?\d{2}\)?\s?9?\d{4}[-\s]?\d{4}/;
const CPF_RE = /\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/;
// Quem decide é gente. Ref de agente, bot ou do próprio Console nunca assina martelo.
const NON_HUMAN_ACTOR_RE = /^(?:agent|bot|system|console|cerebro|model|automation)[-_]/i;

const VERDICT_LABEL = {
  decided: 'Decidido',
  dropped: 'Descartado',
  deferred: 'Adiado',
};
const VERDICT_LINE = {
  decided: 'Decidido — vale a partir do registro desta nota.',
  dropped: 'Descartado — o item morre aqui e não volta para a fila sem caso novo.',
  deferred: 'Adiado — com data explícita de revisão. Sem terceira opção silenciosa.',
};
const PROVENANCE_LABEL = {
  observed: 'observado',
  declared: 'declarado',
  inferred: 'inferido',
};

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

function digestOf(value) {
  return `sha256:${createHash('sha256').update(value).digest('hex')}`;
}

function shortDigest(value) {
  return `${String(value).slice(0, 'sha256:'.length + 12)}…`;
}

function localDate(date) {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: TIMEZONE }).format(date);
}

function localStamp(date) {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: TIMEZONE, dateStyle: 'short', timeStyle: 'short',
  }).format(date);
}

export function slugify(value) {
  return String(value)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/g, '');
}

export function decisionCaseIdFor(queueKey) {
  if (typeof queueKey !== 'string' || !queueKey.trim()) throw new Error('queue-key-invalid');
  return `case-${createHash('sha256').update(queueKey).digest('hex').slice(0, 32)}`;
}

// ---------------------------------------------------------------- diretórios

function insideRealDirectory(parent, child) {
  const rel = relative(parent, child);
  return Boolean(rel) && !rel.startsWith('..') && !rel.startsWith(sep);
}

function privateDirectory(root, configured, fallback, label) {
  const brain = resolve(root);
  const runtime = resolve(root, '.cerebro', 'runtime');
  const target = resolve(root, configured || fallback);
  if (target === brain || !target.startsWith(`${brain}${sep}`)) throw new Error(`${label}-layout-outside-brain`);
  if (target === runtime || !target.startsWith(`${runtime}${sep}`)) throw new Error(`${label}-layout-not-private`);
  if (!existsSync(runtime)) throw new Error(`${label}-runtime-missing`);
  if (!insideRealDirectory(realpathSync(brain), realpathSync(runtime))) throw new Error(`${label}-runtime-outside-brain`);
  let existing = target;
  while (!existsSync(existing)) {
    const parent = resolve(existing, '..');
    if (parent === existing) throw new Error(`${label}-storage-parent-missing`);
    existing = parent;
  }
  if (lstatSync(existing).isSymbolicLink()) throw new Error(`${label}-storage-symlink-blocked`);
  const real = realpathSync(existing);
  if (real !== realpathSync(runtime) && !insideRealDirectory(realpathSync(runtime), real)) {
    throw new Error(`${label}-storage-outside-runtime`);
  }
  return target;
}

export function decisionReceiptDirectory(root) {
  return privateDirectory(root, layout(root).decisionReceipts,
    join('.cerebro', 'runtime', 'receipts', 'decisions'), 'decision-receipt');
}

export function decisionSnapshotDirectory(root) {
  return privateDirectory(root, layout(root).decisionSnapshots,
    join('.cerebro', 'runtime', 'decisions'), 'decision-snapshot');
}

// A casa canônica das decisões: dentro do cérebro, FORA do runtime privado e fora da
// zona de dados de terceiros. É a única pasta que um Decision Case pode escrever.
export function decisionNotesDirectory(root) {
  const brain = resolve(root);
  const runtime = resolve(root, '.cerebro');
  const configured = layout(root).decisionNotes || join('01-nucleo-privado', 'decisoes');
  const target = resolve(root, configured);
  if (target === brain || !target.startsWith(`${brain}${sep}`)) throw new Error('decision-notes-outside-brain');
  if (target === runtime || target.startsWith(`${runtime}${sep}`)) throw new Error('decision-notes-inside-runtime');
  if (target.startsWith(`${resolve(root, '02-dados-terceiros')}${sep}`)) throw new Error('decision-notes-in-third-party-zone');
  if (!existsSync(target)) throw new Error('decision-notes-missing');
  if (lstatSync(target).isSymbolicLink()) throw new Error('decision-notes-symlink-blocked');
  if (!insideRealDirectory(realpathSync(brain), realpathSync(target))) throw new Error('decision-notes-outside-brain');
  return target;
}

function decisionQueuePath(root) {
  return resolve(root, layout(root).decisionQueue || join('.automacao', '_FILA-DECISAO.json'));
}

// ---------------------------------------------------------------- fila e caso

export function readDecisionQueue(root) {
  const path = decisionQueuePath(root);
  if (!existsSync(path) || lstatSync(path).isSymbolicLink()) {
    return { available: false, path: null, digest: null, open: [], decided_total: 0 };
  }
  let data;
  try {
    data = JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return { available: false, path: null, digest: null, open: [], decided_total: 0 };
  }
  const now = Date.now();
  const open = Object.entries(data.abertos || {})
    .filter(([key, item]) => typeof key === 'string' && object(item))
    .map(([key, item]) => ({
      key,
      case_id: decisionCaseIdFor(key),
      title: String(item.titulo || key),
      category: String(item.categoria || 'sem-categoria'),
      first_seen: String(item.first_seen || ''),
      last_seen: String(item.last_seen || ''),
      age_days: Math.max(0, Math.round((now - Date.parse(`${item.first_seen}T12:00:00`)) / 86400000)) || 0,
    }))
    .sort((left, right) => right.age_days - left.age_days || left.key.localeCompare(right.key));
  return {
    available: true,
    path: relative(resolve(root), path),
    digest: digestOf(readFileSync(path)),
    open,
    decided_total: Array.isArray(data.historico) ? data.historico.length : 0,
  };
}

function queueItem(root, caseId) {
  if (!REF_ID_RE.test(caseId || '')) throw new Error('case-id-invalid');
  const queue = readDecisionQueue(root);
  const item = queue.open.find((entry) => entry.case_id === caseId);
  if (!item) throw new Error('decision-case-not-found');
  return { queue, item };
}

// ------------------------------------------------------------------ evidência

function fileEvidence(root, path, ref, kind, provenance, summary) {
  if (!existsSync(path) || lstatSync(path).isSymbolicLink()) return null;
  const details = statSync(path);
  if (!details.isFile()) return null;
  return {
    ref,
    kind,
    provenance,
    path: relative(resolve(root), path),
    digest: digestOf(readFileSync(path)),
    bytes: details.size,
    summary,
  };
}

function judgmentReceiptPath(root, judgmentId) {
  let directory;
  try {
    directory = privateDirectory(root, layout(root).routineJudgments,
      join('.cerebro', 'runtime', 'judgments'), 'judgment');
  } catch { return null; }
  if (!existsSync(directory)) return null;
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const candidate = join(directory, entry.name, `${judgmentId}.json`);
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

function experimentContractPath(root, experimentId) {
  const directory = resolve(root, layout(root).experimentContracts || join('.cerebro', 'contracts', 'experiments'));
  if (!existsSync(directory)) return null;
  for (const name of readdirSync(directory).filter((entry) => entry.endsWith('.json')).sort()) {
    let value;
    try { value = readJson(join(directory, name), name); } catch { continue; }
    if (value?.experiment_id === experimentId) return join(directory, name);
  }
  return null;
}

// Resolve uma referência de evidência no cérebro real. Nada de ref que não abre:
// evidência que não resolve derruba o caso, não vira linha decorativa na nota.
function resolveEvidence(root, ref, { inferredRefs = new Set() } = {}) {
  if (typeof ref !== 'string' || !LOCAL_REF_RE.test(ref)) throw new Error('evidence-ref-invalid');
  const separator = ref.indexOf(':');
  const kind = separator === -1 ? '' : ref.slice(0, separator);
  const id = separator === -1 ? '' : ref.slice(separator + 1);
  const inferred = inferredRefs.has(ref);
  let resolved = null;
  if (kind === 'routine-receipt' && REF_ID_RE.test(id)) {
    const directory = resolve(root, layout(root).routineReceipts || join('.cerebro', 'runtime', 'receipts', 'routines'));
    resolved = fileEvidence(root, join(directory, `${id}.json`), ref, 'routine-receipt',
      inferred ? 'inferred' : 'observed', 'Recibo de execução de rotina');
  } else if (kind === 'judgment-receipt' && REF_ID_RE.test(id)) {
    const path = judgmentReceiptPath(root, id);
    resolved = path && fileEvidence(root, path, ref, 'judgment-receipt',
      inferred ? 'inferred' : 'observed', 'Martelo anterior sobre um output');
  } else if (kind === 'run-record' && REF_ID_RE.test(id)) {
    const record = latestRunRecords(root).find((entry) => entry.run_id === id);
    if (record) {
      const serialized = JSON.stringify(record);
      resolved = {
        ref,
        kind: 'run-record',
        provenance: inferred ? 'inferred' : 'observed',
        path: relative(resolve(root), resolve(root, layout(root).runLedger || join('.cerebro', 'runtime', 'ledger', 'runs.jsonl'))),
        digest: digestOf(serialized),
        bytes: serialized.length,
        summary: `Run Record ${record.mode || 'run'} · ${record.status || 'sem status'}`,
      };
    }
  } else if (kind === 'experiment') {
    const path = experimentContractPath(root, id);
    resolved = path && fileEvidence(root, path, ref, 'experiment',
      inferred ? 'inferred' : 'declared', 'Contrato de experimento pré-registrado');
  } else if (kind === 'decision-queue') {
    const queue = readDecisionQueue(root);
    const item = queue.open.find((entry) => entry.key === id);
    if (item && queue.available) {
      resolved = {
        ref,
        kind: 'decision-queue',
        provenance: 'observed',
        path: queue.path,
        digest: queue.digest,
        bytes: null,
        summary: `Item da fila única · ${item.category} · ${item.age_days}d`,
      };
    }
  } else if (kind === 'note') {
    if (!id.startsWith('01-nucleo-privado/') || !id.endsWith('.md')) throw new Error('evidence-note-outside-moat');
    const path = resolve(root, id);
    if (!path.startsWith(`${resolve(root, '01-nucleo-privado')}${sep}`)) throw new Error('evidence-note-outside-moat');
    resolved = fileEvidence(root, path, ref, 'note', inferred ? 'inferred' : 'declared', 'Nota do núcleo privado');
  } else {
    throw new Error('evidence-kind-unsupported');
  }
  if (!resolved) throw new Error('evidence-not-found');
  return resolved;
}

// Candidatos que o Console consegue apontar sozinho — e só apontar. O que entra na
// nota é o que o humano escolhe; o que foi achado por casamento de texto sai
// carimbado como `inferido`, nunca como observado.
function evidenceCandidates(root, item, queue) {
  const candidates = [];
  const inferred = new Set();
  if (queue.available) {
    candidates.push(resolveEvidence(root, `decision-queue:${item.key}`));
  }
  const experimentIds = [...String(item.title).matchAll(/\bEXP-[A-Za-z0-9_-]{1,48}\b/g)].map((match) => match[0]);
  for (const experimentId of new Set(experimentIds)) {
    const ref = `experiment:${experimentId}`;
    inferred.add(ref);
    try { candidates.push(resolveEvidence(root, ref, { inferredRefs: inferred })); } catch { /* candidato que não abre não é candidato */ }
  }
  for (const note of ['01-nucleo-privado/_PAINEL.md', '01-nucleo-privado/painel/aberto.md']) {
    try { candidates.push(resolveEvidence(root, `note:${note}`)); } catch { /* nem todo cérebro tem painel */ }
  }
  let receipts = [];
  try {
    const directory = resolve(root, layout(root).routineReceipts || join('.cerebro', 'runtime', 'receipts', 'routines'));
    receipts = existsSync(directory) ? readdirSync(directory).filter((name) => name.endsWith('.json')).sort().slice(-5) : [];
  } catch { receipts = []; }
  for (const name of receipts) {
    try { candidates.push(resolveEvidence(root, `routine-receipt:${name.slice(0, -'.json'.length)}`)); } catch { /* recibo ilegível não vira evidência */ }
  }
  return { candidates, inferred_refs: [...inferred] };
}

// ----------------------------------------------------------------- histórico

function caseDirectory(root, caseId) {
  if (!REF_ID_RE.test(caseId || '')) throw new Error('case-id-invalid');
  return join(decisionReceiptDirectory(root), caseId);
}

export function listDecisionCaseEvents(root, caseId) {
  const directory = caseDirectory(root, caseId);
  if (!existsSync(directory)) return [];
  return readdirSync(directory)
    .filter((name) => name.endsWith('.json'))
    .sort()
    .map((name) => {
      const value = readJson(join(directory, name), 'Decision Case Receipt');
      const errors = validateDecisionCaseReceipt(value);
      if (errors.length) throw new Error('decision-case-receipt-invalid');
      return value;
    })
    .sort((left, right) => Date.parse(left.recorded_at) - Date.parse(right.recorded_at)
      || left.event_id.localeCompare(right.event_id));
}

export function decisionCaseState(root, caseId) {
  const events = listDecisionCaseEvents(root, caseId);
  const last = events.at(-1) || null;
  const applied = [...events].reverse().find((event) => event.event === 'applied') || null;
  return {
    status: last ? (last.event === 'applied' ? 'applied' : 'rolled-back') : 'pending',
    event_count: events.length,
    applied_ref: last?.event === 'applied' ? `decision-case-receipt:${applied.event_id}` : null,
    canonical_path: last?.event === 'applied' ? applied.canonical_writes[0].path : null,
    last_event: last ? {
      event: last.event,
      event_ref: `decision-case-receipt:${last.event_id}`,
      recorded_at: last.recorded_at,
      actor_ref: last.actor_ref,
      verdict: last.verdict,
      canonical_writes: last.canonical_writes,
      reason_code: last.reason_code || null,
    } : null,
    history: events.map((event) => ({
      event: event.event,
      event_ref: `decision-case-receipt:${event.event_id}`,
      recorded_at: event.recorded_at,
      actor_ref: event.actor_ref,
      verdict: event.verdict,
      reason_code: event.reason_code || null,
    })),
  };
}

// -------------------------------------------------------------------- recibo

export function validateDecisionCaseReceipt(value) {
  const errors = [];
  if (!object(value)) return ['decision case receipt precisa ser objeto'];
  closed(errors, value, 'decision_case_receipt', [
    'protocol_version', 'event_id', 'event', 'case_id', 'case_ref', 'queue_ref', 'queue_key',
    'verdict', 'review_on', 'title', 'title_digest', 'decision_text_digest', 'decision_text_chars',
    'evidence', 'canonical_writes', 'snapshot_ref', 'reason_code', 'applied_event_ref',
    'actor_ref', 'authorship', 'recorded_at', 'plan_digest', 'privacy',
  ]);
  if (value.protocol_version !== 1) errors.push('protocol_version precisa ser 1');
  if (!REF_ID_RE.test(value.event_id || '')) errors.push('event_id inválido');
  if (!['applied', 'rolled-back'].includes(value.event)) errors.push('event inválido');
  if (!REF_ID_RE.test(value.case_id || '')) errors.push('case_id inválido');
  if (value.case_ref !== `decision-case:${value.case_id}`) errors.push('case_ref diverge de case_id');
  if (typeof value.queue_key !== 'string' || !value.queue_key.trim()) errors.push('queue_key inválido');
  else {
    if (value.queue_ref !== `decision-queue:${value.queue_key}`) errors.push('queue_ref diverge de queue_key');
    if (value.case_id !== decisionCaseIdFor(value.queue_key)) errors.push('case_id não deriva do queue_key');
  }
  if (!DECISION_VERDICTS.has(value.verdict)) errors.push('verdict inválido');
  if (value.verdict === 'deferred' ? !/^\d{4}-\d{2}-\d{2}$/.test(value.review_on || '') : value.review_on !== null) {
    errors.push('review_on inválido para o veredito');
  }
  if (typeof value.title !== 'string' || value.title.length < MIN_TITLE_CHARS || value.title.length > MAX_TITLE_CHARS) {
    errors.push('title inválido');
  }
  for (const field of ['title_digest', 'decision_text_digest', 'plan_digest']) {
    if (!/^sha256:[0-9a-f]{64}$/.test(value[field] || '')) errors.push(`${field} inválido`);
  }
  if (!Number.isInteger(value.decision_text_chars) || value.decision_text_chars < MIN_DECISION_TEXT_CHARS
    || value.decision_text_chars > MAX_DECISION_TEXT_CHARS) errors.push('decision_text_chars inválido');
  if (!Array.isArray(value.evidence) || !value.evidence.length || value.evidence.length > MAX_EVIDENCE) {
    errors.push('evidência obrigatória');
  } else {
    for (const [index, entry] of value.evidence.entries()) {
      closed(errors, entry, `evidence[${index}]`, ['ref', 'kind', 'provenance', 'path', 'digest']);
      if (!LOCAL_REF_RE.test(entry?.ref || '')) errors.push(`evidence[${index}].ref inválido`);
      if (!['observed', 'declared', 'inferred'].includes(entry?.provenance)) errors.push(`evidence[${index}].provenance inválida`);
      if (!/^sha256:[0-9a-f]{64}$/.test(entry?.digest || '')) errors.push(`evidence[${index}].digest inválido`);
    }
    if (!value.evidence.some((entry) => entry?.kind !== 'decision-queue')) {
      errors.push('caso precisa de evidência além do próprio item da fila');
    }
  }
  if (!Array.isArray(value.canonical_writes) || value.canonical_writes.length !== 1) {
    errors.push('canonical_writes precisa ter exatamente uma escrita');
  } else {
    const [write] = value.canonical_writes;
    closed(errors, write, 'canonical_writes[0]', ['path', 'operation', 'before_digest', 'after_digest', 'bytes']);
    if (typeof write?.path !== 'string' || !write.path.endsWith('.md') || write.path.includes('..')) {
      errors.push('canonical_writes[0].path inválido');
    }
    if (!['create', 'delete'].includes(write?.operation)) errors.push('canonical_writes[0].operation inválida');
    if (value.event === 'applied' && (write?.operation !== 'create' || write.before_digest !== null
      || !/^sha256:[0-9a-f]{64}$/.test(write?.after_digest || ''))) errors.push('escrita aplicada inconsistente');
    if (value.event === 'rolled-back' && (write?.operation !== 'delete' || write.after_digest !== null
      || !/^sha256:[0-9a-f]{64}$/.test(write?.before_digest || ''))) errors.push('reversão inconsistente');
  }
  if (value.event === 'rolled-back') {
    if (!ROLLBACK_REASONS.has(value.reason_code)) errors.push('reason_code inválido');
    if (!LOCAL_REF_RE.test(value.snapshot_ref || '')) errors.push('snapshot_ref obrigatório na reversão');
    if (!LOCAL_REF_RE.test(value.applied_event_ref || '')) errors.push('applied_event_ref obrigatório na reversão');
  } else {
    if (value.reason_code !== null) errors.push('reason_code só existe em reversão');
    if (value.snapshot_ref !== null) errors.push('snapshot_ref só existe em reversão');
    if (value.applied_event_ref !== null) errors.push('applied_event_ref só existe em reversão');
  }
  if (!REF_ID_RE.test(value.actor_ref || '')) errors.push('actor_ref inválido');
  if (NON_HUMAN_ACTOR_RE.test(value.actor_ref || '')) errors.push('martelo exige autoria humana');
  if (value.authorship !== 'human') errors.push('authorship precisa ser human');
  if (!validDate(value.recorded_at)) errors.push('recorded_at inválido');
  if (!object(value.privacy)) errors.push('privacy precisa ser objeto');
  else {
    closed(errors, value.privacy, 'privacy', [
      'content_shared_with_inevita', 'decision_text_recorded', 'canonical_write',
      'external_action_executed', 'pii_scanned',
    ]);
    if (value.privacy.content_shared_with_inevita !== false) errors.push('conteúdo não pode ir à INEVITA');
    if (value.privacy.decision_text_recorded !== false) errors.push('recibo não guarda o texto da decisão');
    if (value.privacy.canonical_write !== true) errors.push('Decision Case sempre declara a escrita canônica');
    if (value.privacy.external_action_executed !== false) errors.push('Decision Case não executa ação externa');
    if (value.privacy.pii_scanned !== true) errors.push('nota precisa passar pelo gate de PII');
  }
  const serialized = JSON.stringify(value);
  if (/"(?:prompt|output|decision_text|note|raw_error|token|api_key|oauth)"\s*:/i.test(serialized)) {
    errors.push('Decision Case Receipt contém payload ou credencial');
  }
  return [...new Set(errors)];
}

// ---------------------------------------------------------------- a nota

function assertHumanProse(value, field) {
  if (typeof value !== 'string') throw new Error(`${field}-invalid`);
  if (/[\u0000-\u0008\u000b-\u001f]|\r/.test(value)) throw new Error(`${field}-control-character`);
  if (SECRET_RE.test(value)) throw new Error(`${field}-looks-like-secret`);
  if (EMAIL_RE.test(value) || PHONE_RE.test(value) || CPF_RE.test(value)) throw new Error(`${field}-contains-pii`);
}

function evidenceTable(evidence) {
  return [
    '| referência | proveniência | onde | impressão |',
    '| --- | --- | --- | --- |',
    ...evidence.map((entry) => `| \`${entry.ref}\` | ${PROVENANCE_LABEL[entry.provenance]} | ${entry.path ? `\`${entry.path}\`` : '—'} | \`${shortDigest(entry.digest)}\` |`),
  ].join('\n');
}

export function renderDecisionNote({
  caseId, item, verdict, reviewOn, title, decisionText, evidence, actorRef, decidedAt, theme,
}) {
  const created = localDate(decidedAt);
  const verdictLine = verdict === 'deferred'
    ? `${VERDICT_LINE.deferred} Revisar em **${reviewOn}**.`
    : VERDICT_LINE[verdict];
  return `---
tipo: decisao
fonte: mente-propria
tema: ${theme}
pode-ir-comunidade: false
criado: ${created}
---

# ${title}

> Martelo humano registrado pelo Company Brain Console em ${localStamp(decidedAt)} (${TIMEZONE}).
> Autoria: \`${actorRef}\` · veredito: **${VERDICT_LABEL[verdict]}** · caso: \`decision-case:${caseId}\`.
> O Console reuniu item e evidência; o texto abaixo é de quem decidiu, verbatim.

## Veredito

${verdictLine}

## Decisão (verbatim de quem deu o martelo)

${decisionText}

## O item que esperava martelo

- \`decision-queue:${item.key}\`
- **${item.title}**
- categoria \`${item.category}\` · na fila desde ${item.first_seen} (${item.age_days}d)

## Evidência

${evidenceTable(evidence)}

Proveniência: **observado** é artefato que uma execução deixou; **declarado** é contrato ou nota
escrita por gente; **inferido** é candidato que o Console apontou por casamento de texto e o humano
aceitou. A impressão é o sha256 do artefato no momento do martelo.

## Reversão

Este registro é reversível pelo Console (\`decision-case:${caseId}\` → reverter): a nota sai, uma
cópia privada fica em \`.cerebro/runtime/decisions/\` e um recibo de reversão entra no histórico do
caso. Reverter o registro **não** desfaz o que a decisão causou fora daqui.
`;
}

// -------------------------------------------------------------------- plano

function normalizedEvidenceRefs(refs) {
  if (!Array.isArray(refs)) throw new Error('evidence-required');
  const unique = [...new Set(refs.filter((ref) => typeof ref === 'string' && ref.trim()).map((ref) => ref.trim()))];
  if (!unique.length) throw new Error('evidence-required');
  if (unique.length > MAX_EVIDENCE) throw new Error('evidence-too-many');
  return unique;
}

function planFor(root, caseId, input, decidedAt) {
  const { item, queue } = queueItem(root, caseId);
  const { verdict } = input;
  if (!DECISION_VERDICTS.has(verdict)) throw new Error('verdict-invalid');
  const theme = input.theme || 'metodo';
  if (!DECISION_THEMES.has(theme)) throw new Error('theme-invalid');
  const actorRef = String(input.actorRef || '');
  if (!REF_ID_RE.test(actorRef)) throw new Error('actor-ref-invalid');
  if (NON_HUMAN_ACTOR_RE.test(actorRef)) throw new Error('human-authorship-required');
  if (input.authoredByHuman !== true) throw new Error('human-authorship-required');

  const title = String(input.title || '').trim();
  assertHumanProse(title, 'title');
  if (title.length < MIN_TITLE_CHARS || title.length > MAX_TITLE_CHARS) throw new Error('title-invalid');
  const decisionText = String(input.decisionText ?? '').trim();
  assertHumanProse(decisionText, 'decision-text');
  if (decisionText.length < MIN_DECISION_TEXT_CHARS) throw new Error('decision-text-too-short');
  if (decisionText.length > MAX_DECISION_TEXT_CHARS) throw new Error('decision-text-too-long');
  if (decisionText.startsWith('---')) throw new Error('decision-text-invalid');

  let reviewOn = null;
  if (verdict === 'deferred') {
    reviewOn = String(input.reviewOn || '');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(reviewOn) || !validDate(`${reviewOn}T12:00:00Z`)) throw new Error('review-on-invalid');
    if (Date.parse(`${reviewOn}T23:59:59Z`) <= decidedAt.getTime()) throw new Error('review-on-not-future');
  } else if (input.reviewOn) {
    throw new Error('review-on-not-allowed');
  }

  const { inferred_refs: inferredRefs } = evidenceCandidates(root, item, queue);
  const inferred = new Set(inferredRefs);
  const evidence = normalizedEvidenceRefs(input.evidenceRefs)
    .map((ref) => resolveEvidence(root, ref, { inferredRefs: inferred }));
  if (!evidence.some((entry) => entry.kind !== 'decision-queue')) throw new Error('evidence-beyond-queue-required');

  const slug = slugify(title);
  if (slug.length < 3) throw new Error('title-slug-invalid');
  const notesDirectory = decisionNotesDirectory(root);
  const targetPath = join(notesDirectory, `${localDate(decidedAt)}-${slug}.md`);
  if (!targetPath.startsWith(`${notesDirectory}${sep}`)) throw new Error('canonical-target-outside-house');

  const content = renderDecisionNote({
    caseId, item, verdict, reviewOn, title, decisionText, evidence, actorRef, decidedAt, theme,
  });
  const contentDigest = digestOf(content);
  const planDigest = digestOf(JSON.stringify({
    protocol: 'decision-case/v1',
    case_id: caseId,
    queue_key: item.key,
    verdict,
    review_on: reviewOn,
    theme,
    actor_ref: actorRef,
    decided_at: decidedAt.toISOString(),
    target_path: relative(resolve(root), targetPath),
    content_digest: contentDigest,
    evidence: evidence.map((entry) => ({ ref: entry.ref, provenance: entry.provenance, digest: entry.digest })),
  }));

  return {
    case_id: caseId,
    item,
    verdict,
    review_on: reviewOn,
    theme,
    title,
    actor_ref: actorRef,
    decided_at: decidedAt.toISOString(),
    decision_text_digest: digestOf(decisionText),
    decision_text_chars: decisionText.length,
    title_digest: digestOf(title),
    evidence,
    target_path: relative(resolve(root), targetPath),
    absolute_target: targetPath,
    content,
    content_digest: contentDigest,
    plan_digest: planDigest,
  };
}

// Diff unificado real (LCS) — o que o humano lê é byte a byte o que será escrito.
export function unifiedDiff(before, after, path, { context = 3 } = {}) {
  const a = before === null ? [] : String(before).split('\n');
  const b = after === null ? [] : String(after).split('\n');
  if (a.length > 4000 || b.length > 4000) throw new Error('diff-too-large');
  const table = Array.from({ length: a.length + 1 }, () => new Uint32Array(b.length + 1));
  for (let i = a.length - 1; i >= 0; i -= 1) {
    for (let j = b.length - 1; j >= 0; j -= 1) {
      table[i][j] = a[i] === b[j] ? table[i + 1][j + 1] + 1 : Math.max(table[i + 1][j], table[i][j + 1]);
    }
  }
  const ops = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      ops.push([' ', a[i]]); i += 1; j += 1;
    } else if (table[i + 1][j] >= table[i][j + 1]) {
      ops.push(['-', a[i]]); i += 1;
    } else {
      ops.push(['+', b[j]]); j += 1;
    }
  }
  while (i < a.length) { ops.push(['-', a[i]]); i += 1; }
  while (j < b.length) { ops.push(['+', b[j]]); j += 1; }

  const keep = new Array(ops.length).fill(false);
  ops.forEach((op, index) => {
    if (op[0] === ' ') return;
    for (let k = Math.max(0, index - context); k <= Math.min(ops.length - 1, index + context); k += 1) keep[k] = true;
  });
  const hunks = [];
  let current = null;
  let oldLine = 1;
  let newLine = 1;
  ops.forEach((op, index) => {
    const [kind, text] = op;
    if (keep[index]) {
      if (!current) {
        current = { oldStart: oldLine, newStart: newLine, oldCount: 0, newCount: 0, lines: [] };
        hunks.push(current);
      }
      current.lines.push(`${kind}${text}`);
      if (kind !== '+') current.oldCount += 1;
      if (kind !== '-') current.newCount += 1;
    } else {
      current = null;
    }
    if (kind !== '+') oldLine += 1;
    if (kind !== '-') newLine += 1;
  });
  const header = `--- ${before === null ? '/dev/null' : `a/${path}`}\n+++ ${after === null ? '/dev/null' : `b/${path}`}`;
  const body = hunks.map((hunk) => `@@ -${hunk.oldCount ? hunk.oldStart : 0},${hunk.oldCount} +${hunk.newCount ? hunk.newStart : 0},${hunk.newCount} @@\n${hunk.lines.join('\n')}`).join('\n');
  return `${header}\n${body}\n`;
}

// ------------------------------------------------------------------- API

export function prepareDecisionCase(root, caseId) {
  const { item, queue } = queueItem(root, caseId);
  const { candidates, inferred_refs: inferredRefs } = evidenceCandidates(root, item, queue);
  const state = decisionCaseState(root, caseId);
  let notesHouse = null;
  let houseReady = true;
  try { notesHouse = relative(resolve(root), decisionNotesDirectory(root)); } catch { houseReady = false; }
  return {
    case_id: caseId,
    case_ref: `decision-case:${caseId}`,
    queue_ref: `decision-queue:${item.key}`,
    item,
    state,
    evidence_candidates: candidates,
    inferred_refs: inferredRefs,
    canonical: {
      house: notesHouse,
      house_ready: houseReady,
      filename_pattern: 'AAAA-MM-DD-<slug-do-titulo>.md',
      frontmatter: { tipo: 'decisao', fonte: 'mente-propria', 'pode-ir-comunidade': false },
      themes: [...DECISION_THEMES],
    },
    verdicts: [...DECISION_VERDICTS],
    rollback_reasons: [...ROLLBACK_REASONS],
    // Estrutura, nunca prosa: o Console não escreve o veredito de ninguém.
    draft: {
      decision_text: '',
      hint: 'O texto do martelo é seu, verbatim. O Console monta a nota em volta dele.',
      min_chars: MIN_DECISION_TEXT_CHARS,
      max_chars: MAX_DECISION_TEXT_CHARS,
    },
    authorship: {
      required: 'human',
      console_authored: false,
      rule: 'O Console prepara o caso. Quem decide é gente, com nome no recibo.',
    },
  };
}

export function listDecisionCases(root) {
  const queue = readDecisionQueue(root);
  const cases = queue.open.map((item) => ({
    ...item,
    case_ref: `decision-case:${item.case_id}`,
    state: decisionCaseState(root, item.case_id),
  }));
  let houseReady = true;
  try { decisionNotesDirectory(root); } catch { houseReady = false; }
  return {
    available: queue.available,
    house_ready: houseReady,
    queue_path: queue.path,
    open_count: cases.length,
    decided_total: queue.decided_total,
    applied_count: cases.filter((entry) => entry.state.status === 'applied').length,
    cases,
  };
}

export function previewDecisionCase(root, caseId, input, { clock = () => new Date() } = {}) {
  const decidedAt = new Date(typeof clock === 'function' ? clock() : clock);
  if (!Number.isFinite(decidedAt.getTime())) throw new Error('clock-invalid');
  const state = decisionCaseState(root, caseId);
  if (state.status === 'applied') throw new Error('decision-case-already-applied');
  const plan = planFor(root, caseId, input, decidedAt);
  if (existsSync(plan.absolute_target)) throw new Error('canonical-target-exists');
  return {
    case_id: caseId,
    case_ref: `decision-case:${caseId}`,
    plan_digest: plan.plan_digest,
    decided_at: plan.decided_at,
    expires_at: new Date(decidedAt.getTime() + PREVIEW_TTL_MS).toISOString(),
    verdict: plan.verdict,
    review_on: plan.review_on,
    title: plan.title,
    actor_ref: plan.actor_ref,
    evidence: plan.evidence,
    canonical_write: {
      path: plan.target_path,
      operation: 'create',
      before_digest: null,
      after_digest: plan.content_digest,
      bytes: Buffer.byteLength(plan.content, 'utf8'),
    },
    diff: unifiedDiff(null, plan.content, plan.target_path),
    content: plan.content,
    applied: false,
    external_action_executed: false,
  };
}

function writeEvent(root, caseId, value) {
  const errors = validateDecisionCaseReceipt(value);
  if (errors.length) throw new Error('decision-case-receipt-invalid');
  const path = join(caseDirectory(root, caseId), `${value.recorded_at.replace(/[:.]/g, '-')}-${value.event_id}.json`);
  if (existsSync(path)) throw new Error('decision-case-receipt-already-exists');
  writeJsonAtomic(path, value);
  return { value, path, ref: `decision-case-receipt:${value.event_id}` };
}

export function applyDecisionCase(root, caseId, input, {
  clock = () => new Date(),
  randomId = () => `decision-${randomUUID()}`,
} = {}) {
  const state = decisionCaseState(root, caseId);
  // Idempotência: caso já aplicado devolve o recibo existente e não toca em disco.
  if (state.status === 'applied') {
    return {
      status: 'already-applied',
      case_ref: `decision-case:${caseId}`,
      receipt_ref: state.applied_ref,
      canonical_write: state.last_event.canonical_writes[0],
      state,
      canonical_write_performed: false,
      external_action_executed: false,
    };
  }
  const decidedAt = new Date(input.decidedAt || '');
  if (!Number.isFinite(decidedAt.getTime())) throw new Error('preview-required');
  const now = new Date(typeof clock === 'function' ? clock() : clock);
  if (!Number.isFinite(now.getTime())) throw new Error('clock-invalid');
  if (decidedAt.getTime() > now.getTime() + 60_000) throw new Error('preview-in-future');
  if (now.getTime() - decidedAt.getTime() > PREVIEW_TTL_MS) throw new Error('preview-expired');
  if (!/^sha256:[0-9a-f]{64}$/.test(input.planDigest || '')) throw new Error('preview-required');

  const plan = planFor(root, caseId, input, decidedAt);
  // Confirmação explícita: o que se aplica é exatamente o diff que o humano leu.
  if (plan.plan_digest !== input.planDigest) throw new Error('preview-stale');

  const target = plan.absolute_target;
  let handle;
  try {
    handle = openSync(target, 'wx', 0o644); // exclusivo: nunca sobrescreve nota existente
  } catch {
    throw new Error('canonical-target-exists');
  }
  try {
    writeSync(handle, plan.content);
  } finally {
    closeSync(handle);
  }
  const written = digestOf(readFileSync(target));
  if (written !== plan.content_digest) {
    unlinkSync(target);
    throw new Error('canonical-write-mismatch');
  }

  const value = {
    protocol_version: 1,
    event_id: randomId(),
    event: 'applied',
    case_id: caseId,
    case_ref: `decision-case:${caseId}`,
    queue_ref: `decision-queue:${plan.item.key}`,
    queue_key: plan.item.key,
    verdict: plan.verdict,
    review_on: plan.review_on,
    title: plan.title,
    title_digest: plan.title_digest,
    decision_text_digest: plan.decision_text_digest,
    decision_text_chars: plan.decision_text_chars,
    evidence: plan.evidence.map((entry) => ({
      ref: entry.ref, kind: entry.kind, provenance: entry.provenance, path: entry.path, digest: entry.digest,
    })),
    canonical_writes: [{
      path: plan.target_path,
      operation: 'create',
      before_digest: null,
      after_digest: plan.content_digest,
      bytes: Buffer.byteLength(plan.content, 'utf8'),
    }],
    snapshot_ref: null,
    reason_code: null,
    applied_event_ref: null,
    actor_ref: plan.actor_ref,
    authorship: 'human',
    recorded_at: decidedAt.toISOString(),
    plan_digest: plan.plan_digest,
    privacy: {
      content_shared_with_inevita: false,
      decision_text_recorded: false,
      canonical_write: true,
      external_action_executed: false,
      pii_scanned: true,
    },
  };
  let receipt;
  try {
    receipt = writeEvent(root, caseId, value);
  } catch (error) {
    unlinkSync(target); // recibo é obrigatório: sem recibo, a escrita canônica não fica de pé
    throw error;
  }
  return {
    status: 'applied',
    case_ref: value.case_ref,
    receipt_ref: receipt.ref,
    canonical_write: value.canonical_writes[0],
    state: decisionCaseState(root, caseId),
    canonical_write_performed: true,
    external_action_executed: false,
  };
}

export function rollbackDecisionCase(root, caseId, input, {
  clock = () => new Date(),
  randomId = () => `decision-${randomUUID()}`,
} = {}) {
  const state = decisionCaseState(root, caseId);
  if (state.status !== 'applied') {
    return {
      status: state.status === 'rolled-back' ? 'already-rolled-back' : 'nothing-to-roll-back',
      case_ref: `decision-case:${caseId}`,
      state,
      canonical_write_performed: false,
      external_action_executed: false,
    };
  }
  const applied = listDecisionCaseEvents(root, caseId).filter((event) => event.event === 'applied').at(-1);
  const actorRef = String(input.actorRef || '');
  if (!REF_ID_RE.test(actorRef)) throw new Error('actor-ref-invalid');
  if (NON_HUMAN_ACTOR_RE.test(actorRef)) throw new Error('human-authorship-required');
  if (!ROLLBACK_REASONS.has(input.reasonCode)) throw new Error('reason-code-invalid');

  const [write] = applied.canonical_writes;
  const notesDirectory = decisionNotesDirectory(root);
  const target = resolve(root, write.path);
  if (!target.startsWith(`${notesDirectory}${sep}`)) throw new Error('canonical-target-outside-house');
  if (!existsSync(target)) throw new Error('canonical-target-missing');
  if (lstatSync(target).isSymbolicLink()) throw new Error('canonical-target-symlink-blocked');
  const bytes = readFileSync(target);
  // Reverter não destrói trabalho de gente: se a nota mudou depois do martelo, para.
  if (digestOf(bytes) !== write.after_digest) throw new Error('rollback-conflict');

  const recordedAt = new Date(typeof clock === 'function' ? clock() : clock);
  if (!Number.isFinite(recordedAt.getTime())) throw new Error('clock-invalid');
  const snapshotName = `${recordedAt.toISOString().replace(/[:.]/g, '-')}-${basename(write.path)}`;
  const snapshotPath = join(decisionSnapshotDirectory(root), caseId, snapshotName);
  mkdirSync(join(snapshotPath, '..'), { recursive: true });
  writeFileSync(snapshotPath, bytes, { mode: 0o600 });
  unlinkSync(target);

  const value = {
    ...applied,
    event_id: randomId(),
    event: 'rolled-back',
    canonical_writes: [{
      path: write.path,
      operation: 'delete',
      before_digest: write.after_digest,
      after_digest: null,
      bytes: write.bytes,
    }],
    snapshot_ref: `decision-snapshot:${caseId}/${snapshotName}`,
    reason_code: input.reasonCode,
    applied_event_ref: `decision-case-receipt:${applied.event_id}`,
    actor_ref: actorRef,
    recorded_at: recordedAt.toISOString(),
  };
  const receipt = writeEvent(root, caseId, value);
  return {
    status: 'rolled-back',
    case_ref: value.case_ref,
    receipt_ref: receipt.ref,
    snapshot_ref: value.snapshot_ref,
    restored_to: 'absent',
    state: decisionCaseState(root, caseId),
    canonical_write_performed: true,
    external_action_executed: false,
  };
}
