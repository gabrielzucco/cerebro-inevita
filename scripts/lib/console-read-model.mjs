import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { loadAccessGrant } from './access-runtime.mjs';
import {
  correctionActions,
  correctionView,
  listLearningCandidates,
} from './correction-loop.mjs';
import { judgmentView } from './judgment-protocol.mjs';
import { buildExperimentReadModel } from './experiment-protocol.mjs';
import { buildCompatibilityDiagnostic, readBrainManifest } from './compatibility-diagnostic.mjs';
import {
  listRoutineContracts,
  listRoutineRunReceipts,
  loadExecutorBinding,
  loadCollectorBinding,
  loadRoutineMigration,
  loadRoutineState,
  routineMigrationBlocker,
  scheduledSlotsBetween,
} from './routine-protocol.mjs';
import {
  layout,
  latestRunRecords,
  readJson,
  validateSourceContract,
  validateSystemContract,
} from './system-protocol.mjs';

function inside(root, configured, fallback) {
  const brain = resolve(root);
  const target = resolve(root, configured || fallback);
  const rel = relative(brain, target);
  if (!rel || rel.startsWith('..') || rel.startsWith(sep)) throw new Error('layout do Console aponta para fora do Cérebro');
  return target;
}

function jsonFiles(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory).filter((name) => name.endsWith('.json')).sort().map((name) => join(directory, name));
}

function listSourceContracts(root, issues) {
  const directory = inside(root, layout(root).sourceContracts, join('.cerebro', 'contracts', 'sources'));
  return jsonFiles(directory).flatMap((path) => {
    try {
      const contract = readJson(path, 'Source Contract');
      const errors = validateSourceContract(contract);
      if (errors.length) throw new Error(errors.join(' · '));
      return [{
        source_id: contract.source_id,
        name: contract.name,
        type: contract.type,
        status: contract.status,
        assurance: contract.assurance,
        custody: contract.connector.custody,
        pii: contract.pii.classification,
        modes: contract.modes,
        freshness: contract.freshness,
        revocation: contract.revocation,
      }];
    } catch (error) {
      issues.push({ reason_code: 'source-contract-invalid', ref: relative(root, path).replaceAll('\\', '/') });
      return [];
    }
  });
}

function collectSystemPaths(root) {
  const found = new Set(jsonFiles(inside(root, layout(root).systemContracts, join('.cerebro', 'contracts', 'systems'))));
  const systemsRoot = join(root, 'sistemas');
  if (existsSync(systemsRoot)) {
    for (const entry of readdirSync(systemsRoot, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        const path = join(systemsRoot, entry.name, 'contract.json');
        if (existsSync(path)) found.add(path);
      }
    }
  }
  const activation = join(root, 'operacao', 'arquitetura', 'primeiro-sistema.json');
  if (existsSync(activation)) found.add(activation);
  return [...found].sort();
}

function listSystemContracts(root, issues) {
  const systems = new Map();
  for (const path of collectSystemPaths(root)) {
    try {
      const contract = readJson(path, 'System Contract');
      const errors = validateSystemContract(contract);
      if (errors.length) throw new Error(errors.join(' · '));
      const current = systems.get(contract.system_id);
      if (!current || String(current.version).localeCompare(String(contract.version), undefined, { numeric: true }) < 0) {
        const portfolioSystemRef = contract.extensions?.portfolio_system_ref || contract.system_id;
        const migrationStage = contract.extensions?.migration_stage
          || (contract.status === 'active' ? 'active' : contract.status === 'proposed' ? 'mapped' : 'configured');
        systems.set(contract.system_id, {
          contract_id: contract.system_id,
          system_id: portfolioSystemRef,
          name: contract.extensions?.portfolio_name || contract.name,
          version: contract.version,
          status: contract.status,
          migration_stage: migrationStage,
          human_maturity: contract.extensions?.human_maturity || null,
          source_manifest_ref: contract.extensions?.source_manifest_ref || null,
          component_statuses: contract.extensions?.component_statuses || null,
          next_gate: contract.extensions?.next_gate || null,
          area_ref: contract.extensions?.area_ref || 'geral',
          result: contract.result.statement,
          human_gate: contract.result.human_gate,
          retrieval_status: contract.protocol_version === 2 ? 'declared' : 'retrieval-not-declared',
          source_refs: contract.sources.map((source) => ({
            role: source.role,
            source_id: source.source_id || null,
            required: source.required,
            access: source.access,
            freshness: source.freshness,
          })),
        });
      }
    } catch {
      issues.push({ reason_code: 'system-contract-invalid', ref: relative(root, path).replaceAll('\\', '/') });
    }
  }
  return [...systems.values()].sort((left, right) => left.name.localeCompare(right.name, 'pt-BR'));
}

function scheduleSummary(contract) {
  if (contract.trigger.type === 'manual') return 'Manual';
  const schedule = contract.trigger.schedule;
  const cadence = schedule.cadence === 'daily' ? 'Todos os dias'
    : schedule.cadence === 'weekly' ? `Semanal · ${schedule.weekdays.join(', ')}`
      : `Mensal · dias ${schedule.month_days.join(', ')}`;
  return `${cadence} às ${schedule.time} · ${schedule.timezone}`;
}

function nextScheduledAt(contract, state, now) {
  if (contract.trigger.type !== 'schedule' || state.status !== 'active') return null;
  const horizon = new Date(now.getTime() + 62 * 24 * 60 * 60 * 1000);
  return scheduledSlotsBetween(contract.trigger.schedule, now, horizon)[0] || null;
}

function bindingView(root, contract) {
  try {
    const binding = loadExecutorBinding(root, contract.executor.binding_ref).binding;
    return {
      binding_id: binding.binding_id,
      adapter: binding.adapter,
      auth_status: binding.auth.status,
      permission_profile: binding.permission_profile,
      requested_model: contract.executor.requested_model,
      model_observation: 'requested-not-verified',
      observed_at: binding.observed_at,
    };
  } catch {
    return {
      binding_id: contract.executor.binding_ref,
      adapter: 'unresolved',
      auth_status: 'missing',
      permission_profile: null,
      requested_model: contract.executor.requested_model,
      model_observation: 'requested-not-verified',
      observed_at: null,
    };
  }
}

function accessViews(root, contract) {
  return contract.context.access_requests.map((request) => {
    try {
      const grant = loadAccessGrant(root, request.grant_ref.replace(/^access-grant:/, '')).grant;
      return {
        source_ref: request.source_ref,
        action: request.action,
        requested_mode: request.mode,
        grant_ref: request.grant_ref,
        grant_status: grant.revoked_at ? 'revoked' : 'granted',
        assurance: grant.assurance,
        custody: grant.custody,
        revocation_effect: grant.assurance === 'exported' ? 'irreversible-export' : 'future-only',
      };
    } catch {
      return {
        source_ref: request.source_ref,
        action: request.action,
        requested_mode: request.mode,
        grant_ref: request.grant_ref,
        grant_status: 'missing',
        assurance: 'unknown',
        custody: 'unknown',
        revocation_effect: 'unknown',
      };
    }
  });
}

function preparationView(root, contract) {
  const preparation = contract.extensions?.preparation;
  if (!preparation) return null;
  try {
    const binding = loadCollectorBinding(root, preparation.binding_ref).binding;
    return {
      kind: preparation.kind,
      binding_ref: preparation.binding_ref,
      executable: binding.executable,
      status: binding.status,
      output_ref: preparation.output_ref,
      stdout_recorded: binding.privacy.stdout_recorded,
    };
  } catch {
    return {
      kind: preparation.kind,
      binding_ref: preparation.binding_ref,
      executable: null,
      status: 'missing',
      output_ref: preparation.output_ref,
      stdout_recorded: false,
    };
  }
}

function healthReason(contract, state, binding, preparation, migration, receipts) {
  if (migration?.status === 'cancelled') return 'routine-migration-cancelled';
  if (migration?.duplicate_run_risk && migration.legacy_pause.status !== 'confirmed') return 'legacy-schedule-not-paused';
  if (contract.lifecycle !== 'approved') return 'routine-not-approved';
  if (preparation && preparation.status !== 'ready') return `collector-${preparation.status}`;
  if (binding.auth_status !== 'ready') return `executor-${binding.auth_status}`;
  if (state.status === 'active') return 'active';
  if (state.status === 'paused') return 'routine-paused';
  return receipts.some((receipt) => receipt.trigger === 'manual' && receipt.status === 'completed')
    ? 'ready-to-activate'
    : 'ready-manual-run';
}

function routineView(root, contract, now, runRecordsById) {
  const state = loadRoutineState(root, contract.routine_id).state;
  const binding = bindingView(root, contract);
  const preparation = preparationView(root, contract);
  const migration = loadRoutineMigration(root, contract.routine_id, { optional: true }).migration;
  const receipts = listRoutineRunReceipts(root, contract.routine_id)
    .sort((left, right) => Date.parse(right.completed_at) - Date.parse(left.completed_at));
  const latestManual = receipts.find((receipt) => receipt.trigger === 'manual' && receipt.status === 'completed') || null;
  const blocker = routineMigrationBlocker(root, contract.routine_id);
  const health = healthReason(contract, state, binding, preparation, migration, receipts);
  return {
    routine_id: contract.routine_id,
    name: contract.name,
    version: contract.version,
    lifecycle: contract.lifecycle,
    system_ref: contract.system_ref,
    trigger: contract.trigger.type,
    schedule: scheduleSummary(contract),
    next_scheduled_at: nextScheduledAt(contract, state, now),
    permission_mode: contract.permission_mode,
    destination: contract.destination,
    prompt_ref: contract.context.prompt_ref,
    privacy: contract.privacy,
    operations: contract.operations,
    state,
    binding,
    preparation,
    migration,
    access: accessViews(root, contract),
    health_reason_code: health,
    actions: {
      can_run: contract.lifecycle === 'approved' && binding.auth_status === 'ready',
      can_activate: state.status === 'disabled' && Boolean(latestManual) && !blocker,
      can_pause: state.status === 'active',
      can_resume: state.status === 'paused' && !blocker,
      can_confirm_legacy_pause: migration?.status === 'awaiting-legacy-pause',
      activation_evidence_ref: latestManual ? `routine-receipt:${latestManual.receipt_id}` : null,
    },
    receipts: receipts.slice(0, 12).map((receipt) => {
      const runRecord = runRecordsById.get(receipt.run_id) || null;
      return {
        receipt_id: receipt.receipt_id,
        receipt_ref: `routine-receipt:${receipt.receipt_id}`,
        trigger: receipt.trigger,
        status: receipt.status,
        reason_code: receipt.reason_code,
        scheduled_for: receipt.scheduled_for,
        started_at: receipt.started_at,
        completed_at: receipt.completed_at,
        requested_model: receipt.requested_model,
        model_observation: receipt.model_observation,
        input_refs: receipt.input_refs,
        output_ref: receipt.output_ref,
        access_receipt_refs: receipt.access_receipt_refs,
        content_shared_with_provider: receipt.content_shared_with_provider,
        run_record_ref: runRecord ? `run-record:${runRecord.run_id}` : null,
        context_status: runRecord?.protocol_version === 2 ? 'recorded' : 'context-not-recorded',
        context_source_count: runRecord?.protocol_version === 2
          ? runRecord.context_snapshot.accesses.length
          : 0,
      };
    }),
  };
}

function judgmentInbox(root, routines, issues, runRecordsById) {
  const names = new Map(routines.map((routine) => [routine.routine_id, routine.name]));
  return listRoutineRunReceipts(root)
    .filter((receipt) => receipt.status === 'completed' && receipt.output_ref)
    .map((receipt) => {
      const runRecord = runRecordsById.get(receipt.run_id) || null;
      let judgment;
      let correction = null;
      let actions = {
        can_rerun_with_correction: false,
        can_compare: false,
        can_create_learning_candidate: false,
      };
      try {
        judgment = judgmentView(root, receipt.receipt_id);
      } catch {
        judgment = {
          status: 'unavailable', verdict: null, action_intent: 'none', actor_ref: null,
          decided_at: null, history_count: 0,
        };
        issues.push({ reason_code: 'judgment-receipt-invalid', ref: `routine-receipt:${receipt.receipt_id}` });
      }
      try {
        correction = correctionView(root, receipt.receipt_id);
        actions = correctionActions(root, receipt.receipt_id);
      } catch {
        issues.push({ reason_code: 'correction-state-invalid', ref: `routine-receipt:${receipt.receipt_id}` });
      }
      return {
        receipt_id: receipt.receipt_id,
        receipt_ref: `routine-receipt:${receipt.receipt_id}`,
        routine_id: receipt.routine_id,
        routine_name: names.get(receipt.routine_id) || receipt.routine_id,
        system_ref: receipt.system_ref,
        run_id: receipt.run_id,
        trigger: receipt.trigger,
        completed_at: receipt.completed_at,
        requested_model: receipt.requested_model,
        output_ref: receipt.output_ref,
        run_record_ref: runRecord ? `run-record:${runRecord.run_id}` : null,
        context_status: runRecord?.protocol_version === 2 ? 'recorded' : 'context-not-recorded',
        context_source_count: runRecord?.protocol_version === 2
          ? runRecord.context_snapshot.accesses.length
          : 0,
        judgment,
        correction,
        actions,
      };
    })
    .sort((left, right) => {
      const pending = Number(right.judgment.status === 'pending') - Number(left.judgment.status === 'pending');
      return pending || Date.parse(right.completed_at) - Date.parse(left.completed_at);
    });
}

export function buildConsoleReadModel(root, { now = new Date() } = {}) {
  const observedAt = new Date(now);
  if (!Number.isFinite(observedAt.getTime())) throw new Error('relógio inválido');
  const issues = [];
  const compatibility = buildCompatibilityDiagnostic(root, { now: observedAt });
  const sources = listSourceContracts(root, issues);
  const systems = listSystemContracts(root, issues);
  let runRecords = [];
  try {
    runRecords = latestRunRecords(root);
  } catch {
    issues.push({ reason_code: 'run-ledger-invalid', ref: '.cerebro/runtime/ledger/runs.jsonl' });
  }
  const runRecordsById = new Map(runRecords.map((record) => [record.run_id, record]));
  const experimentModel = buildExperimentReadModel(root, { runRecords });
  issues.push(...experimentModel.issues);
  let routines = [];
  try {
    routines = listRoutineContracts(root)
      .map((contract) => routineView(root, contract, observedAt, runRecordsById));
  } catch {
    issues.push({ reason_code: 'routine-contract-invalid', ref: '.cerebro/contracts/routines' });
  }
  const systemById = new Map(systems.flatMap((system) => [
    [system.system_id, system],
    [system.contract_id, system],
  ]));
  const areas = [...new Set(systems.map((system) => system.area_ref))].sort().map((areaRef) => ({
    area_ref: areaRef,
    name: areaRef === 'geral' ? 'Geral' : areaRef.replaceAll('-', ' ').replace(/^./, (letter) => letter.toUpperCase()),
    system_refs: systems.filter((system) => system.area_ref === areaRef).map((system) => system.system_id),
    routine_refs: routines.filter((routine) => systemById.get(routine.system_ref)?.area_ref === areaRef).map((routine) => routine.routine_id),
  }));
  const attention = routines.filter((routine) => !['active', 'ready-manual-run', 'ready-to-activate'].includes(routine.health_reason_code));
  const judgments = judgmentInbox(root, routines, issues, runRecordsById);
  const pendingJudgments = judgments.filter((item) => item.judgment.status === 'pending');
  let learningCandidates = 0;
  try {
    learningCandidates = listLearningCandidates(root).length;
  } catch {
    issues.push({ reason_code: 'learning-candidate-invalid', ref: '.cerebro/runtime/learning-candidates' });
  }
  return {
    protocol_version: 1,
    generated_at: observedAt.toISOString(),
    cache: { kind: 'none', rebuildable_from: ['manifest', 'contracts', 'bindings', 'state', 'receipts', 'run-ledger', 'experiments', 'judgments', 'corrections', 'learning-candidates'] },
    privacy: {
      content_shared_with_inevita: false,
      raw_output_exposed: false,
      prompt_exposed: false,
      explicit_local_output_read: true,
    },
    counts: {
      areas: areas.length,
      systems: systems.length,
      sources: sources.length,
      experiments: experimentModel.experiments.length,
      routines: routines.length,
      attention: attention.length,
      judgments: pendingJudgments.length,
      learning_candidates: learningCandidates,
      compatibility_gaps: compatibility.checks.filter((item) => item.status !== 'met').length,
    },
    areas,
    systems,
    sources,
    experiments: experimentModel.experiments,
    routines,
    judgments,
    compatibility,
    today: {
      needs_attention: attention.map((routine) => routine.routine_id),
      ready_to_work: routines.filter((routine) => ['ready-manual-run', 'ready-to-activate'].includes(routine.health_reason_code)).map((routine) => routine.routine_id),
      active: routines.filter((routine) => routine.health_reason_code === 'active').map((routine) => routine.routine_id),
      pending_judgments: pendingJudgments.map((item) => item.receipt_id),
    },
    issues,
  };
}

export function recognizeConsoleBrain(root) {
  const manifest = readBrainManifest(root);
  if (manifest.status === 'valid') {
    const entrypoint = manifest.value.entrypoints.some((ref) => {
      try { return statSync(join(root, ref)).isFile(); } catch { return false; }
    });
    if (!entrypoint || !existsSync(join(root, manifest.value.layout_ref))) {
      throw new Error('Brain Manifest válido, mas referências essenciais estão ausentes');
    }
    return { kind: 'inevita-installation', profile: manifest.value.profile, manifest_version: 1 };
  }
  const standard = existsSync(join(root, '.cerebro')) && existsSync(join(root, 'VERSION'))
    && (existsSync(join(root, 'COMECE-AQUI.md')) || existsSync(join(root, 'START-HERE.md')));
  if (standard) return { kind: 'inevita-installation-unmanifested' };
  const markerPath = join(root, '.cerebro', 'legacy-brain.json');
  if (!existsSync(markerPath) || !existsSync(join(root, '.cerebro', 'layout.json'))) {
    throw new Error('a pasta não é um Cérebro reconhecido pelo Console');
  }
  const marker = JSON.parse(readFileSync(markerPath, 'utf8'));
  const legacyEntrypoint = ['AGENTS.md', 'CLAUDE.md', '_START.md'].some((name) => {
    try { return statSync(join(root, name)).isFile(); } catch { return false; }
  });
  if (marker.protocol !== 'company-brain' || marker.compatibility !== 'legacy-vault' || !legacyEntrypoint) {
    throw new Error('marcador de Cérebro legado inválido');
  }
  return { kind: 'legacy-vault' };
}
