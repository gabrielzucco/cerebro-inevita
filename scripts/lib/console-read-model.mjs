import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
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
} from './routine-protocol.mjs';
import {
  layout,
  latestRunRecords,
  readJson,
  validateSourceContract,
  validateSystemContract,
} from './system-protocol.mjs';
import {
  operatingAreaLabel,
  systemClassification,
  systemTaxonomy,
} from './system-taxonomy.mjs';
import { indexSystemRuntimeBindings } from './system-runtime-binding.mjs';
import { experienceManifestView, indexExperienceManifests } from './experience-manifest.mjs';
import { countInstalledSkills } from './skill-read-model.mjs';

const PRODUCT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const SOCIETY_CATALOG = join(PRODUCT_ROOT, 'society', 'catalog.v1.json');

function loadSocietyCatalog(issues) {
  try {
    const catalog = JSON.parse(readFileSync(SOCIETY_CATALOG, 'utf8'));
    const errors = [];
    if (catalog.protocol_version !== 1) errors.push('protocol_version precisa ser 1');
    if (typeof catalog.catalog_id !== 'string' || !catalog.catalog_id) errors.push('catalog_id ausente');
    if (!Array.isArray(catalog.systems)) errors.push('systems precisa ser array');
    for (const [index, system] of (catalog.systems || []).entries()) {
      for (const field of ['system_id', 'name', 'descriptor', 'tagline', 'stage', 'release_version', 'result']) {
        if (typeof system[field] !== 'string' || !system[field]) errors.push(`systems[${index}].${field} ausente`);
      }
      if (!Array.isArray(system.required_source_roles)) errors.push(`systems[${index}].required_source_roles precisa ser array`);
      if (!Array.isArray(system.known_gaps)) errors.push(`systems[${index}].known_gaps precisa ser array`);
      for (const field of ['companies', 'runs', 'approved_runs', 'judged_outcomes']) {
        if (!Number.isInteger(system.evidence?.[field]) || system.evidence[field] < 0) errors.push(`systems[${index}].evidence.${field} inválido`);
      }
      if (typeof system.checkout?.available !== 'boolean') errors.push(`systems[${index}].checkout.available inválido`);
    }
    if (errors.length) throw new Error(errors.join(' · '));
    return catalog;
  } catch {
    issues.push({ reason_code: 'society-catalog-invalid', ref: 'society/catalog.v1.json' });
    return { protocol_version: 1, catalog_id: 'unavailable', systems: [] };
  }
}

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

const ACTIVATION_STEPS = [
  { milestone: 'T0', id: 'work', name: 'Escolha um trabalho real', description: 'Comece pelo que precisa sair pronto agora; não pelo mapa inteiro da empresa.' },
  { milestone: 'T1', id: 'source', name: 'Traga uma fonte-semente', description: 'Pode ser texto, fala, arquivo ou uma Fonte já conectada e autorizada.' },
  { milestone: 'T2', id: 'result', name: 'Receba o primeiro resultado', description: 'O Cérebro usa o recorte observado para produzir algo útil e rastreável.' },
  { milestone: 'T3', id: 'judgment', name: 'Julgue e corrija', description: 'Você confirma o que serve; correção não vira regra automaticamente.' },
  { milestone: 'T4', id: 'reuse', name: 'Reutilize sem reexplicar', description: 'Uma segunda tarefa prova que o contexto aprovado voltou a trabalhar.' },
];

export function activationState(root, { issues = [] } = {}) {
  const directory = join(root, '.cerebro', 'concierge-runs');
  const runs = jsonFiles(directory).flatMap((path) => {
    try {
      const run = readJson(path, 'recibo da primeira missão');
      if (!run || typeof run !== 'object' || !run.milestones || typeof run.milestones !== 'object') throw new Error('milestones ausentes');
      return [{ ...run, run_ref: relative(root, path).replaceAll('\\', '/') }];
    } catch {
      issues.push({ reason_code: 'activation-receipt-invalid', ref: relative(root, path).replaceAll('\\', '/') });
      return [];
    }
  });
  const completedRuns = runs.filter((run) => Boolean(run.milestones.T4));
  const candidates = completedRuns.length ? completedRuns : runs;
  const activeRun = [...candidates].sort((left, right) => {
    const leftAt = left.milestones.T4 || left.milestones.T3 || left.milestones.T2 || left.milestones.T1 || left.milestones.T0 || '';
    const rightAt = right.milestones.T4 || right.milestones.T3 || right.milestones.T2 || right.milestones.T1 || right.milestones.T0 || '';
    return String(rightAt).localeCompare(String(leftAt));
  })[0] || null;
  const milestones = Object.fromEntries(ACTIVATION_STEPS.map((step) => [step.milestone, activeRun?.milestones?.[step.milestone] || null]));
  const steps = ACTIVATION_STEPS.map((step) => ({ ...step, completed_at: milestones[step.milestone] }));
  const completedSteps = steps.filter((step) => step.completed_at).length;
  const complete = Boolean(milestones.T4);
  const currentStep = complete ? null : steps.find((step) => !step.completed_at) || steps.at(-1);
  return {
    status: complete ? 'complete' : activeRun ? 'in-progress' : 'not-started',
    complete,
    command: '/comecar',
    run_id: activeRun?.runId || null,
    system_id: activeRun?.systemId || 'cerebro-base',
    product_version: activeRun?.productVersion || null,
    run_ref: activeRun?.run_ref || null,
    receipt_ref: complete ? activeRun.run_ref : null,
    started_at: milestones.T0,
    completed_at: milestones.T4,
    completed_steps: completedSteps,
    total_steps: steps.length,
    current_step: currentStep?.id || null,
    interventions: Array.isArray(activeRun?.interventions) ? activeRun.interventions.length : 0,
    steps,
    seed_options: ['Texto ou briefing', 'Fala ou reunião', 'Arquivo autorizado', 'Fonte conectada'],
  };
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
  const runtimeBindings = indexSystemRuntimeBindings(root, issues);
  const experiences = indexExperienceManifests(root, issues);
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
        const classification = systemClassification(contract.extensions, contract.system_id);
        const runtimeEntry = runtimeBindings.get(portfolioSystemRef) || runtimeBindings.get(contract.system_id) || null;
        const runtimeBinding = runtimeEntry?.binding || null;
        const runtimeAmbiguous = runtimeEntry?.ambiguous === true;
        const runtimeWorkspaceObserved = runtimeBinding
          ? existsSync(resolve(root, runtimeBinding.workspace_path))
          : false;
        const runtimeBindingStatus = runtimeAmbiguous ? 'degraded'
          : runtimeBinding?.status === 'installed' && !runtimeWorkspaceObserved ? 'degraded'
            : runtimeBinding?.status || null;
        if (runtimeBinding?.status === 'installed' && !runtimeWorkspaceObserved) {
          issues.push({ reason_code: 'system-runtime-workspace-missing', ref: runtimeBinding.binding_id });
        }
        const legacyInterfaceRef = runtimeAmbiguous ? null : contract.extensions?.interface_ref || null;
        const interfaceRole = runtimeBinding?.interface.role || contract.extensions?.interface_role || null;
        const experience = experienceManifestView(
          experiences.get(portfolioSystemRef) || experiences.get(contract.system_id) || null,
          interfaceRole,
        );
        systems.set(contract.system_id, {
          contract_id: contract.system_id,
          contract_ref: relative(root, path).replaceAll('\\', '/'),
          system_id: portfolioSystemRef,
          name: contract.extensions?.portfolio_name || contract.name,
          version: contract.version,
          status: contract.status,
          migration_stage: migrationStage,
          human_maturity: contract.extensions?.human_maturity || null,
          source_manifest_ref: contract.extensions?.source_manifest_ref || null,
          interface_expected: Boolean(contract.extensions?.interface_role || runtimeBinding || legacyInterfaceRef),
          interface_role: interfaceRole,
          interface_ref: runtimeBinding?.interface.url || legacyInterfaceRef,
          interface_ref_source: runtimeBinding ? 'runtime-binding' : legacyInterfaceRef ? 'legacy-system-contract' : null,
          interface_health_timeout_ms: runtimeBinding?.interface.healthcheck.timeout_ms || 800,
          runtime_binding: runtimeBinding ? {
            binding_id: runtimeBinding.binding_id,
            status: runtimeBindingStatus,
            host_ref: runtimeBinding.host_ref,
            workspace_ref: runtimeBinding.workspace_ref,
            observed_at: runtimeBinding.observed_at,
          } : null,
          runtime_binding_status: runtimeBindingStatus || (legacyInterfaceRef ? 'legacy' : 'unbound'),
          experience,
          component_statuses: contract.extensions?.component_statuses || null,
          next_gate: contract.extensions?.next_gate || null,
          operating_area: classification.operating_area,
          business_function: classification.business_function,
          product_kind: classification.product_kind,
          surface: classification.surface,
          result: contract.result.statement,
          operational_owner: contract.result.owner,
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

export function listConsoleSystems(root, { issues = [] } = {}) {
  return listSystemContracts(root, issues);
}

function scheduleSummary(contract) {
  if (contract.trigger.type === 'manual') return 'Manual';
  const schedule = contract.trigger.schedule;
  const cadence = schedule.cadence === 'daily' ? 'Todos os dias'
    : schedule.cadence === 'weekly' ? `Semanal · ${schedule.weekdays.join(', ')}`
      : `Mensal · dias ${schedule.month_days.join(', ')}`;
  return `${cadence} às ${schedule.time} · ${schedule.timezone}`;
}

function scheduleParts(instant, timezone) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23', weekday: 'short',
  }).formatToParts(instant);
  const value = Object.fromEntries(parts.filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]));
  return {
    date: `${value.year}-${value.month}-${value.day}`,
    day: Number(value.day),
    time: `${value.hour}:${value.minute}`,
    weekday: { Mon: 'MO', Tue: 'TU', Wed: 'WE', Thu: 'TH', Fri: 'FR', Sat: 'SA', Sun: 'SU' }[value.weekday],
  };
}

function addLocalDays(localDate, days) {
  const [year, month, day] = localDate.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

function localInstant(localDate, time, timezone) {
  const [year, month, day] = localDate.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  const target = Date.UTC(year, month - 1, day, hour, minute);
  let candidate = target;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const parts = scheduleParts(new Date(candidate), timezone);
    const [observedYear, observedMonth, observedDay] = parts.date.split('-').map(Number);
    const [observedHour, observedMinute] = parts.time.split(':').map(Number);
    const observed = Date.UTC(observedYear, observedMonth - 1, observedDay, observedHour, observedMinute);
    const delta = target - observed;
    candidate += delta;
    if (delta === 0) break;
  }
  const parts = scheduleParts(new Date(candidate), timezone);
  return parts.date === localDate && parts.time === time ? new Date(candidate) : null;
}

function nextScheduledAt(contract, state, now) {
  if (contract.trigger.type !== 'schedule' || state.status !== 'active') return null;
  const schedule = contract.trigger.schedule;
  const firstLocalDate = scheduleParts(now, schedule.timezone).date;
  for (let offset = 0; offset <= 400; offset += 1) {
    const date = addLocalDays(firstLocalDate, offset);
    const candidate = localInstant(date, schedule.time, schedule.timezone);
    if (!candidate || candidate <= now || candidate < new Date(schedule.not_before)) continue;
    const parts = scheduleParts(candidate, schedule.timezone);
    if (schedule.cadence === 'weekly' && !schedule.weekdays.includes(parts.weekday)) continue;
    if (schedule.cadence === 'monthly' && !schedule.month_days.includes(parts.day)) continue;
    return candidate.toISOString();
  }
  return null;
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
  const allSystems = listSystemContracts(root, issues);
  const systems = allSystems.filter((system) => system.product_kind === 'business-system' && system.surface === 'systems');
  const nativeSystems = allSystems.filter((system) => system.product_kind === 'brain-native' || system.surface === 'brain');
  const activation = activationState(root, { issues });
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
  const systemById = new Map(allSystems.flatMap((system) => [
    [system.system_id, system],
    [system.contract_id, system],
  ]));
  const businessSystemById = new Map(systems.flatMap((system) => [
    [system.system_id, system],
    [system.contract_id, system],
  ]));
  routines = routines.map((routine) => {
    const system = systemById.get(routine.system_ref);
    return {
      ...routine,
      product_kind: system?.product_kind || 'business-system',
      surface: system?.surface || 'systems',
    };
  });
  const areas = [...new Set(systems.map((system) => system.operating_area))].sort().map((operatingArea) => ({
    operating_area: operatingArea,
    name: operatingAreaLabel(operatingArea),
    system_refs: systems.filter((system) => system.operating_area === operatingArea).map((system) => system.system_id),
    routine_refs: routines.filter((routine) => businessSystemById.get(routine.system_ref)?.operating_area === operatingArea).map((routine) => routine.routine_id),
  }));
  const attention = routines.filter((routine) => !['active', 'ready-manual-run', 'ready-to-activate'].includes(routine.health_reason_code));
  const judgments = judgmentInbox(root, routines, issues, runRecordsById);
  const routineRunIds = new Set(routines.flatMap((routine) => routine.receipts.map((receipt) => receipt.run_id)));
  const runRecordViews = runRecords.map((record) => ({
    run_id: record.run_id,
    run_record_ref: `run-record:${record.run_id}`,
    system_ref: record.system_id,
    status: record.status,
    started_at: record.started_at,
    completed_at: record.completed_at,
    chain_id: record.chain_id ?? null,
    mode: record.mode ?? null,
    experiment_ref: record.experiment_ref ?? null,
    handoff_count: record.handoff_refs?.length || 0,
    has_routine_receipt: routineRunIds.has(record.run_id),
  }));
  const pendingJudgments = judgments.filter((item) => item.judgment.status === 'pending');
  const society = loadSocietyCatalog(issues);
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
      skills: countInstalledSkills(root),
      sources: sources.length,
      experiments: experimentModel.experiments.length,
      routines: routines.length,
      attention: attention.length,
      judgments: pendingJudgments.length,
      executions: runRecordViews.length,
      learning_candidates: learningCandidates,
      society_systems: society.systems.length,
      compatibility_gaps: compatibility.checks.filter((item) => item.status !== 'met').length,
    },
    system_taxonomy: systemTaxonomy(),
    activation,
    areas,
    systems,
    native_systems: nativeSystems,
    sources,
    experiments: experimentModel.experiments,
    routines,
    run_records: runRecordViews,
    judgments,
    society,
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
