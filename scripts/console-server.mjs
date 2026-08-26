#!/usr/bin/env node

import { randomBytes, timingSafeEqual } from 'node:crypto';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  confirmLegacySchedulePaused,
  listRoutineRunReceipts,
} from './lib/routine-protocol.mjs';
import {
  activateRoutine,
  pauseRoutine,
  resumeRoutine,
  runRoutine,
} from './lib/routine-runtime.mjs';
import { buildConsoleReadModel, recognizeConsoleBrain } from './lib/console-read-model.mjs';
import { latestRunRecords } from './lib/system-protocol.mjs';
import { saveCanvasLayout } from './lib/canvas-layout-runtime.mjs';
import {
  buildBrainGraph,
  buildRunGraph,
  buildSystemGraph,
  graphForLayout,
} from './lib/graph-read-model.mjs';
import { readRoutineRunContext } from './lib/context-snapshot-runtime.mjs';
import { readExecutionTrace } from './lib/execution-trace-runtime.mjs';
import { revokeAccessGrant } from './lib/access-runtime.mjs';
import { readPrivateRoutineOutput, writeJudgmentReceipt } from './lib/judgment-protocol.mjs';
import { readExperimentDetail } from './lib/experiment-protocol.mjs';
import {
  correctionActions,
  correctionView,
  createLearningCandidate,
  readCorrectionComparison,
  rerunWithCorrection,
} from './lib/correction-loop.mjs';

// Índice derivado do conhecimento: varre SOMENTE 01-nucleo-privado (fosso, baixo
// risco), nunca 02-dados-terceiros. Reconstruível a cada chamada; não cria verdade.
function knowledgeIndex(root) {
  const base = resolve(root, '01-nucleo-privado');
  const files = [];
  const walk = (dir) => {
    let entries;
    try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue;
      const full = resolve(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile() && entry.name.endsWith('.md')) files.push(full);
    }
  };
  walk(base);
  const domains = new Map();
  const inbound = new Map();
  const slugs = new Map();
  for (const file of files) {
    const relative = file.slice(base.length + 1);
    const domain = relative.includes('/') ? relative.slice(0, relative.indexOf('/')) : '·raiz';
    domains.set(domain, (domains.get(domain) || 0) + 1);
    const slug = relative.slice(relative.lastIndexOf('/') + 1, -3);
    slugs.set(slug, { relative, domain });
    let content = '';
    try { content = readFileSync(file, 'utf8'); } catch { continue; }
    for (const match of content.matchAll(/\[\[([^\]|#\n]+)/g)) {
      const target = match[1].trim();
      if (target) inbound.set(target, (inbound.get(target) || 0) + 1);
    }
  }
  const top = [...inbound.entries()]
    .filter(([slug]) => slugs.has(slug))
    .sort((left, right) => right[1] - left[1])
    .slice(0, 12)
    .map(([slug, count]) => ({ title: slug, count, domain: slugs.get(slug).domain, path: `01-nucleo-privado/${slugs.get(slug).relative}` }));
  const domainList = [...domains.entries()].sort((left, right) => right[1] - left[1]).slice(0, 10)
    .map(([name, count]) => ({ name, count }));
  return { total_notes: files.length, domains: domainList, most_linked: top };
}

// Fila única de decisão do cérebro — leitura fiel do objeto que o motor do
// vault materializa (gera_fila_decisao.py). O Console mostra; não substitui
// a mesa de martelo.
function decisionQueue(root) {
  try {
    const data = JSON.parse(readFileSync(resolve(root, '.automacao/_FILA-DECISAO.json'), 'utf8'));
    const open = Object.entries(data.abertos || {}).map(([key, item]) => ({
      key,
      title: item.titulo,
      category: item.categoria,
      first_seen: item.first_seen,
      last_seen: item.last_seen,
      age_days: Math.max(0, Math.round((Date.now() - Date.parse(`${item.first_seen}T12:00:00`)) / 86400000)),
    })).sort((left, right) => right.age_days - left.age_days);
    return { available: true, open, open_count: open.length, decided_total: (data.historico || []).length };
  } catch {
    return { available: false, open: [], open_count: 0, decided_total: 0 };
  }
}

// Anatomia do Cérebro — o agregador dos seis módulos + governança.
// Regra: só dados que existem; cada campo nasce de contrato (declarado),
// recibo/ledger (observado) ou derivação explícita (inferido).
function listJsonDir(root, relative) {
  try {
    return readdirSync(resolve(root, relative), { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
      .map((entry) => {
        try { return JSON.parse(readFileSync(resolve(root, relative, entry.name), 'utf8')); } catch { return null; }
      })
      .filter(Boolean);
  } catch { return []; }
}

function countDir(root, relative) {
  try { return readdirSync(resolve(root, relative)).filter((name) => !name.startsWith('.')).length; } catch { return 0; }
}

// Workspace de um Sistema — o contrato cru + tudo que foi observado dele.
function systemWorkspace(root, ref) {
  const model = buildConsoleReadModel(root);
  const system = model.systems.find((item) => item.system_id === ref || item.contract_id === ref);
  if (!system) throw new Error('not-found');
  let contract = {};
  try { contract = JSON.parse(readFileSync(resolve(root, `.cerebro/contracts/systems/${system.contract_id}.json`), 'utf8')); } catch { contract = {}; }
  const matches = (value) => value === system.system_id || value === system.contract_id;
  const records = latestRunRecords(root).filter((record) => matches(record.system_id))
    .sort((left, right) => String(right.completed_at || '').localeCompare(String(left.completed_at || '')));
  const routines = model.routines.filter((routine) => matches(routine.system_ref));
  const experiments = (model.experiments || []).filter((experiment) => matches(experiment.system_ref));
  const judgments = model.judgments.filter((item) => matches(item.system_ref));

  // fontes do sistema, desmembradas (mesma gramática da Anatomia)
  const accessReceipts = listJsonDir(root, '.cerebro/runtime/receipts/access');
  const sourceContracts = new Map(listJsonDir(root, '.cerebro/contracts/sources').map((item) => [item.source_id, item]));
  const roleIds = (contract.sources || []).map((source) => ({ role: source.role, id: source.source_id || source.role }));
  const sources = roleIds.map(({ role, id }) => {
    const sourceContract = sourceContracts.get(id) || {};
    const receipts = accessReceipts.filter((receipt) => receipt.source_ref === id && matches(receipt.system_ref));
    const last = receipts.sort((a, b) => String(b.occurred_at).localeCompare(String(a.occurred_at)))[0] || null;
    let lastSnapshot = null;
    for (const record of records) {
      for (const access of record.context_snapshot?.accesses || []) {
        if (access.source_ref?.id === id && (!lastSnapshot || record.context_snapshot.observed_at > lastSnapshot)) {
          lastSnapshot = record.context_snapshot.observed_at;
        }
      }
    }
    return {
      role, source_id: id,
      name: sourceContract.name || id,
      contract_status: sourceContract.status || null,
      binding_ref: sourceContract.connector?.binding_ref || null,
      has_credential: Boolean(sourceContract.connector?.credential_ref),
      last_access: last ? { decision: last.decision, occurred_at: last.occurred_at } : null,
      freshness_policy: sourceContract.freshness?.policy || null,
      freshness_observed: sourceContract.freshness?.observed_at || lastSnapshot || null,
    };
  });

  return {
    system,
    contract: {
      result: contract.result || null,
      capability: contract.capability || null,
      retrieval: contract.retrieval || null,
      pipeline: contract.pipeline || [],
      permissions: contract.permissions || null,
      eval: contract.eval || null,
      learning: contract.learning || null,
      trigger: contract.trigger || null,
    },
    sources,
    records,
    routines: routines.map((routine) => ({
      routine_id: routine.routine_id, name: routine.name, schedule: routine.schedule,
      health: routine.health_reason_code, binding: routine.binding, receipts: routine.receipts.length,
      access: routine.access,
    })),
    experiments,
    judgments,
  };
}

// Execuções unificadas — routine receipts + run records standalone do ledger,
// numa linha do tempo única. Cada linha nasce de recibo ou de Run Record; o
// trace é sondado no arquivo real (recorded × reconstructed × ausente) e a
// ausência de snapshot, eval ou trace aparece como lacuna, nunca como saúde.
function traceProbe(root, runId) {
  let events;
  try {
    events = readExecutionTrace(root, runId);
  } catch {
    return { status: 'unreadable', events: 0 };
  }
  if (!events.length) return { status: 'none', events: 0 };
  return {
    status: events[0].extensions?.origin === 'reconstructed' ? 'reconstructed' : 'recorded',
    events: events.length,
  };
}

function runContextView(record) {
  if (record?.protocol_version !== 2 || !record.context_snapshot) return null;
  const snapshot = record.context_snapshot;
  return {
    sources: (snapshot.accesses || []).length,
    gaps: (snapshot.gaps || []).length,
    conflicts: (snapshot.conflicts || []).length,
    retrieval_version: snapshot.retrieval_version || null,
  };
}

function runsExplorerModel(root) {
  const issues = [];
  let records = [];
  try {
    records = latestRunRecords(root);
  } catch {
    issues.push({ reason_code: 'run-ledger-invalid', ref: '.cerebro/runtime/ledger/runs.jsonl' });
  }
  const recordById = new Map(records.map((record) => [record.run_id, record]));
  let receipts = [];
  try {
    receipts = listRoutineRunReceipts(root);
  } catch {
    issues.push({ reason_code: 'routine-receipt-invalid', ref: '.cerebro/runtime/receipts/routines' });
  }
  const fromRecord = (record) => (record ? {
    system_version: record.system_version || null,
    mode: record.mode ?? null,
    chain_id: record.chain_id ?? null,
    experiment_ref: record.experiment_ref ?? null,
    handoff_count: record.handoff_refs?.length || 0,
    context: runContextView(record),
    eval_passed: record.eval?.passed ?? null,
    human_decision: record.human_decision ?? null,
    outcomes: record.outcomes?.length || 0,
  } : {
    system_version: null, mode: null, chain_id: null, experiment_ref: null,
    handoff_count: 0, context: null, eval_passed: null, human_decision: null, outcomes: 0,
  });
  const entries = receipts.map((receipt) => {
    const record = recordById.get(receipt.run_id) || null;
    return {
      run_id: receipt.run_id,
      origin: 'routine-receipt',
      selector_ref: receipt.receipt_id,
      receipt_id: receipt.receipt_id,
      receipt_ref: `routine-receipt:${receipt.receipt_id}`,
      run_record_ref: record ? `run-record:${record.run_id}` : null,
      routine_ref: receipt.routine_id,
      trigger: receipt.trigger,
      system_ref: record?.system_id || receipt.system_ref,
      status: receipt.status,
      reason_code: receipt.reason_code || null,
      started_at: receipt.started_at,
      completed_at: receipt.completed_at,
      ...fromRecord(record),
      trace: traceProbe(root, receipt.run_id),
      record,
    };
  });
  const receiptRunIds = new Set(receipts.map((receipt) => receipt.run_id));
  for (const record of records) {
    if (receiptRunIds.has(record.run_id)) continue;
    entries.push({
      run_id: record.run_id,
      origin: 'run-record',
      selector_ref: `run-record:${record.run_id}`,
      receipt_id: null,
      receipt_ref: null,
      run_record_ref: `run-record:${record.run_id}`,
      routine_ref: record.extensions?.routine_ref || null,
      trigger: null,
      system_ref: record.system_id,
      status: record.status,
      reason_code: null,
      started_at: record.started_at,
      completed_at: record.completed_at || null,
      ...fromRecord(record),
      trace: traceProbe(root, record.run_id),
      record,
    });
  }
  entries.sort((left, right) => String(right.completed_at || right.started_at || '')
    .localeCompare(String(left.completed_at || left.started_at || '')));
  return {
    generated_at: new Date().toISOString(),
    privacy: { content_shared_with_inevita: false, prompt_exposed: false, raw_output_exposed: false },
    runs: entries,
    issues,
  };
}

function anatomyModel(root) {
  const model = buildConsoleReadModel(root);
  const records = latestRunRecords(root);
  const queue = decisionQueue(root);
  const accessReceipts = listJsonDir(root, '.cerebro/runtime/receipts/access');
  const sourceContracts = new Map(listJsonDir(root, '.cerebro/contracts/sources').map((contract) => [contract.source_id, contract]));

  // rodada do motor (Operação do Cérebro)
  let round = null;
  try { round = JSON.parse(readFileSync(resolve(root, '.automacao/_ULTIMA-RODADA.json'), 'utf8')); } catch { round = null; }
  const roundTask = (name) => round?.tarefas?.find((task) => task.nome.toLowerCase().includes(name)) || null;

  // identidade: âncoras + decisões recentes (documentos humanos datados)
  let anchors = [];
  try {
    anchors = readdirSync(resolve(root, '01-nucleo-privado/conceitos'))
      .filter((name) => name.endsWith('.md') && !name.startsWith('_') && !name.includes('excalidraw'))
      .map((name) => name.slice(0, -3));
  } catch { anchors = []; }
  let decisions = [];
  try {
    decisions = readdirSync(resolve(root, '01-nucleo-privado/decisoes'))
      .filter((name) => /^\d{4}-\d{2}-\d{2}/.test(name) && name.endsWith('.md'))
      .sort().slice(-5).reverse()
      .map((name) => ({ date: name.slice(0, 10), title: name.slice(11, -3).replaceAll('-', ' ') }));
  } catch { decisions = []; }

  // memória: fonte desmembrada em contrato × binding × grant × acesso × frescor
  const grantsBySource = new Map();
  for (const routine of model.routines) {
    for (const access of routine.access) {
      grantsBySource.set(access.source_ref, (grantsBySource.get(access.source_ref) || 0) + 1);
    }
  }
  const lastAccessBySource = new Map();
  for (const receipt of accessReceipts) {
    const previous = lastAccessBySource.get(receipt.source_ref);
    if (!previous || receipt.occurred_at > previous.occurred_at) {
      lastAccessBySource.set(receipt.source_ref, { decision: receipt.decision, occurred_at: receipt.occurred_at });
    }
  }
  const lastSnapshotBySource = new Map();
  for (const record of records) {
    for (const access of record.context_snapshot?.accesses || []) {
      const id = access.source_ref?.id;
      if (!id) continue;
      const previous = lastSnapshotBySource.get(id);
      const observedAt = record.context_snapshot.observed_at;
      if (!previous || observedAt > previous) lastSnapshotBySource.set(id, observedAt);
    }
  }
  const sources = model.sources.map((source) => {
    const contract = sourceContracts.get(source.source_id) || {};
    return {
      source_id: source.source_id,
      name: source.name,
      contract_status: source.status,
      binding_ref: contract.connector?.binding_ref || null,
      has_credential: Boolean(contract.connector?.credential_ref),
      grants: grantsBySource.get(source.source_id) || 0,
      last_access: lastAccessBySource.get(source.source_id) || null,
      freshness_policy: contract.freshness?.policy || null,
      freshness_observed: contract.freshness?.observed_at || lastSnapshotBySource.get(source.source_id) || null,
    };
  });

  // atenção: contexto declarado vs observado
  const snapshots = records.filter((record) => record.context_snapshot?.accesses?.length);
  const contextGaps = records.reduce((total, record) => total
    + (record.context_snapshot?.gaps?.length || 0) + (record.context_snapshot?.conflicts?.length || 0), 0);
  const retrievalDeclared = model.systems.filter((system) => system.retrieval_status === 'declared').length;
  const sourcesNeverObserved = sources.filter((source) => !source.last_access && !source.freshness_observed).length;

  // execução
  const byStage = { mapped: 0, configured: 0, active: 0 };
  for (const system of model.systems) byStage[system.migration_stage] = (byStage[system.migration_stage] || 0) + 1;
  const recentRuns = [...records].sort((left, right) => String(right.completed_at || '').localeCompare(String(left.completed_at || ''))).slice(0, 5)
    .map((record) => ({ run_id: record.run_id, system: record.system_id, mode: record.mode, status: record.status, completed_at: record.completed_at, eval_passed: record.eval?.passed ?? null }));

  // julgamento
  const routinePending = model.counts.judgments;
  const oldest = queue.open[0] || null;

  // aprendizado
  const learningCandidates = countDir(root, '.cerebro/runtime/learning-candidates');
  const corrections = countDir(root, '.cerebro/runtime/corrections');
  const decidedWithOutcomes = records.filter((record) => (record.outcomes || []).length).length;

  // governança
  const grantsTotal = model.routines.flatMap((routine) => routine.access).length;
  const denies = accessReceipts.filter((receipt) => receipt.decision === 'deny' || receipt.decision === 'denied').length;
  const piiTask = roundTask('schema');
  const goldenTask = roundTask('golden') || roundTask('eval do c');

  return {
    generated_at: new Date().toISOString(),
    identity: {
      canonical: '01-nucleo-privado/_SISTEMAS.md',
      anchors,
      recent_decisions: decisions,
      last_receipt: decisions[0]?.date || null,
    },
    memory: {
      sources,
      distill_backlog: roundTask('destila')?.resumo || null,
      canonical: '.cerebro/contracts/sources/',
    },
    attention: {
      systems_total: model.systems.length,
      retrieval_declared: retrievalDeclared,
      runs_with_context: snapshots.length,
      context_gaps: contextGaps,
      sources_never_observed: sourcesNeverObserved,
    },
    execution: {
      by_stage: byStage,
      routines_active: model.today.active.length,
      recent_runs: recentRuns,
      evals_passed: records.filter((record) => record.eval?.passed === true).length,
      evals_total: records.filter((record) => record.eval?.passed !== undefined && record.eval?.passed !== null).length,
      handoff_receipts: countDir(root, '.cerebro/runtime/receipts/handoffs') || countDir(root, '.cerebro/runtime/handoffs'),
    },
    judgment: {
      vault_queue_open: queue.open_count,
      vault_queue_decided: queue.decided_total,
      oldest_days: oldest?.age_days ?? null,
      oldest_title: oldest?.title || null,
      late7: queue.open.filter((item) => item.age_days >= 7).length,
      late30: queue.open.filter((item) => item.age_days >= 30).length,
      routine_pending: routinePending,
    },
    learning: {
      candidates: learningCandidates,
      corrections,
      runs_with_outcomes: decidedWithOutcomes,
      promotions_canonical: '01-nucleo-privado/PROMOCOES.md',
      improvements_canonical: '01-nucleo-privado/sistemas/_MELHORIAS.md',
    },
    governance: {
      grants_total: grantsTotal,
      access_receipts: accessReceipts.length,
      denies,
      pii_gate: piiTask ? { state: piiTask.estado, summary: piiTask.resumo } : null,
      golden_set: goldenTask ? { state: goldenTask.estado, summary: goldenTask.resumo } : null,
      protocol_score: model.compatibility?.score?.percent ?? null,
    },
    brain_ops: {
      system_ref: 'cerebro-operacional',
      round_at: round?.quando || null,
      tasks: (round?.tarefas || []).map((task) => ({ name: task.nome, state: task.estado, summary: task.resumo })),
    },
  };
}

const COOKIE_NAME = 'cerebro_console_session';
const MAX_BODY_BYTES = 32 * 1024;
const STATIC_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'console');
const SAFE_ACTOR_RE = /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/;
const SAFE_REF_RE = /^[A-Za-z0-9][A-Za-z0-9_./:-]{0,255}$/;

function opaqueToken() {
  return randomBytes(32).toString('base64url');
}

function exactEqual(left, right) {
  if (typeof left !== 'string' || typeof right !== 'string') return false;
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

function cookies(request) {
  return Object.fromEntries(String(request.headers.cookie || '').split(';').map((part) => part.trim()).filter(Boolean).map((part) => {
    const separator = part.indexOf('=');
    return separator === -1 ? [part, ''] : [part.slice(0, separator), part.slice(separator + 1)];
  }));
}

function headers(type = 'application/json; charset=utf-8') {
  return {
    'Content-Type': type,
    'Cache-Control': 'no-store, max-age=0',
    'Referrer-Policy': 'no-referrer',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Content-Security-Policy': "default-src 'self'; style-src 'self'; script-src 'self'; connect-src 'self'; img-src 'self' data:; base-uri 'none'; frame-ancestors 'none'",
  };
}

function send(response, status, value, extraHeaders = {}) {
  const body = typeof value === 'string' ? value : `${JSON.stringify(value)}\n`;
  response.writeHead(status, { ...headers(typeof value === 'string' ? 'text/plain; charset=utf-8' : undefined), ...extraHeaders });
  response.end(body);
}

function sendStatic(response, file, type, extraHeaders = {}) {
  // Console local em iteração constante: nunca deixar o navegador congelar um asset.
  response.writeHead(200, { ...headers(type), 'Cache-Control': 'no-store', ...extraHeaders });
  response.end(readFileSync(resolve(STATIC_ROOT, file)));
}

async function body(request) {
  if (!String(request.headers['content-type'] || '').toLowerCase().startsWith('application/json')) {
    throw new Error('content-type-required');
  }
  let size = 0;
  const chunks = [];
  for await (const chunk of request) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) throw new Error('request-too-large');
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
  } catch {
    throw new Error('json-invalid');
  }
}

function safeReason(error) {
  const message = error instanceof Error ? error.message : String(error);
  return /^[a-z0-9-]+$/.test(message) ? message : 'request-failed';
}

function assertMutation(request, sessionToken, csrfToken, payload) {
  if (!exactEqual(cookies(request)[COOKIE_NAME], sessionToken)) throw new Error('session-required');
  if (!exactEqual(String(request.headers['x-cerebro-csrf'] || ''), csrfToken)) throw new Error('csrf-invalid');
  if (payload.confirm !== true) throw new Error('confirmation-required');
}

function actor(payload) {
  if (!SAFE_ACTOR_RE.test(payload.approved_by || '')) throw new Error('approved-by-invalid');
  return payload.approved_by;
}

function actionFrom(pathname) {
  const match = pathname.match(/^\/api\/routines\/([a-z0-9][a-z0-9-]{0,63})\/(run|activate|pause|resume|confirm-legacy-pause)$/);
  return match ? { routineId: match[1], action: match[2] } : null;
}

function outputReceiptFrom(pathname) {
  const match = pathname.match(/^\/api\/runs\/([A-Za-z0-9][A-Za-z0-9_-]{0,127})\/output$/);
  return match?.[1] || null;
}

function contextReceiptFrom(pathname) {
  const match = pathname.match(/^\/api\/runs\/([A-Za-z0-9][A-Za-z0-9_-]{0,127})\/context$/);
  return match?.[1] || null;
}

function grantRevocationFrom(pathname) {
  const match = pathname.match(/^\/api\/grants\/([A-Za-z0-9][A-Za-z0-9_-]{0,127})\/revoke$/);
  return match?.[1] || null;
}

function judgmentReceiptFrom(pathname) {
  const match = pathname.match(/^\/api\/runs\/([A-Za-z0-9][A-Za-z0-9_-]{0,127})\/judgments$/);
  return match?.[1] || null;
}

function correctionActionFrom(pathname) {
  const match = pathname.match(/^\/api\/runs\/([A-Za-z0-9][A-Za-z0-9_-]{0,127})\/(rerun-with-correction|learning-candidates)$/);
  return match ? { receiptId: match[1], action: match[2] } : null;
}

function comparisonReceiptFrom(pathname) {
  const match = pathname.match(/^\/api\/runs\/([A-Za-z0-9][A-Za-z0-9_-]{0,127})\/comparison$/);
  return match?.[1] || null;
}

function graphRequestFrom(pathname) {
  if (pathname === '/api/graphs/brain') return { type: 'brain', ref: null };
  const system = pathname.match(/^\/api\/graphs\/systems\/([a-z0-9][a-z0-9-]{0,63})$/);
  if (system) return { type: 'system', ref: system[1] };
  const run = pathname.match(/^\/api\/graphs\/runs\/([A-Za-z0-9][A-Za-z0-9_-]{0,127})$/);
  if (run) return { type: 'run', ref: run[1] };
  const runRecord = pathname.match(/^\/api\/graphs\/run-records\/([A-Za-z0-9][A-Za-z0-9_.:-]{0,127})$/);
  return runRecord ? { type: 'run-record', ref: runRecord[1] } : null;
}

function graphLayoutFrom(pathname) {
  const match = pathname.match(/^\/api\/graphs\/layouts\/([a-z0-9][a-z0-9-]{0,127})$/);
  return match?.[1] || null;
}

function experimentDetailFrom(pathname) {
  const match = pathname.match(/^\/api\/experiments\/(EXP-[A-Za-z0-9_-]{1,48})$/);
  return match?.[1] || null;
}

function hostAllowed(request) {
  const value = String(request.headers.host || '').toLowerCase();
  const hostname = value.startsWith('[') ? value.slice(0, value.indexOf(']') + 1) : value.split(':', 1)[0];
  return ['127.0.0.1', 'localhost', '[::1]'].includes(hostname);
}

export function createConsoleServer({
  root,
  spawn,
  spawnCollector,
  clock = () => new Date(),
  sessionToken = opaqueToken(),
  csrfToken = opaqueToken(),
} = {}) {
  const brainRoot = resolve(root || process.cwd());
  recognizeConsoleBrain(brainRoot);
  const server = createServer(async (request, response) => {
    const url = new URL(request.url || '/', 'http://127.0.0.1');
    const sessionCookie = `${COOKIE_NAME}=${sessionToken}; HttpOnly; SameSite=Strict; Path=/`;
    try {
      if (!hostAllowed(request)) {
        send(response, 421, { reason_code: 'host-not-allowed' });
        return;
      }
      if (request.method === 'GET' && (url.pathname === '/' || url.pathname === '/rotinas')) {
        sendStatic(response, 'index.html', 'text/html; charset=utf-8', { 'Set-Cookie': sessionCookie });
        return;
      }
      if (request.method === 'GET' && url.pathname === '/app.js') {
        sendStatic(response, 'app.js', 'text/javascript; charset=utf-8');
        return;
      }
      if (request.method === 'GET' && url.pathname === '/canvas.bundle.js') {
        sendStatic(response, 'canvas.bundle.js', 'text/javascript; charset=utf-8');
        return;
      }
      if (request.method === 'GET' && url.pathname === '/styles.css') {
        sendStatic(response, 'styles.css', 'text/css; charset=utf-8');
        return;
      }
      if (request.method === 'GET' && url.pathname === '/favicon.ico') {
        response.writeHead(204, headers());
        response.end();
        return;
      }
      if (request.method === 'GET' && url.pathname.startsWith('/files/')) {
        if (!exactEqual(cookies(request)[COOKIE_NAME], sessionToken)) throw new Error('session-required');
        const relative = decodeURIComponent(url.pathname.slice('/files/'.length));
        const resolved = resolve(brainRoot, relative);
        if (!resolved.startsWith(resolve(brainRoot) + '/') || !resolved.endsWith('.html')) throw new Error('not-found');
        let content;
        try { content = readFileSync(resolved); } catch { throw new Error('not-found'); }
        response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
        response.end(content);
        return;
      }
      if (request.method === 'GET' && url.pathname.startsWith('/api/systems/') && url.pathname.endsWith('/workspace')) {
        if (!exactEqual(cookies(request)[COOKIE_NAME], sessionToken)) throw new Error('session-required');
        const ref = decodeURIComponent(url.pathname.slice('/api/systems/'.length, -'/workspace'.length));
        if (!SAFE_REF_RE.test(ref)) throw new Error('not-found');
        send(response, 200, systemWorkspace(brainRoot, ref));
        return;
      }
      if (request.method === 'GET' && url.pathname === '/api/anatomy') {
        if (!exactEqual(cookies(request)[COOKIE_NAME], sessionToken)) throw new Error('session-required');
        send(response, 200, anatomyModel(brainRoot));
        return;
      }
      if (request.method === 'GET' && url.pathname === '/api/runs') {
        if (!exactEqual(cookies(request)[COOKIE_NAME], sessionToken)) throw new Error('session-required');
        send(response, 200, runsExplorerModel(brainRoot));
        return;
      }
      if (request.method === 'GET' && url.pathname === '/api/decisions') {
        if (!exactEqual(cookies(request)[COOKIE_NAME], sessionToken)) throw new Error('session-required');
        send(response, 200, decisionQueue(brainRoot));
        return;
      }
      if (request.method === 'GET' && url.pathname === '/api/knowledge') {
        if (!exactEqual(cookies(request)[COOKIE_NAME], sessionToken)) throw new Error('session-required');
        send(response, 200, knowledgeIndex(brainRoot));
        return;
      }
      if (request.method === 'GET' && url.pathname === '/api/session') {
        if (!exactEqual(cookies(request)[COOKIE_NAME], sessionToken)) throw new Error('session-required');
        send(response, 200, { csrf_token: csrfToken, expires: 'process-lifetime' });
        return;
      }
      if (request.method === 'GET' && url.pathname === '/api/console') {
        if (!exactEqual(cookies(request)[COOKIE_NAME], sessionToken)) throw new Error('session-required');
        send(response, 200, buildConsoleReadModel(brainRoot, { now: clock() }));
        return;
      }
      const experimentId = request.method === 'GET' ? experimentDetailFrom(url.pathname) : null;
      if (experimentId) {
        if (!exactEqual(cookies(request)[COOKIE_NAME], sessionToken)) throw new Error('session-required');
        send(response, 200, readExperimentDetail(brainRoot, experimentId));
        return;
      }
      const graphRequest = request.method === 'GET' ? graphRequestFrom(url.pathname) : null;
      if (graphRequest) {
        if (!exactEqual(cookies(request)[COOKIE_NAME], sessionToken)) throw new Error('session-required');
        const graph = graphRequest.type === 'brain' ? buildBrainGraph(brainRoot, { now: clock() })
          : graphRequest.type === 'system' ? buildSystemGraph(brainRoot, graphRequest.ref)
            : graphRequest.type === 'run-record' ? buildRunGraph(brainRoot, `run-record:${graphRequest.ref}`)
              : buildRunGraph(brainRoot, graphRequest.ref);
        send(response, 200, graph);
        return;
      }
      const graphLayoutKey = request.method === 'PUT' ? graphLayoutFrom(url.pathname) : null;
      if (graphLayoutKey) {
        const payload = await body(request);
        assertMutation(request, sessionToken, csrfToken, payload);
        const approvedBy = actor(payload);
        const graph = graphForLayout(brainRoot, graphLayoutKey);
        const allowedNodes = new Set(graph.nodes.map((node) => node.id));
        if (!payload.positions || typeof payload.positions !== 'object' || Array.isArray(payload.positions)) {
          throw new Error('canvas-layout-positions-invalid');
        }
        if (Object.keys(payload.positions).some((nodeId) => !allowedNodes.has(nodeId))) {
          throw new Error('canvas-layout-node-unknown');
        }
        const saved = saveCanvasLayout(brainRoot, graphLayoutKey, payload.positions, approvedBy, { clock });
        send(response, 200, {
          status: 'saved', layout_key: saved.layout_key, node_count: Object.keys(saved.positions).length,
          topology_changed: false,
        });
        return;
      }
      const outputReceiptId = request.method === 'GET' ? outputReceiptFrom(url.pathname) : null;
      if (outputReceiptId) {
        if (!exactEqual(cookies(request)[COOKIE_NAME], sessionToken)) throw new Error('session-required');
        const outputDetail = readPrivateRoutineOutput(brainRoot, outputReceiptId);
        let contextAvailable = false;
        try {
          readRoutineRunContext(brainRoot, outputReceiptId);
          contextAvailable = true;
        } catch (error) {
          if (!(error instanceof Error) || error.message !== 'context-not-recorded') throw error;
        }
        send(response, 200, {
          ...outputDetail,
          correction: correctionView(brainRoot, outputReceiptId),
          correction_actions: correctionActions(brainRoot, outputReceiptId),
          context_available: contextAvailable,
        });
        return;
      }
      const contextReceiptId = request.method === 'GET' ? contextReceiptFrom(url.pathname) : null;
      if (contextReceiptId) {
        if (!exactEqual(cookies(request)[COOKIE_NAME], sessionToken)) throw new Error('session-required');
        send(response, 200, readRoutineRunContext(brainRoot, contextReceiptId));
        return;
      }
      const comparisonReceiptId = request.method === 'GET' ? comparisonReceiptFrom(url.pathname) : null;
      if (comparisonReceiptId) {
        if (!exactEqual(cookies(request)[COOKIE_NAME], sessionToken)) throw new Error('session-required');
        send(response, 200, readCorrectionComparison(brainRoot, comparisonReceiptId));
        return;
      }
      const judgmentReceiptId = request.method === 'POST' ? judgmentReceiptFrom(url.pathname) : null;
      if (judgmentReceiptId) {
        const payload = await body(request);
        assertMutation(request, sessionToken, csrfToken, payload);
        const approvedBy = actor(payload);
        if (!['approved', 'changes-requested', 'rejected'].includes(payload.verdict)) {
          throw new Error('judgment-verdict-invalid');
        }
        if (!['none', 'propose-action'].includes(payload.action_intent)) {
          throw new Error('judgment-action-intent-invalid');
        }
        if (typeof payload.note !== 'string' || payload.note.length > 2000) throw new Error('judgment-note-invalid');
        if ((payload.verdict !== 'approved' || payload.action_intent === 'propose-action') && !payload.note.trim()) {
          throw new Error('judgment-note-required');
        }
        const result = writeJudgmentReceipt(brainRoot, judgmentReceiptId, {
          verdict: payload.verdict,
          actionIntent: payload.action_intent,
          note: payload.note,
          actorRef: approvedBy,
          clock,
        });
        send(response, 200, {
          status: 'recorded',
          judgment_ref: result.ref,
          summary: result.summary,
          external_action_executed: false,
        });
        return;
      }
      const correctionAction = request.method === 'POST' ? correctionActionFrom(url.pathname) : null;
      if (correctionAction) {
        const payload = await body(request);
        assertMutation(request, sessionToken, csrfToken, payload);
        const approvedBy = actor(payload);
        if (correctionAction.action === 'rerun-with-correction') {
          const result = await rerunWithCorrection(brainRoot, correctionAction.receiptId, approvedBy, {
            spawn, spawnCollector, clock,
          });
          send(response, 200, {
            status: result.status,
            correction_ref: result.correction_ref,
            resulting_receipt_ref: result.result.receipt_ref,
            reason_code: result.result.receipt.reason_code,
            correction_shared_with_provider: result.correction.privacy.correction_shared_with_provider,
            external_action_executed: false,
          });
        } else {
          const result = createLearningCandidate(brainRoot, correctionAction.receiptId, approvedBy, { clock });
          send(response, 200, {
            status: result.status,
            learning_candidate_ref: result.ref,
            occurrences: result.value.occurrences,
            promotion_threshold: result.value.promotion_threshold,
            replay_status: result.value.replay_status,
            motor_changed: false,
            external_action_executed: false,
          });
        }
        return;
      }
      const grantId = request.method === 'POST' ? grantRevocationFrom(url.pathname) : null;
      if (grantId) {
        const payload = await body(request);
        assertMutation(request, sessionToken, csrfToken, payload);
        const approvedBy = actor(payload);
        const result = revokeAccessGrant(brainRoot, grantId, approvedBy, { now: clock() });
        send(response, 200, {
          status: result.status,
          grant_ref: `access-grant:${grantId}`,
          revocation_receipt_ref: result.receipt_ref,
          effect: 'future-only',
          past_artifacts_deleted: false,
          external_action_executed: false,
        });
        return;
      }
      const action = request.method === 'POST' ? actionFrom(url.pathname) : null;
      if (action) {
        const payload = await body(request);
        assertMutation(request, sessionToken, csrfToken, payload);
        let result;
        if (action.action === 'run') {
          result = await runRoutine(brainRoot, action.routineId, {
            trigger: 'manual', spawn, spawnCollector, clock,
          });
          send(response, 200, {
            status: result.status,
            receipt_ref: result.receipt_ref,
            reason_code: result.receipt.reason_code,
          });
          return;
        }
        const approvedBy = actor(payload);
        if (action.action === 'activate') {
          if (!SAFE_REF_RE.test(payload.evidence_ref || '')) throw new Error('evidence-ref-invalid');
          result = activateRoutine(brainRoot, action.routineId, payload.evidence_ref, approvedBy, { clock });
        } else if (action.action === 'pause') {
          result = pauseRoutine(brainRoot, action.routineId, approvedBy, { clock });
        } else if (action.action === 'resume') {
          result = resumeRoutine(brainRoot, action.routineId, approvedBy, { clock });
        } else {
          if (!SAFE_REF_RE.test(payload.evidence_ref || '')) throw new Error('evidence-ref-invalid');
          result = confirmLegacySchedulePaused(brainRoot, action.routineId, payload.evidence_ref, approvedBy, { clock });
        }
        send(response, 200, { status: 'updated', state: result });
        return;
      }
      send(response, 404, { reason_code: 'not-found' });
    } catch (error) {
      const reasonCode = safeReason(error);
      const status = reasonCode === 'session-required' || reasonCode === 'csrf-invalid' ? 403
        : reasonCode === 'not-found' ? 404 : 400;
      send(response, status, { reason_code: reasonCode });
    }
  });
  return { server, sessionToken, csrfToken, root: brainRoot };
}

function option(name) {
  const prefix = `--${name}=`;
  return process.argv.find((argument) => argument.startsWith(prefix))?.slice(prefix.length) || '';
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(option('port') || 4782);
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    console.error('✗ port inválida');
    process.exit(1);
  }
  try {
    const instance = createConsoleServer({ root: option('root') || process.env.CEREBRO_INSTALL_ROOT || process.cwd() });
    instance.server.listen(port, '127.0.0.1', () => {
      const address = instance.server.address();
      console.log(`Company Brain Console · http://127.0.0.1:${address.port}`);
      console.log('Contexto privado permanece nesta máquina. Abrir a página não executa modelos.');
    });
  } catch (error) {
    console.error(`✗ ${safeReason(error)}`);
    process.exit(1);
  }
}
