import { existsSync, readdirSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { ID_RE, REF_ID_RE, VERSION_RE, layout, latestRunRecords, readJson } from './system-protocol.mjs';

const EXPERIMENT_ID_RE = /^EXP-[A-Za-z0-9_-]{1,48}$/;
const HASH_RE = /^[a-f0-9]{64}$/;
const OPAQUE_REF_RE = /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$/;
const CONTRACT_KEYS = new Set([
  'protocol_version', 'experiment_id', 'name', 'version', 'lifecycle', 'contract_status', 'gaps', 'system_ref',
  'measurement_system_refs', 'owner_ref', 'offer_ref', 'baseline', 'hypothesis', 'change',
  'preconditions', 'arms_status', 'arms', 'primary_metric', 'guardrails', 'diagnostic_refs',
  'decision_rule', 'window', 'source_refs', 'freeze', 'privacy',
]);
const STATE_KEYS = new Set([
  'protocol_version', 'experiment_id', 'status', 'phase', 'started_on', 'read_on', 'closed_on',
  'amendment_count', 'amendments', 'run_refs', 'measurement', 'verdict', 'learning', 'observed_at',
  'privacy',
]);
const STATUSES = new Set(['queued', 'running', 'ready-for-read', 'decided', 'cancelled', 'blocked']);
const PHASES = new Set(['contract', 'execution', 'measurement', 'decision', 'learning']);

function object(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function requiredText(errors, value, path) {
  if (typeof value !== 'string' || !value.trim()) errors.push(`${path} precisa ser texto não vazio`);
}

function optionalDate(errors, value, path) {
  if (value !== null && (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value))) {
    errors.push(`${path} precisa ser data ou null`);
  }
}

function exactKeys(errors, value, allowed, path) {
  if (!object(value)) return;
  for (const key of Object.keys(value)) if (!allowed.has(key)) errors.push(`${path}.${key} não é permitido`);
}

function refList(errors, values, path, pattern = REF_ID_RE, minimum = 0) {
  if (!Array.isArray(values)) {
    errors.push(`${path} precisa ser lista`);
    return;
  }
  if (values.length < minimum) errors.push(`${path} precisa ter pelo menos ${minimum} item(ns)`);
  if (new Set(values).size !== values.length) errors.push(`${path} não pode repetir referências`);
  values.forEach((value, index) => {
    if (!pattern.test(value || '')) errors.push(`${path}[${index}] inválido`);
  });
}

export function validateExperimentContract(value) {
  const errors = [];
  if (!object(value)) return ['experiment contract precisa ser objeto'];
  exactKeys(errors, value, CONTRACT_KEYS, 'contract');
  if (value.protocol_version !== 1) errors.push('protocol_version precisa ser 1');
  if (!EXPERIMENT_ID_RE.test(value.experiment_id || '')) errors.push('experiment_id inválido');
  requiredText(errors, value.name, 'name');
  if (!VERSION_RE.test(value.version || '')) errors.push('version precisa ser semver');
  if (value.lifecycle !== 'frozen') errors.push('lifecycle precisa ser frozen');
  if (!['complete', 'legacy-incomplete'].includes(value.contract_status)) errors.push('contract_status inválido');
  const allowedGaps = new Set(['arms-not-structured', 'guardrail-rule-missing', 'decision-rule-missing']);
  if (!Array.isArray(value.gaps) || value.gaps.some((gap) => !allowedGaps.has(gap))) errors.push('gaps inválido');
  if (value.contract_status === 'complete' && value.gaps?.length) errors.push('contract completo não pode ter gaps');
  if (value.contract_status === 'legacy-incomplete' && !value.gaps?.length) errors.push('contract legado incompleto precisa declarar gaps');
  if (!ID_RE.test(value.system_ref || '')) errors.push('system_ref inválido');
  refList(errors, value.measurement_system_refs, 'measurement_system_refs', ID_RE, 1);
  if (!REF_ID_RE.test(value.owner_ref || '')) errors.push('owner_ref inválido');
  if (value.offer_ref !== null && value.offer_ref !== undefined && !REF_ID_RE.test(value.offer_ref || '')) {
    errors.push('offer_ref inválido');
  }
  requiredText(errors, value.hypothesis, 'hypothesis');
  requiredText(errors, value.change, 'change');
  if (!['structured', 'not-structured'].includes(value.arms_status)) errors.push('arms_status inválido');
  if (!Array.isArray(value.arms)) errors.push('arms precisa ser lista');
  else {
    if (value.arms.length > 20) errors.push('arms aceita no máximo 20 braços');
    value.arms.forEach((arm, index) => {
      if (!object(arm) || !REF_ID_RE.test(arm.arm_id || '')) errors.push(`arms[${index}].arm_id inválido`);
      if (!['control', 'variation', 'single', 'unspecified'].includes(arm?.role)) errors.push(`arms[${index}].role inválido`);
    });
    if (value.arms_status === 'structured' && value.arms.length === 0) errors.push('arms estruturados não podem estar vazios');
    if (value.arms_status === 'not-structured' && value.arms.length > 0) errors.push('arms não estruturados precisam permanecer vazios');
  }
  if (!object(value.primary_metric)) errors.push('primary_metric precisa ser objeto');
  else {
    if (!ID_RE.test(value.primary_metric.metric_id || '')) errors.push('primary_metric.metric_id inválido');
    requiredText(errors, value.primary_metric.definition, 'primary_metric.definition');
    if (value.primary_metric.query_ref !== null && !OPAQUE_REF_RE.test(value.primary_metric.query_ref || '')) {
      errors.push('primary_metric.query_ref inválido');
    }
  }
  if (!object(value.guardrails)) errors.push('guardrails precisa ser objeto');
  else {
    if (value.guardrails.rule !== null) requiredText(errors, value.guardrails.rule, 'guardrails.rule');
    refList(errors, value.guardrails.metric_refs, 'guardrails.metric_refs', ID_RE);
  }
  refList(errors, value.diagnostic_refs || [], 'diagnostic_refs', ID_RE);
  if (value.decision_rule !== null) requiredText(errors, value.decision_rule, 'decision_rule');
  if (value.contract_status === 'complete') {
    requiredText(errors, value.guardrails?.rule, 'guardrails.rule');
    requiredText(errors, value.decision_rule, 'decision_rule');
    if (value.arms_status !== 'structured') errors.push('contract completo exige arms estruturados');
  }
  if (!object(value.window)) errors.push('window precisa ser objeto');
  else {
    optionalDate(errors, value.window.started_on, 'window.started_on');
    optionalDate(errors, value.window.read_on, 'window.read_on');
  }
  refList(errors, value.source_refs, 'source_refs', REF_ID_RE, 1);
  if (!object(value.freeze)) errors.push('freeze precisa ser objeto');
  else {
    if (!['sha256', 'legacy-attested'].includes(value.freeze.kind)) errors.push('freeze.kind inválido');
    if (value.freeze.frozen_at !== null && !Number.isFinite(Date.parse(value.freeze.frozen_at || ''))) errors.push('freeze.frozen_at inválido');
    requiredText(errors, value.freeze.source_ref, 'freeze.source_ref');
    if (!HASH_RE.test(value.freeze.source_sha256 || '')) errors.push('freeze.source_sha256 inválido');
  }
  if (!object(value.privacy) || value.privacy.content_shared_with_inevita !== false
    || value.privacy.summary_safe !== true || value.privacy.detail_requires_explicit_read !== true) {
    errors.push('privacy inválida');
  }
  return errors;
}

export function validateExperimentState(value) {
  const errors = [];
  if (!object(value)) return ['experiment state precisa ser objeto'];
  exactKeys(errors, value, STATE_KEYS, 'state');
  if (value.protocol_version !== 1) errors.push('protocol_version precisa ser 1');
  if (!EXPERIMENT_ID_RE.test(value.experiment_id || '')) errors.push('experiment_id inválido');
  if (!STATUSES.has(value.status)) errors.push('status inválido');
  if (!PHASES.has(value.phase)) errors.push('phase inválida');
  optionalDate(errors, value.started_on, 'started_on');
  optionalDate(errors, value.read_on, 'read_on');
  optionalDate(errors, value.closed_on, 'closed_on');
  if (!Number.isInteger(value.amendment_count) || value.amendment_count < 0) errors.push('amendment_count inválido');
  if (!Array.isArray(value.amendments)) errors.push('amendments precisa ser lista');
  else {
    if (value.amendments.length !== value.amendment_count) errors.push('amendment_count diverge de amendments');
    value.amendments.forEach((amendment, index) => {
      if (!object(amendment) || !REF_ID_RE.test(amendment.amendment_id || '')) errors.push(`amendments[${index}] inválida`);
      optionalDate(errors, amendment?.on ?? null, `amendments[${index}].on`);
      if (!Number.isInteger(amendment?.change_count) || amendment.change_count < 0) errors.push(`amendments[${index}].change_count inválido`);
    });
  }
  refList(errors, value.run_refs, 'run_refs', OPAQUE_REF_RE);
  if (!object(value.measurement)) errors.push('measurement precisa ser objeto');
  else {
    if (!['not-started', 'collecting', 'ready', 'complete', 'blocked'].includes(value.measurement.status)) errors.push('measurement.status inválido');
    if (!ID_RE.test(value.measurement.primary_metric_ref || '')) errors.push('measurement.primary_metric_ref inválido');
    refList(errors, value.measurement.diagnostic_refs, 'measurement.diagnostic_refs', ID_RE);
  }
  if (!object(value.verdict) || !['pending', 'recorded', 'not-executed'].includes(value.verdict?.status)) errors.push('verdict inválido');
  else optionalDate(errors, value.verdict.decided_on, 'verdict.decided_on');
  if (!object(value.learning) || !['pending', 'unlinked', 'linked', 'not-applicable'].includes(value.learning?.status)) errors.push('learning inválido');
  else if (value.learning.status === 'linked' && !value.learning.ref) errors.push('learning linked exige ref');
  if (!Number.isFinite(Date.parse(value.observed_at || ''))) errors.push('observed_at inválido');
  if (!object(value.privacy) || value.privacy.content_shared_with_inevita !== false || value.privacy.verdict_in_summary !== false) {
    errors.push('privacy inválida');
  }
  return errors;
}

function inside(root, configured, fallback) {
  const brain = resolve(root);
  const target = resolve(root, configured || fallback);
  const rel = relative(brain, target);
  if (!rel || rel.startsWith('..') || rel.startsWith(sep)) throw new Error('layout de Experimentos aponta para fora do Cérebro');
  return target;
}

function paths(root) {
  const configured = layout(root);
  return {
    contracts: inside(root, configured.experimentContracts, '.cerebro/contracts/experiments'),
    states: inside(root, configured.experimentStates, '.cerebro/runtime/experiments'),
  };
}

function jsonFiles(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory).filter((name) => name.endsWith('.json')).sort().map((name) => join(directory, name));
}

function linkedRunRefs(records, experimentId) {
  return records.filter((record) => (record.entity_refs || []).some((ref) => ref.role === 'experiment' && ref.id === experimentId))
    .map((record) => `run-record:${record.run_id}`);
}

function stateFile(root, experimentId) {
  return join(paths(root).states, `${experimentId.toLowerCase()}.json`);
}

function stateFor(root, experimentId) {
  const path = stateFile(root, experimentId);
  if (!existsSync(path)) return null;
  const state = readJson(path, 'Experiment State');
  const errors = validateExperimentState(state);
  if (errors.length) throw new Error(`Experiment State inválido: ${errors.join(' · ')}`);
  if (state.experiment_id !== experimentId) throw new Error('experiment state diverge do contract');
  return state;
}

export function listExperimentContracts(root) {
  return jsonFiles(paths(root).contracts).map((path) => {
    const contract = readJson(path, 'Experiment Contract');
    const errors = validateExperimentContract(contract);
    if (errors.length) throw new Error(`Experiment Contract inválido: ${errors.join(' · ')}`);
    return { path, contract };
  });
}

function pipeline(contract, state, runRefs) {
  const measurementState = state?.measurement.status === 'complete' ? 'completed'
    : state?.measurement.status === 'blocked' ? 'failed'
      : state?.measurement.status === 'collecting' ? 'running' : 'pending';
  return [
    { step: 'hypothesis', label: 'Hipótese', state: 'completed', detail: 'pergunta e mudança congeladas' },
    { step: 'contract', label: 'Contrato', state: contract.contract_status === 'complete' ? 'completed' : 'gap', detail: contract.contract_status === 'complete' ? (contract.freeze.kind === 'sha256' ? 'hash verificável' : 'legado atestado') : `${contract.gaps.length} lacuna(s) legada(s)` },
    { step: 'execution', label: 'Execução', state: state?.status === 'running' ? 'running' : runRefs.length ? 'completed' : state?.status === 'cancelled' ? 'failed' : 'gap', detail: `${runRefs.length} Run(s) ligado(s)` },
    { step: 'measurement', label: 'Medição', state: measurementState, detail: contract.primary_metric.metric_id },
    { step: 'decision', label: 'Martelo', state: state?.verdict.status === 'recorded' ? 'completed' : state?.verdict.status === 'not-executed' ? 'failed' : 'pending', detail: state?.verdict.status || 'pending' },
    { step: 'learning', label: 'Aprendizado', state: state?.learning.status === 'linked' ? 'completed' : state?.learning.status === 'not-applicable' ? 'declared' : 'gap', detail: state?.learning.status || 'pending' },
  ];
}

export function buildExperimentReadModel(root, { runRecords = null } = {}) {
  const issues = [];
  let records = runRecords;
  if (!records) {
    try { records = latestRunRecords(root); } catch { records = []; }
  }
  const experiments = [];
  for (const { path, contract } of (() => {
    try { return listExperimentContracts(root); }
    catch (error) {
      issues.push({ reason_code: 'experiment-contract-invalid', ref: '.cerebro/contracts/experiments' });
      return [];
    }
  })()) {
    try {
      const state = stateFor(root, contract.experiment_id);
      const runRefs = [...new Set([...(state?.run_refs || []), ...linkedRunRefs(records, contract.experiment_id)])];
      experiments.push({
        experiment_id: contract.experiment_id,
        name: contract.name,
        status: state?.status || 'queued',
        phase: state?.phase || 'contract',
        system_ref: contract.system_ref,
        measurement_system_refs: contract.measurement_system_refs,
        primary_metric_ref: contract.primary_metric.metric_id,
        contract_status: contract.contract_status,
        contract_gap_count: contract.gaps.length,
        arms_status: contract.arms_status,
        arm_count: contract.arms.length,
        started_on: state?.started_on || contract.window.started_on,
        read_on: state?.read_on || contract.window.read_on,
        closed_on: state?.closed_on || null,
        amendment_count: state?.amendment_count || 0,
        run_count: runRefs.length,
        verdict_status: state?.verdict.status || 'pending',
        learning_status: state?.learning.status || 'pending',
        detail_requires_explicit_read: true,
      });
    } catch {
      issues.push({ reason_code: 'experiment-state-invalid', ref: relative(root, path).replaceAll('\\', '/') });
    }
  }
  return { experiments: experiments.sort((a, b) => a.experiment_id.localeCompare(b.experiment_id, undefined, { numeric: true })), issues };
}

export function readExperimentDetail(root, experimentId, { runRecords = null } = {}) {
  if (!EXPERIMENT_ID_RE.test(experimentId || '')) throw new Error('experiment-id-invalid');
  const entry = listExperimentContracts(root).find(({ contract }) => contract.experiment_id === experimentId);
  if (!entry) throw new Error('experiment-not-found');
  const state = stateFor(root, experimentId);
  let records = runRecords;
  if (!records) {
    try { records = latestRunRecords(root); } catch { records = []; }
  }
  const runRefs = [...new Set([...(state?.run_refs || []), ...linkedRunRefs(records, experimentId)])];
  return {
    protocol_version: 1,
    experiment_id: experimentId,
    contract: entry.contract,
    state: state ? { ...state, run_refs: runRefs } : null,
    pipeline: pipeline(entry.contract, state, runRefs),
    privacy: {
      content_shared_with_inevita: false,
      explicit_local_detail_read: true,
      source_payload_exposed: false,
    },
  };
}

export function experimentDirectories(root) {
  return paths(root);
}
