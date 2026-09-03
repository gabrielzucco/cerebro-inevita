#!/usr/bin/env node

import { randomBytes, timingSafeEqual } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, resolve, sep } from 'node:path';
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
import { buildConsoleReadModel, listConsoleSystems, recognizeConsoleBrain } from './lib/console-read-model.mjs';
import { buildSkillReadModel } from './lib/skill-read-model.mjs';
import { buildSocietyCatalogReadModel } from './lib/society-catalog-read-model.mjs';
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
  applyDecisionCase,
  listDecisionCases,
  prepareDecisionCase,
  previewDecisionCase,
  rollbackDecisionCase,
} from './lib/decision-case.mjs';
import {
  correctionActions,
  correctionView,
  createLearningCandidate,
  readCorrectionComparison,
  rerunWithCorrection,
} from './lib/correction-loop.mjs';
import { systemInterfaceHealth } from './lib/system-interface-health.mjs';
import {
  applyManagedBrainUpdate,
  buildBrainUpdateCenter,
  checkLatestBrainRelease,
} from './lib/brain-update-center.mjs';

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

function listJsonTree(root, relative) {
  const values = [];
  const walk = (directory) => {
    let entries;
    try { entries = readdirSync(directory, { withFileTypes: true }); } catch { return; }
    for (const entry of entries) {
      const target = resolve(directory, entry.name);
      if (entry.isDirectory()) walk(target);
      else if (entry.isFile() && entry.name.endsWith('.json')) {
        try { values.push(JSON.parse(readFileSync(target, 'utf8'))); } catch { /* recibo inválido não vira verdade */ }
      }
    }
  };
  walk(resolve(root, relative));
  return values;
}

function countDir(root, relative) {
  try { return readdirSync(resolve(root, relative)).filter((name) => !name.startsWith('.')).length; } catch { return 0; }
}

function healthRunRecords(root) {
  let lines = [];
  try {
    lines = readFileSync(resolve(root, '.cerebro/runtime/ledger/runs.jsonl'), 'utf8')
      .split('\n').map((line) => line.trim()).filter(Boolean);
  } catch { return []; }
  const latest = new Map();
  for (const line of lines) {
    try {
      const record = JSON.parse(line);
      if (typeof record.run_id === 'string') latest.set(record.run_id, record);
    } catch { /* linha inválida não pode fabricar saúde */ }
  }
  return [...latest.values()];
}

function oneDecimalPercent(value) {
  return Number.isFinite(value) && value >= 0 && value <= 1
    ? Math.round(value * 1000) / 10
    : null;
}

export function retrievalHealthModel(root) {
  const providers = listJsonDir(root, '.cerebro/contracts/providers');
  const provider = providers.find((item) => item.status === 'active') || providers[0] || null;
  const indexReceipts = listJsonDir(root, '.cerebro/runtime/receipts/indexing')
    .filter((receipt) => receipt.status === 'completed' && receipt.benchmark)
    .sort((left, right) => String(left.completed_at || left.started_at || '')
      .localeCompare(String(right.completed_at || right.started_at || '')));
  const currentIndex = indexReceipts.at(-1) || null;
  let runtimeHealth = null;
  try { runtimeHealth = JSON.parse(readFileSync(resolve(root, '.cerebro/runtime/retrieval/health.json'), 'utf8')); } catch { runtimeHealth = null; }

  const retrievalReceipts = listJsonDir(root, '.cerebro/runtime/receipts/retrieval');
  const decisions = { accepted: 0, insufficient_evidence: 0, retrieval_unavailable: 0 };
  for (const receipt of retrievalReceipts) {
    if (Object.hasOwn(decisions, receipt.decision)) decisions[receipt.decision] += 1;
  }
  const latencies = retrievalReceipts.map((receipt) => receipt.latency_ms)
    .filter(Number.isFinite).sort((left, right) => left - right);
  const lastRetrievalAt = retrievalReceipts
    .map((receipt) => receipt.completed_at || receipt.started_at).filter(Boolean).sort().at(-1) || null;

  const runs = healthRunRecords(root);
  const snapshots = runs.filter((record) => record.protocol_version === 2 && record.context_snapshot);
  const completeSnapshots = snapshots.filter((record) => ['accesses', 'gaps', 'conflicts']
    .every((field) => Array.isArray(record.context_snapshot?.[field])));
  const benchmark = currentIndex?.benchmark || null;
  const qualityPercent = oneDecimalPercent(benchmark?.hit_at_3);
  const falsePositivePercent = oneDecimalPercent(benchmark?.false_positive_rate);

  return {
    generated_at: new Date().toISOString(),
    quality: {
      measured: qualityPercent !== null && Number.isFinite(benchmark?.cases) && benchmark.cases > 0,
      metric: 'hit_at_3',
      percent: qualityPercent,
      cases: Number.isFinite(benchmark?.cases) ? benchmark.cases : null,
      false_positive_percent: falsePositivePercent,
      gate_passed: typeof benchmark?.gate_passed === 'boolean' ? benchmark.gate_passed : null,
      measured_at: currentIndex?.completed_at || null,
      receipt_ref: currentIndex?.receipt_id ? `source-index-receipt:${currentIndex.receipt_id}` : null,
    },
    index: {
      status: currentIndex?.status || 'unavailable',
      documents: Number.isFinite(currentIndex?.document_count) ? currentIndex.document_count : null,
      orphans: Array.isArray(currentIndex?.orphan_refs) ? currentIndex.orphan_refs.length : null,
      updated_at: currentIndex?.completed_at || null,
      provider_ref: currentIndex?.provider_ref || provider?.provider_id || null,
    },
    provider: {
      provider_id: provider?.provider_id || currentIndex?.provider_ref || null,
      name: provider?.name || null,
      version: provider?.version || currentIndex?.provider_version || null,
      status: provider?.status || null,
      implementation: provider?.driver?.implementation || currentIndex?.driver?.implementation || null,
      implementation_version: provider?.driver?.implementation_version || currentIndex?.driver?.implementation_version || null,
      assurance: provider?.assurance || null,
    },
    operation: {
      current_status: runtimeHealth?.status || (provider ? 'unknown' : 'unavailable'),
      circuit: runtimeHealth?.circuit || null,
      consecutive_failures: Number.isFinite(runtimeHealth?.consecutive_failures) ? runtimeHealth.consecutive_failures : null,
      last_success_at: runtimeHealth?.last_success_at || null,
      last_retrieval_at: lastRetrievalAt,
      receipts: retrievalReceipts.length,
      decisions,
      median_latency_ms: latencies.length ? latencies[Math.floor(latencies.length / 2)] : null,
    },
    snapshots: {
      runs: runs.length,
      observed: snapshots.length,
      complete: completeSnapshots.length,
      gaps: snapshots.reduce((total, record) => total + (record.context_snapshot?.gaps?.length || 0), 0),
      conflicts: snapshots.reduce((total, record) => total + (record.context_snapshot?.conflicts?.length || 0), 0),
    },
    privacy: {
      content_exposed: false,
      query_exposed: false,
      raw_error_exposed: false,
      local_only: provider?.privacy?.local_only !== false,
    },
    comparability: {
      network_ready: false,
      requires: ['benchmark_version', 'case_set', 'corpus_policy'],
    },
  };
}

function retrievalReceiptId(record) {
  for (const access of record.context_snapshot?.accesses || []) {
    const match = String(access.query || '').match(/retrieval-receipt:(retrieval-receipt-[a-z0-9-]+)/i);
    if (match) return match[1];
  }
  return null;
}

function safeIssue(issue) {
  if (typeof issue === 'string') return { reason_code: issue };
  return {
    source_role: issue?.source_role || issue?.role || null,
    reason_code: issue?.reason_code || issue?.code || issue?.status || 'not-declared',
  };
}

function runIntegrity(record, retrievalReceipt) {
  const snapshot = record.context_snapshot;
  const accesses = Array.isArray(snapshot?.accesses) ? snapshot.accesses : [];
  const gaps = Array.isArray(snapshot?.gaps) ? snapshot.gaps : [];
  const conflicts = Array.isArray(snapshot?.conflicts) ? snapshot.conflicts : [];
  const fallbacks = Array.isArray(snapshot?.fallbacks) ? snapshot.fallbacks : [];
  const references = accesses.reduce((total, access) => total
    + (Array.isArray(access.selected_refs) ? access.selected_refs.length : 0), 0);
  const freshnessMarkers = accesses.filter((access) => Boolean(access.freshness_marker)).length;
  const reasons = [];

  if (record.status !== 'completed') reasons.push('run-not-completed');
  if (!snapshot) reasons.push('context-snapshot-missing');
  if (retrievalReceipt?.decision === 'retrieval_unavailable') reasons.push('retrieval-unavailable');
  if (conflicts.length) reasons.push('unresolved-conflict');
  const blocked = reasons.length > 0;

  if (!blocked) {
    if (gaps.length) reasons.push('context-gap');
    if (fallbacks.length) reasons.push('fallback-used');
    if (!accesses.length || !references) reasons.push('references-missing');
    if (accesses.length && freshnessMarkers !== accesses.length) reasons.push('freshness-not-verifiable');
    if (record.eval?.passed === null || record.eval?.passed === undefined) reasons.push('eval-pending');
    if (retrievalReceipt?.decision === 'insufficient_evidence') reasons.push('insufficient-evidence');
  }

  return {
    state: blocked ? 'blocked' : reasons.length ? 'limited' : 'complete',
    reasons,
    accesses: accesses.length,
    references,
    freshness_markers: freshnessMarkers,
    gaps: gaps.map(safeIssue),
    conflicts: conflicts.map(safeIssue),
    fallbacks: fallbacks.map(safeIssue),
  };
}

const NATIVE_CAPABILITY_SPEC = [
  {
    id: 'sources',
    name: 'Conectar e observar Fontes',
    promise: 'Fazer a realidade entrar sem tirar o dado da sua casa de verdade.',
    skill_ids: ['fonte', 'revisar'],
    action: { kind: 'brain-mode', ref: 'memory', label: 'Abrir memória' },
    consumes: (contract) => Array.isArray(contract.sources) && contract.sources.length > 0,
  },
  {
    id: 'memory',
    name: 'Processar e destilar memória',
    promise: 'Transformar material bruto em contexto aprovado que pode voltar a trabalhar.',
    skill_ids: ['guardar', 'daily', 'reindex'],
    action: { kind: 'brain-mode', ref: 'memory', label: 'Ver ciclo da memória' },
    consumes: (contract) => Array.isArray(contract.sources) && contract.sources.length > 0,
  },
  {
    id: 'retrieval',
    name: 'Recuperar contexto',
    promise: 'Selecionar evidência relevante, declarar gaps e se abster quando não há base.',
    skill_ids: ['teste'],
    action: { kind: 'brain-mode', ref: 'recovery', label: 'Ver recuperação' },
    consumes: (contract) => Boolean(contract.retrieval),
  },
  {
    id: 'structure',
    name: 'Estruturar operações e Sistemas',
    promise: 'Converter trabalho observado em contratos, pipelines, gates e resultados repetíveis.',
    skill_ids: ['arquiteto', 'sistematizar'],
    action: { kind: 'view', ref: 'systems', label: 'Abrir Sistemas' },
    consumes: () => true,
  },
  {
    id: 'evaluation',
    name: 'Testar e avaliar',
    promise: 'Comparar cada execução à régua declarada sem confundir output com resultado.',
    skill_ids: ['teste', 'operar'],
    action: { kind: 'brain-mode', ref: 'recovery', label: 'Inspecionar Runs' },
    consumes: (contract) => Boolean(contract.eval),
  },
  {
    id: 'learning',
    name: 'Aprender com julgamento',
    promise: 'Ligar martelo, correção, outcome e replay antes de promover uma mudança.',
    skill_ids: ['operar'],
    action: { kind: 'brain-mode', ref: 'learning', label: 'Ver aprendizado' },
    consumes: (contract) => Boolean(contract.learning),
  },
];

function capabilityState(condition, fallbackAvailable) {
  if (condition) return 'operational';
  return fallbackAvailable ? 'available' : 'declared';
}

export function nativeCapabilitiesModel({
  skillCatalog = { skills: [] },
  systemContracts = [],
  sourceCounts = { total: 0, observed: 0 },
  health = {},
  runs = [],
  judgments = [],
  corrections = [],
  candidates = [],
} = {}) {
  const skillsById = new Map((skillCatalog.skills || []).map((skill) => [skill.skill_id, skill]));
  const quality = health.quality || { measured: false, percent: null, cases: 0 };
  const provider = health.provider || {};
  const evaluatedRuns = runs.filter((run) => run.eval_passed !== null && run.eval_passed !== undefined);
  const runsWithOutcomes = runs.filter((run) => Number(run.outcomes) > 0);
  const learningSignals = judgments.length + corrections.length + candidates.length + runsWithOutcomes.length;

  return NATIVE_CAPABILITY_SPEC.map((spec, index) => {
    const skills = spec.skill_ids.map((skillId) => skillsById.get(skillId)).filter(Boolean)
      .map((skill) => ({
        skill_id: skill.skill_id,
        name: skill.name,
        status: skill.installation_status,
      }));
    const skillAvailable = skills.some((skill) => skill.status === 'available');
    const installedSkills = skills.filter((skill) => skill.status !== 'motor-only');
    const motorSkills = skills.filter((skill) => skill.status === 'motor-only');
    const consumers = systemContracts.filter(spec.consumes).map((contract) => ({
      system_id: contract.system_id,
      name: contract.name || contract.system_id,
    }));
    let state = 'declared';
    let proof = { headline: 'Sem evidência observada', detail: 'A capacidade existe no método, mas ainda não deixou prova local.' };
    let activeProvider = null;

    if (spec.id === 'sources') {
      state = capabilityState(sourceCounts.observed > 0, skillAvailable);
      proof = {
        headline: `${sourceCounts.observed}/${sourceCounts.total} Fontes observadas`,
        detail: sourceCounts.observed
          ? 'Acesso ou marcador de frescor existe para estas Fontes.'
          : 'Contratos e Skills não provam que uma Fonte já foi observada.',
      };
    } else if (spec.id === 'memory') {
      state = skillAvailable ? 'available' : 'declared';
      proof = {
        headline: `${installedSkills.length} instaladas · ${motorSkills.length} no motor`,
        detail: 'Bruto, processado e destilado ainda não emitem recibos canônicos; disponibilidade não vira operação inventada.',
      };
    } else if (spec.id === 'retrieval') {
      state = quality.measured ? 'measured'
        : health.operation?.current_status === 'healthy' ? 'operational'
          : provider.provider_id || provider.name ? 'available' : 'declared';
      proof = quality.measured && Number.isFinite(quality.percent)
        ? { headline: `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(quality.percent)}% Hit@3`, detail: `${quality.cases || 0} casos no último benchmark auditado.` }
        : { headline: 'Benchmark não medido', detail: 'Provider disponível não é prova de qualidade de recuperação.' };
      activeProvider = provider.provider_id || provider.name ? {
        provider_id: provider.provider_id || null,
        name: provider.name || provider.provider_id,
        implementation: provider.implementation || null,
        implementation_version: provider.implementation_version || null,
        substitutable: true,
      } : null;
    } else if (spec.id === 'structure') {
      state = capabilityState(systemContracts.length > 0, skillAvailable);
      proof = {
        headline: `${systemContracts.length} System Contracts`,
        detail: systemContracts.length ? 'Resultados e fronteiras já possuem envelope constitucional.' : 'Nenhum Sistema formalizado nesta instalação.',
      };
    } else if (spec.id === 'evaluation') {
      state = capabilityState(evaluatedRuns.length > 0, skillAvailable);
      proof = {
        headline: `${evaluatedRuns.length}/${runs.length} Runs avaliados`,
        detail: evaluatedRuns.length ? 'Eval observado no ledger local; julgamento humano continua separado.' : 'Evals declarados sem execução observada.',
      };
    } else if (spec.id === 'learning') {
      state = capabilityState(learningSignals > 0, skillAvailable);
      proof = {
        headline: `${judgments.length} julgamentos · ${candidates.length} candidatos`,
        detail: `${corrections.length} correções e ${runsWithOutcomes.length} Runs com outcome; promoção continua humana e versionada.`,
      };
    }

    return {
      id: spec.id,
      position: index + 1,
      name: spec.name,
      promise: spec.promise,
      state,
      proof,
      skills,
      provider: activeProvider,
      systems: { count: consumers.length, items: consumers.slice(0, 4) },
      action: spec.action,
    };
  });
}

export function brainControlCenterModel(root, { sources = [], retrievalHealth = null, systems = [] } = {}) {
  const health = retrievalHealth || retrievalHealthModel(root);
  const records = healthRunRecords(root);
  const systemContracts = listJsonDir(root, '.cerebro/contracts/systems');
  const sourceContracts = listJsonDir(root, '.cerebro/contracts/sources');
  const contractsBySystem = new Map(systemContracts.map((contract) => [contract.system_id, contract]));
  const retrievalReceipts = listJsonDir(root, '.cerebro/runtime/receipts/retrieval');
  const retrievalById = new Map(retrievalReceipts.map((receipt) => [receipt.receipt_id, receipt]));
  const judgments = listJsonTree(root, '.cerebro/runtime/judgments');
  const corrections = listJsonTree(root, '.cerebro/runtime/corrections');
  const candidates = listJsonTree(root, '.cerebro/runtime/learning-candidates');
  const runIds = new Set(records.map((record) => record.run_id));
  const judgmentsByRun = new Map();
  for (const judgment of judgments) {
    if (!judgment.run_id) continue;
    const current = judgmentsByRun.get(judgment.run_id) || [];
    current.push(judgment);
    judgmentsByRun.set(judgment.run_id, current);
  }

  const runs = records.map((record) => {
    const contract = contractsBySystem.get(record.system_id) || null;
    const receiptId = retrievalReceiptId(record);
    const retrieval = receiptId ? retrievalById.get(receiptId) || null : null;
    const integrity = runIntegrity(record, retrieval);
    const runJudgments = (judgmentsByRun.get(record.run_id) || [])
      .sort((left, right) => String(right.decided_at || '').localeCompare(String(left.decided_at || '')));
    const expectedSources = Array.isArray(contract?.sources) ? contract.sources : [];
    const observedSources = (record.context_snapshot?.accesses || []).map((access) => ({
      role: access.source_ref?.role || access.role || null,
      source_id: access.source_ref?.id || null,
      selected_refs: Array.isArray(access.selected_refs) ? access.selected_refs.length : 0,
      assurance: access.assurance || null,
      window_observed: Boolean(access.window),
      freshness_observed: Boolean(access.freshness_marker),
    }));
    return {
      run_id: record.run_id,
      system_id: record.system_id,
      system_name: contract?.name || record.system_id,
      system_version: record.system_version || contract?.version || null,
      status: record.status || 'unknown',
      mode: record.mode || null,
      started_at: record.started_at || null,
      completed_at: record.completed_at || null,
      integrity,
      retrieval: receiptId ? {
        mode: 'semantic-provider',
        status: retrieval?.status || 'receipt-missing',
        decision: retrieval?.decision || null,
        reason_code: retrieval?.reason_code || null,
        latency_ms: Number.isFinite(retrieval?.latency_ms) ? retrieval.latency_ms : null,
        selected_refs: Array.isArray(retrieval?.selected_refs) ? retrieval.selected_refs.length : null,
      } : { mode: 'contractual-direct', status: 'not-requested', decision: null, reason_code: null, latency_ms: null, selected_refs: null },
      expected: {
        contract_observed: Boolean(contract),
        required_sources: expectedSources.filter((source) => source.required).map((source) => ({
          role: source.role || null,
          source_id: source.source_id || null,
          freshness: source.freshness || null,
        })),
        optional_sources: expectedSources.filter((source) => !source.required).length,
        minimum_refs: Number.isFinite(contract?.retrieval?.evidence?.minimum_refs) ? contract.retrieval.evidence.minimum_refs : null,
        stop_conditions: Array.isArray(contract?.retrieval?.stop_conditions) ? contract.retrieval.stop_conditions.length : 0,
        fallback_enabled: contract?.retrieval?.fallback?.enabled === true,
      },
      observed: {
        snapshot_at: record.context_snapshot?.observed_at || null,
        sources: observedSources,
        gaps: integrity.gaps,
        conflicts: integrity.conflicts,
        fallbacks: integrity.fallbacks,
      },
      eval_passed: record.eval?.passed ?? null,
      human_decision: record.human_decision || null,
      judgment: runJudgments[0] ? { verdict: runJudgments[0].verdict || null, decided_at: runJudgments[0].decided_at || null } : null,
      judgments: runJudgments.length,
      outcomes: Array.isArray(record.outcomes) ? record.outcomes.length : 0,
      correction_linked: Boolean(record.correction_ref),
    };
  }).sort((left, right) => String(right.completed_at || right.started_at || '')
    .localeCompare(String(left.completed_at || left.started_at || '')));

  const integrityCounts = runs.reduce((counts, run) => {
    counts[run.integrity.state] += 1;
    return counts;
  }, { complete: 0, limited: 0, blocked: 0 });
  const observedSources = sources.filter((source) => source.last_access || source.freshness_observed).length;
  const totalSources = sources.length || sourceContracts.length;
  const orphanJudgments = judgments.filter((judgment) => judgment.run_id && !runIds.has(judgment.run_id)).length;
  const duplicateJudgments = [...judgmentsByRun.values()].reduce((total, values) => total + Math.max(0, values.length - 1), 0);
  const runsWithOutcomes = records.filter((record) => Array.isArray(record.outcomes) && record.outcomes.length).length;
  const freshPolicies = sourceContracts.filter((contract) => Boolean(contract.freshness?.policy)).length;
  const care = [
    totalSources - observedSources > 0 ? { code: 'sources-unobserved', count: totalSources - observedSources } : null,
    integrityCounts.limited > 0 ? { code: 'runs-limited', count: integrityCounts.limited } : null,
    integrityCounts.blocked > 0 ? { code: 'runs-blocked', count: integrityCounts.blocked } : null,
    orphanJudgments + duplicateJudgments > 0 ? { code: 'judgment-reconciliation', count: orphanJudgments + duplicateJudgments } : null,
    !candidates.length ? { code: 'learning-candidates-empty', count: 0 } : null,
  ].filter(Boolean);
  const skillCatalog = buildSkillReadModel(root, { systems });
  const capabilities = nativeCapabilitiesModel({
    skillCatalog,
    systemContracts,
    sourceCounts: { total: totalSources, observed: observedSources },
    health,
    runs,
    judgments,
    corrections,
    candidates,
  });

  return {
    generated_at: new Date().toISOString(),
    capabilities,
    overview: {
      sources: { total: totalSources, observed: observedSources, unobserved: Math.max(0, totalSources - observedSources) },
      runs: { total: runs.length, ...integrityCounts },
      systems_readiness: {
        measured: false,
        blocked: null,
        reason_code: 'machine-readable-freshness-and-readiness-missing',
      },
      benchmark: health.quality,
      learning: { candidates: candidates.length, outcomes: runsWithOutcomes, judgments: judgments.length },
      care,
    },
    memory: {
      lifecycle: [
        { id: 'source', name: 'Fonte', measured: true, value: observedSources, total: totalSources, unit: 'Fontes observadas' },
        { id: 'raw', name: 'Bruto', measured: false, value: null, reason_code: 'capture-transition-receipt-missing' },
        { id: 'processed', name: 'Processado', measured: false, value: null, reason_code: 'processing-transition-receipt-missing' },
        { id: 'distilled', name: 'Destilado', measured: false, value: null, reason_code: 'distillation-transition-receipt-missing' },
        { id: 'current-context', name: 'Contexto vigente', measured: Number.isFinite(health.index.documents), value: health.index.documents, unit: 'documentos no corpus explícito do piloto', reason_code: Number.isFinite(health.index.documents) ? null : 'index-receipt-missing' },
      ],
      freshness: {
        measured: false,
        declared_policies: freshPolicies,
        total_sources: sourceContracts.length,
        reason_code: 'freshness-policy-not-machine-readable',
      },
    },
    recovery: {
      benchmark: health.quality,
      operation: health.operation,
      index: health.index,
      counts: integrityCounts,
      runs,
    },
    learning: {
      judgments: judgments.length,
      corrections: corrections.length,
      outcomes: runsWithOutcomes,
      candidates: candidates.length,
      promotions: { measured: false, value: null, reason_code: 'promotion-receipts-not-instrumented' },
      reconciliation: { orphan_judgments: orphanJudgments, duplicate_judgments: duplicateJudgments },
    },
    architecture: {
      provider: health.provider,
      index: health.index,
      operation: health.operation,
      protocol: {
        system_contracts: systemContracts.length,
        source_contracts: sourceContracts.length,
        retrieval_versions: [...new Set(systemContracts.map((contract) => contract.retrieval?.version).filter(Boolean))],
      },
      privacy: health.privacy,
      graph: { role: 'structural-map', participates_in_retrieval: false },
    },
    privacy: {
      content_exposed: false,
      query_exposed: false,
      selected_refs_exposed: false,
      hashes_exposed: false,
      raw_error_exposed: false,
    },
  };
}

const COMPANY_MAP_SPEC = [
  {
    id: 'business', name: 'Estratégia & negócio',
    purpose: 'O que a empresa decidiu vender, medir e construir.',
    entries: [
      { id: 'offers', name: 'Ofertas', refs: ['meu-negocio/oferta.md', '01-nucleo-privado/operacao-comunidade/_OFERTAS.md'] },
      { id: 'funnel', name: 'Funil', refs: ['01-nucleo-privado/operacao-comunidade/_FUNIL-DIARIO.md'] },
      { id: 'decisions', name: 'Decisões', refs: ['meu-negocio/decisoes', '01-nucleo-privado/decisoes', '01-nucleo-privado/meu-negocio/decisoes'] },
      { id: 'experiments', name: 'Experimentos', refs: ['.cerebro/contracts/experiments', '.cerebro/runtime/experiments'] },
      { id: 'projects', name: 'Projetos', refs: ['01-nucleo-privado/projetos'] },
    ],
  },
  {
    id: 'marketing-sales', name: 'Marketing & vendas',
    purpose: 'O que a empresa publica, testa e aprende para gerar demanda.',
    entries: [
      { id: 'content', name: 'Produção por autor', refs: ['01-nucleo-privado/producao-conteudo/gabriel', '01-nucleo-privado/producao-conteudo/turra', '01-nucleo-privado/producao-conteudo/vini'] },
      { id: 'ads', name: 'Biblioteca de Ads', refs: ['01-nucleo-privado/producao-conteudo/ads/entregues', '01-nucleo-privado/producao-conteudo/ads/vini', '01-nucleo-privado/producao-conteudo/ads/zucco'] },
      { id: 'ads-inbox', name: 'Ads para classificar', refs: ['01-nucleo-privado/producao-conteudo/ads/_a-classificar'] },
      { id: 'ideas', name: 'Ideias', refs: ['01-nucleo-privado/producao-conteudo/ads/ideias', '01-nucleo-privado/producao-conteudo/Banco de ideias — conteudo da viagem (voz do Gabriel).md'] },
      { id: 'content-map', name: 'Mapa de conteúdo', refs: ['01-nucleo-privado/producao-conteudo/_MAPA-CONTEUDO.md'] },
      { id: 'voice-atoms', name: 'Átomos de voz', refs: ['01-nucleo-privado/producao-conteudo/atomos-voz'] },
    ],
  },
  {
    id: 'product-delivery', name: 'Produto & entrega',
    purpose: 'O que transforma conhecimento em experiência, capacidade e resultado.',
    entries: [
      { id: 'systems', name: 'Sistemas', refs: ['sistemas', '01-nucleo-privado/sistemas', '.cerebro/contracts/systems'], view: 'systems' },
      { id: 'skills', name: 'Skills', refs: ['skills', '01-nucleo-privado/skills', '.agents/skills'] },
      { id: 'delivery', name: 'Entregas em construção', refs: ['01-nucleo-privado/projetos/implementacao-cerebro-servico', '01-nucleo-privado/projetos/produto-lancamento-2026-07'] },
      { id: 'cases', name: 'Cases & resultados', refs: ['01-nucleo-privado/operacao/o-que-melhorou', '01-nucleo-privado/sistemas/_MELHORIAS.md'] },
      { id: 'releases', name: 'Produto & releases', refs: ['VERSION', '.cerebro/version', '01-nucleo-privado/sistemas/produto-cerebro'] },
    ],
  },
  {
    id: 'community', name: 'Comunidade',
    purpose: 'Quem participa, quais encontros acontecem e como a experiência é operada.',
    entries: [
      { id: 'founders', name: 'Founders', refs: ['01-nucleo-privado/founders'] },
      { id: 'community-ops', name: 'Operação da comunidade', refs: ['01-nucleo-privado/operacao-comunidade'] },
      { id: 'dispatches', name: 'Disparos', refs: ['01-nucleo-privado/operacao-comunidade/disparos'] },
      { id: 'meetings', name: 'Encontros Society', refs: ['01-nucleo-privado/operacao-comunidade/encontros-society'] },
      { id: 'community-memory', name: 'Memória compartilhável', refs: ['comunidade', '01-nucleo-privado/comunidade'] },
    ],
  },
  {
    id: 'research', name: 'Pesquisa & referências',
    purpose: 'Evidência de campo, repertório externo e linguagem própria da empresa.',
    entries: [
      { id: 'third-party', name: 'Dados de terceiros', refs: ['02-dados-terceiros'], sealed: true },
      { id: 'references', name: 'Referências', refs: ['conhecimento', '01-nucleo-privado/referencias'] },
      { id: 'concepts', name: 'Conceitos', refs: ['01-nucleo-privado/conceitos'] },
      { id: 'founder-voice', name: 'Falas dos founders', refs: ['01-nucleo-privado/founders/falas'] },
      { id: 'notes', name: 'Notas de trabalho', refs: ['01-nucleo-privado/notas'] },
    ],
  },
  {
    id: 'operations-technology', name: 'Operação & tecnologia',
    purpose: 'Como o Cérebro roda, deixa recibos e continua confiável.',
    entries: [
      { id: 'operations', name: 'Operação', refs: ['operacao', '01-nucleo-privado/operacao'] },
      { id: 'dailies', name: 'Dailies', refs: ['meu-negocio/dailies', '01-nucleo-privado/founders/dailies'] },
      { id: 'routines', name: 'Rotinas do Cérebro', refs: ['.cerebro/contracts/routines'], view: 'routines' },
      { id: 'sources', name: 'Contratos de Fontes', refs: ['.cerebro/contracts/sources'], view: 'sources' },
      { id: 'receipts', name: 'Painel & recibos', refs: ['01-nucleo-privado/painel'] },
    ],
  },
];

function summarizeBrainRefs(root, refs) {
  const brainRoot = resolve(root);
  let count = 0;
  let lastChanged = 0;
  const observedRefs = [];
  const walk = (target) => {
    let stat;
    try { stat = statSync(target); } catch { return; }
    if (stat.isFile()) {
      count += 1;
      lastChanged = Math.max(lastChanged, stat.mtimeMs);
      return;
    }
    if (!stat.isDirectory()) return;
    let entries = [];
    try { entries = readdirSync(target, { withFileTypes: true }); } catch { return; }
    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue;
      const child = resolve(target, entry.name);
      if (entry.isDirectory()) walk(child);
      else if (entry.isFile()) {
        count += 1;
        try { lastChanged = Math.max(lastChanged, statSync(child).mtimeMs); } catch { /* metadado opcional */ }
      }
    }
  };
  for (const ref of refs) {
    const target = resolve(root, ref);
    if (target !== brainRoot && !target.startsWith(`${brainRoot}${sep}`)) continue;
    if (!existsSync(target)) continue;
    observedRefs.push(ref);
    walk(target);
  }
  return {
    count,
    available: observedRefs.length > 0,
    observed_refs: observedRefs,
    last_changed: lastChanged ? new Date(lastChanged).toISOString() : null,
  };
}

export function companyMapModel(root, { model, sources, round, contextGaps = 0 } = {}) {
  const semanticCounts = new Map([
    ['systems', model?.systems?.length || 0],
    ['experiments', model?.experiments?.length || 0],
    ['routines', model?.routines?.length || 0],
    ['sources', sources?.length || 0],
  ]);
  const units = new Map([
    ['systems', ['Sistema', 'Sistemas']],
    ['experiments', ['experimento', 'experimentos']],
    ['routines', ['rotina', 'rotinas']],
    ['sources', ['Fonte', 'Fontes']],
  ]);
  const domains = COMPANY_MAP_SPEC.map((domain) => ({
    id: domain.id,
    name: domain.name,
    purpose: domain.purpose,
    entries: domain.entries.map((entry) => {
      const observed = summarizeBrainRefs(root, entry.refs);
      return {
        id: entry.id,
        name: entry.name,
        sealed: entry.sealed === true,
        view: entry.view || null,
        ...observed,
        count: semanticCounts.has(entry.id) ? semanticCounts.get(entry.id) : observed.count,
        unit: units.get(entry.id) || ['item', 'itens'],
      };
    }).filter((entry) => entry.available),
  })).filter((domain) => domain.entries.length);
  const daily = domains.flatMap((domain) => domain.entries).find((entry) => entry.id === 'dailies');
  const observedSources = (sources || []).filter((source) => source.last_access || source.freshness_observed);
  const routines = [
    ...(daily ? [{
      routine_id: 'daily-humana',
      name: 'Daily dos founders',
      state: 'human-capture',
      schedule: 'Ritual humano',
      output: `${daily.count} registros de mudança, decisão e aprendizado`,
      last_observed: daily.last_changed,
    }] : []),
    ...((model?.routines || []).map((routine) => {
      const receiptDates = (Array.isArray(routine.receipts) ? routine.receipts : [])
        .map((receipt) => receipt.completed_at || receipt.started_at || receipt.occurred_at)
        .filter(Boolean).sort().reverse();
      return {
        routine_id: routine.routine_id,
        name: routine.name,
        state: routine.health_reason_code,
        schedule: routine.schedule,
        output: `${Array.isArray(routine.receipts) ? routine.receipts.length : 0} recibos observados`,
        last_observed: receiptDates[0] || routine.last_run?.completed_at || null,
      };
    })),
  ];
  return {
    generated_at: new Date().toISOString(),
    privacy: { content_exposed: false, third_party_aggregate_only: true },
    domains,
    source_summary: {
      total: (sources || []).length,
      observed: observedSources.length,
      never_observed: Math.max(0, (sources || []).length - observedSources.length),
    },
    care: {
      context_gaps: contextGaps,
      sources_never_observed: Math.max(0, (sources || []).length - observedSources.length),
      distill_backlog: round?.tarefas?.find((task) => task.nome.toLowerCase().includes('destila'))?.resumo || null,
      protocol_issues: model?.issues?.length || 0,
    },
    routines,
    memory_flow: [
      ['Fonte', 'A realidade continua na casa de verdade.'],
      ['Bruto', 'Captura preservada, ainda sem interpretação.'],
      ['Processado', 'Normalizado, transcrito ou classificado.'],
      ['Destilado', 'Evidência e sentido com proveniência.'],
      ['Contexto vigente', 'O que pode orientar uma decisão agora.'],
      ['Sistema', 'Contexto selecionado para um resultado.'],
      ['Julgamento', 'O humano decide se o resultado serve.'],
      ['Aprendizado', 'Só o que foi provado volta ao Cérebro.'],
    ].map(([name, meaning], index) => ({ step: index + 1, name, meaning })),
  };
}

// Workspace de um Sistema — o contrato cru + tudo que foi observado dele.
export function systemWorkspace(root, ref) {
  const model = buildConsoleReadModel(root);
  const system = model.systems.find((item) => item.system_id === ref || item.contract_id === ref);
  if (!system) throw new Error('not-found');
  let contract = {};
  try {
    const contractPath = resolve(root, system.contract_ref || `.cerebro/contracts/systems/${system.contract_id}.json`);
    const brainRoot = resolve(root);
    if (contractPath !== brainRoot && !contractPath.startsWith(`${brainRoot}${sep}`)) throw new Error('not-found');
    contract = JSON.parse(readFileSync(contractPath, 'utf8'));
  } catch { contract = {}; }
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
  const societyCatalog = buildSocietyCatalogReadModel(root, { installedSystems: model.systems });
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
  const companyMap = companyMapModel(root, { model, sources, round, contextGaps });
  const retrievalHealth = retrievalHealthModel(root);
  const controlCenter = brainControlCenterModel(root, { sources, retrievalHealth, systems: model.systems });

  return {
    generated_at: new Date().toISOString(),
    activation: model.activation,
    company_map: companyMap,
    retrieval_health: retrievalHealth,
    control_center: controlCenter,
    update_center: buildBrainUpdateCenter(root, {
      engineRoot: ENGINE_ROOT,
      compatibilityPercent: model.compatibility?.score?.percent ?? null,
      societyCounts: societyCatalog.counts,
      societySystems: societyCatalog.systems,
    }),
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
const ENGINE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const STATIC_ROOT = resolve(ENGINE_ROOT, 'console');
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

function assertAuthenticatedPost(request, sessionToken, csrfToken) {
  if (!exactEqual(cookies(request)[COOKIE_NAME], sessionToken)) throw new Error('session-required');
  if (!exactEqual(String(request.headers['x-cerebro-csrf'] || ''), csrfToken)) throw new Error('csrf-invalid');
}

function assertMutation(request, sessionToken, csrfToken, payload) {
  assertAuthenticatedPost(request, sessionToken, csrfToken);
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

function decisionCaseFrom(pathname) {
  const match = pathname.match(/^\/api\/decision-cases\/(case-[0-9a-f]{32})$/);
  return match?.[1] || null;
}

function decisionCaseActionFrom(pathname) {
  const match = pathname.match(/^\/api\/decision-cases\/(case-[0-9a-f]{32})\/(preview|apply|rollback)$/);
  return match ? { caseId: match[1], action: match[2] } : null;
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
  interfaceFetch = globalThis.fetch,
  interfaceHealthTimeoutCeilingMs = 2000,
  updateFetch = globalThis.fetch,
  updateRunner,
} = {}) {
  const brainRoot = resolve(root || process.cwd());
  recognizeConsoleBrain(brainRoot);
  let remoteUpdate = null;
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
      if (request.method === 'GET' && url.pathname.startsWith('/api/systems/') && url.pathname.endsWith('/interface-health')) {
        if (!exactEqual(cookies(request)[COOKIE_NAME], sessionToken)) throw new Error('session-required');
        const ref = decodeURIComponent(url.pathname.slice('/api/systems/'.length, -'/interface-health'.length));
        if (!SAFE_REF_RE.test(ref)) throw new Error('not-found');
        send(response, 200, await systemInterfaceHealth(brainRoot, ref, {
          fetchImpl: interfaceFetch,
          timeoutCeilingMs: interfaceHealthTimeoutCeilingMs,
          clock,
        }));
        return;
      }
      if (request.method === 'GET' && url.pathname === '/api/anatomy') {
        if (!exactEqual(cookies(request)[COOKIE_NAME], sessionToken)) throw new Error('session-required');
        send(response, 200, anatomyModel(brainRoot));
        return;
      }
      if (request.method === 'GET' && url.pathname === '/api/update') {
        if (!exactEqual(cookies(request)[COOKIE_NAME], sessionToken)) throw new Error('session-required');
        send(response, 200, { ...anatomyModel(brainRoot).update_center, remote: remoteUpdate });
        return;
      }
      if (request.method === 'POST' && url.pathname === '/api/update/check') {
        const payload = await body(request);
        assertMutation(request, sessionToken, csrfToken, payload);
        const local = anatomyModel(brainRoot).update_center;
        remoteUpdate = await checkLatestBrainRelease(local, { fetchImpl: updateFetch, clock });
        send(response, 200, { ...local, remote: remoteUpdate });
        return;
      }
      if (request.method === 'POST' && url.pathname === '/api/update/apply') {
        const payload = await body(request);
        assertMutation(request, sessionToken, csrfToken, payload);
        if (!remoteUpdate || payload.expected_tag !== remoteUpdate.tag) throw new Error('update-check-required');
        const result = await applyManagedBrainUpdate(brainRoot, remoteUpdate, {
          engineRoot: ENGINE_ROOT,
          ...(updateRunner ? { runner: updateRunner } : {}),
        });
        remoteUpdate = null;
        send(response, 200, { ...anatomyModel(brainRoot).update_center, remote: null, last_update: result });
        return;
      }
      if (request.method === 'GET' && url.pathname === '/api/skills') {
        if (!exactEqual(cookies(request)[COOKIE_NAME], sessionToken)) throw new Error('session-required');
        const issues = [];
        const systems = listConsoleSystems(brainRoot, { issues });
        const catalog = buildSkillReadModel(brainRoot, { systems });
        send(response, 200, { ...catalog, issues: [...issues, ...catalog.issues] });
        return;
      }
      if (request.method === 'GET' && url.pathname === '/api/society') {
        if (!exactEqual(cookies(request)[COOKIE_NAME], sessionToken)) throw new Error('session-required');
        const issues = [];
        const installedSystems = listConsoleSystems(brainRoot, { issues });
        const catalog = buildSocietyCatalogReadModel(brainRoot, { installedSystems });
        send(response, 200, { ...catalog, issues: [...issues, ...catalog.issues] });
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
      if (request.method === 'GET' && url.pathname === '/api/decision-cases') {
        if (!exactEqual(cookies(request)[COOKIE_NAME], sessionToken)) throw new Error('session-required');
        send(response, 200, listDecisionCases(brainRoot));
        return;
      }
      const preparedCaseId = request.method === 'GET' ? decisionCaseFrom(url.pathname) : null;
      if (preparedCaseId) {
        if (!exactEqual(cookies(request)[COOKIE_NAME], sessionToken)) throw new Error('session-required');
        send(response, 200, prepareDecisionCase(brainRoot, preparedCaseId));
        return;
      }
      // Decision Case: preparar (GET), simular (preview), aplicar e reverter. O martelo é
      // do humano — `approved_by` é obrigatório nas três, e aplicar exige o digest do
      // preview que essa pessoa acabou de ler.
      const decisionCaseAction = request.method === 'POST' ? decisionCaseActionFrom(url.pathname) : null;
      if (decisionCaseAction) {
        const payload = await body(request);
        if (decisionCaseAction.action === 'preview') assertAuthenticatedPost(request, sessionToken, csrfToken);
        else assertMutation(request, sessionToken, csrfToken, payload);
        const approvedBy = actor(payload);
        if (decisionCaseAction.action === 'rollback') {
          const result = rollbackDecisionCase(brainRoot, decisionCaseAction.caseId, {
            actorRef: approvedBy,
            reasonCode: payload.reason_code,
          }, { clock });
          send(response, 200, result);
          return;
        }
        if (payload.evidence_refs !== undefined && !Array.isArray(payload.evidence_refs)) {
          throw new Error('evidence-refs-invalid');
        }
        const input = {
          verdict: payload.verdict,
          reviewOn: payload.review_on || '',
          theme: payload.theme || 'metodo',
          title: payload.title,
          decisionText: payload.decision_text,
          evidenceRefs: payload.evidence_refs || [],
          actorRef: approvedBy,
          authoredByHuman: payload.authored_by_human === true,
        };
        if (decisionCaseAction.action === 'preview') {
          send(response, 200, previewDecisionCase(brainRoot, decisionCaseAction.caseId, input, { clock }));
          return;
        }
        const result = applyDecisionCase(brainRoot, decisionCaseAction.caseId, {
          ...input,
          planDigest: payload.plan_digest,
          decidedAt: payload.decided_at,
        }, { clock });
        send(response, 200, result);
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
