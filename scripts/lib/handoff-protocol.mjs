import { ID_RE, VERSION_RE } from './system-protocol.mjs';

const OPAQUE_REF_RE = /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$/;
const LOCAL_REF_RE = /^[A-Za-z0-9][A-Za-z0-9_./:-]{0,255}$/;
const HASH_RE = /^[a-f0-9]{64}$/;
const ACCEPTED_VERSION_RE = /^\d+(?:\.x|\.\d+(?:\.x|\.\d+)?)?$/;
const EXPERIMENT_ID_RE = /^EXP-[A-Za-z0-9_-]{1,48}$/;
const CONTRACT_KEYS = new Set([
  'protocol_version', 'handoff_id', 'name', 'version', 'status', 'producer', 'consumer',
  'artifact', 'trigger', 'acceptance_gate', 'permissions', 'privacy', 'extensions',
]);
const RECEIPT_KEYS = new Set([
  'protocol_version', 'receipt_id', 'handoff_ref', 'chain_id', 'mode', 'experiment_ref',
  'producer_run_ref', 'artifact', 'gate', 'consumer_run_ref', 'status',
  'produced_at', 'gated_at', 'consumed_at', 'privacy', 'extensions',
]);

function object(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function requiredText(errors, value, path) {
  if (typeof value !== 'string' || !value.trim()) errors.push(`${path} precisa ser texto não vazio`);
}

function exactKeys(errors, value, allowed, path) {
  if (!object(value)) return;
  for (const key of Object.keys(value)) if (!allowed.has(key)) errors.push(`${path}.${key} não é permitido`);
}

function optionalDateTime(errors, value, path) {
  if (value === null) return;
  if (typeof value !== 'string' || !Number.isFinite(Date.parse(value))) errors.push(`${path} inválido`);
}

export function validateHandoffContract(value) {
  const errors = [];
  if (!object(value)) return ['handoff contract precisa ser objeto'];
  exactKeys(errors, value, CONTRACT_KEYS, 'handoff_contract');
  if (value.protocol_version !== 1) errors.push('protocol_version precisa ser 1');
  if (!ID_RE.test(value.handoff_id || '')) errors.push('handoff_id inválido');
  requiredText(errors, value.name, 'name');
  if (!VERSION_RE.test(value.version || '')) errors.push('version precisa ser semver');
  if (!['proposed', 'active', 'suspended'].includes(value.status)) errors.push('status inválido');
  if (!object(value.producer)) errors.push('producer precisa ser objeto');
  else {
    exactKeys(errors, value.producer, new Set(['system_ref', 'artifact_role']), 'producer');
    if (!ID_RE.test(value.producer.system_ref || '')) errors.push('producer.system_ref inválido');
    if (!ID_RE.test(value.producer.artifact_role || '')) errors.push('producer.artifact_role inválido');
  }
  if (!object(value.consumer)) errors.push('consumer precisa ser objeto');
  else {
    exactKeys(errors, value.consumer, new Set(['system_ref', 'input_role', 'required']), 'consumer');
    if (!ID_RE.test(value.consumer.system_ref || '')) errors.push('consumer.system_ref inválido');
    if (!ID_RE.test(value.consumer.input_role || '')) errors.push('consumer.input_role inválido');
    if (typeof value.consumer.required !== 'boolean') errors.push('consumer.required precisa ser booleano');
  }
  if (object(value.producer) && object(value.consumer)
    && value.producer.system_ref && value.producer.system_ref === value.consumer.system_ref) {
    errors.push('produtor e consumidor precisam ser Sistemas diferentes');
  }
  if (!object(value.artifact)) errors.push('artifact precisa ser objeto');
  else {
    exactKeys(errors, value.artifact, new Set(['artifact_type', 'schema_ref', 'accepted_versions']), 'artifact');
    if (!ID_RE.test(value.artifact.artifact_type || '')) errors.push('artifact.artifact_type inválido');
    if (!LOCAL_REF_RE.test(value.artifact.schema_ref || '')) errors.push('artifact.schema_ref inválido');
    if (!Array.isArray(value.artifact.accepted_versions) || value.artifact.accepted_versions.length < 1) {
      errors.push('artifact.accepted_versions precisa ter pelo menos 1 item');
    } else {
      if (new Set(value.artifact.accepted_versions).size !== value.artifact.accepted_versions.length) {
        errors.push('artifact.accepted_versions não pode repetir valores');
      }
      value.artifact.accepted_versions.forEach((range, index) => {
        if (!ACCEPTED_VERSION_RE.test(range || '')) errors.push(`artifact.accepted_versions[${index}] inválido`);
      });
    }
  }
  if (!object(value.trigger)) errors.push('trigger precisa ser objeto');
  else {
    exactKeys(errors, value.trigger, new Set(['type', 'description']), 'trigger');
    if (!['manual', 'event'].includes(value.trigger.type)) errors.push('trigger.type inválido');
    requiredText(errors, value.trigger.description, 'trigger.description');
  }
  if (!object(value.acceptance_gate)) errors.push('acceptance_gate precisa ser objeto');
  else {
    exactKeys(errors, value.acceptance_gate, new Set(['deterministic_checks', 'human_approval_required']), 'acceptance_gate');
    if (!Array.isArray(value.acceptance_gate.deterministic_checks) || value.acceptance_gate.deterministic_checks.length < 1) {
      errors.push('acceptance_gate.deterministic_checks precisa ter pelo menos 1 item');
    } else {
      value.acceptance_gate.deterministic_checks.forEach((check, index) => {
        requiredText(errors, check, `acceptance_gate.deterministic_checks[${index}]`);
      });
    }
    if (typeof value.acceptance_gate.human_approval_required !== 'boolean') {
      errors.push('acceptance_gate.human_approval_required precisa ser booleano');
    }
  }
  if (!object(value.permissions)) errors.push('permissions precisa ser objeto');
  else {
    exactKeys(errors, value.permissions, new Set(['transfer', 'external_actions']), 'permissions');
    if (value.permissions.transfer !== 'reference-only') errors.push('permissions.transfer precisa ser reference-only');
    if (value.permissions.external_actions !== false) errors.push('permissions.external_actions precisa ser false');
  }
  if (!object(value.privacy) || value.privacy.content_shared_with_inevita !== false) {
    errors.push('privacy.content_shared_with_inevita precisa ser false');
  }
  if (value.extensions !== undefined && !object(value.extensions)) errors.push('extensions precisa ser objeto');
  return [...new Set(errors)];
}

export function validateHandoffReceipt(value) {
  const errors = [];
  if (!object(value)) return ['handoff receipt precisa ser objeto'];
  exactKeys(errors, value, RECEIPT_KEYS, 'handoff_receipt');
  if (value.protocol_version !== 1) errors.push('protocol_version precisa ser 1');
  if (!OPAQUE_REF_RE.test(value.receipt_id || '')) errors.push('receipt_id inválido');
  if (!ID_RE.test(value.handoff_ref || '')) errors.push('handoff_ref inválido');
  if (!OPAQUE_REF_RE.test(value.chain_id || '')) errors.push('chain_id inválido');
  if (!['replay', 'live'].includes(value.mode)) errors.push('mode precisa ser replay ou live');
  if (value.experiment_ref !== null && !EXPERIMENT_ID_RE.test(value.experiment_ref || '')) {
    errors.push('experiment_ref precisa ser EXP-* ou null');
  }
  if (!OPAQUE_REF_RE.test(value.producer_run_ref || '')) errors.push('producer_run_ref inválido');
  if (!object(value.artifact)) errors.push('artifact precisa ser objeto');
  else {
    exactKeys(errors, value.artifact, new Set([
      'artifact_ref', 'artifact_type', 'schema_ref', 'schema_version', 'sha256', 'schema_validated',
    ]), 'artifact');
    if (!LOCAL_REF_RE.test(value.artifact.artifact_ref || '')) errors.push('artifact.artifact_ref inválido');
    if (!ID_RE.test(value.artifact.artifact_type || '')) errors.push('artifact.artifact_type inválido');
    if (!LOCAL_REF_RE.test(value.artifact.schema_ref || '')) errors.push('artifact.schema_ref inválido');
    if (!VERSION_RE.test(value.artifact.schema_version || '')) errors.push('artifact.schema_version precisa ser semver');
    if (!HASH_RE.test(value.artifact.sha256 || '')) errors.push('artifact.sha256 inválido');
    if (typeof value.artifact.schema_validated !== 'boolean') errors.push('artifact.schema_validated precisa ser booleano');
  }
  if (!object(value.gate)) errors.push('gate precisa ser objeto');
  else {
    exactKeys(errors, value.gate, new Set(['result', 'checks', 'human_decision']), 'gate');
    if (!['passed', 'failed', 'pending'].includes(value.gate.result)) errors.push('gate.result inválido');
    if (!Array.isArray(value.gate.checks)) errors.push('gate.checks precisa ser lista');
    else {
      value.gate.checks.forEach((item, index) => {
        if (!object(item)) {
          errors.push(`gate.checks[${index}] precisa ser objeto`);
          return;
        }
        exactKeys(errors, item, new Set(['check', 'passed']), `gate.checks[${index}]`);
        requiredText(errors, item.check, `gate.checks[${index}].check`);
        if (typeof item.passed !== 'boolean') errors.push(`gate.checks[${index}].passed precisa ser booleano`);
      });
    }
    if (!['approved', 'rejected', 'pending', 'not-required'].includes(value.gate.human_decision)) {
      errors.push('gate.human_decision inválida');
    }
  }
  if (value.consumer_run_ref !== null && !OPAQUE_REF_RE.test(value.consumer_run_ref || '')) {
    errors.push('consumer_run_ref precisa ser referência opaca ou null');
  }
  if (!['delivered', 'accepted', 'rejected', 'failed'].includes(value.status)) errors.push('status inválido');
  if (typeof value.produced_at !== 'string' || !Number.isFinite(Date.parse(value.produced_at))) {
    errors.push('produced_at inválido');
  }
  optionalDateTime(errors, value.gated_at, 'gated_at');
  optionalDateTime(errors, value.consumed_at, 'consumed_at');
  if (object(value.gate)) {
    if (value.gate.result === 'pending' && value.gated_at !== null) errors.push('gate pendente não pode ter gated_at');
    if (['passed', 'failed'].includes(value.gate.result) && !value.gated_at) {
      errors.push('gate decidido exige gated_at');
    }
    if (value.gate.result === 'passed') {
      if (value.artifact?.schema_validated !== true) errors.push('gate não pode passar sem schema validado no artefato');
      if (Array.isArray(value.gate.checks) && value.gate.checks.some((item) => item?.passed === false)) {
        errors.push('gate não pode passar com check reprovado');
      }
    }
  }
  if (value.status === 'accepted') {
    if (value.gate?.result !== 'passed') errors.push('status accepted exige gate.result passed');
    if (!value.consumer_run_ref) errors.push('status accepted exige consumer_run_ref');
    if (!value.consumed_at) errors.push('status accepted exige consumed_at');
  }
  if (value.status === 'delivered' && value.consumer_run_ref !== null) {
    errors.push('status delivered não pode ter consumer_run_ref; use accepted');
  }
  if (value.status === 'rejected'
    && value.gate?.result !== 'failed' && value.gate?.human_decision !== 'rejected') {
    errors.push('status rejected exige gate reprovado ou decisão humana rejected');
  }
  const producedAt = Date.parse(value.produced_at || '');
  if (value.gated_at && Date.parse(value.gated_at) < producedAt) errors.push('gated_at não pode ser anterior a produced_at');
  if (value.consumed_at && value.gated_at && Date.parse(value.consumed_at) < Date.parse(value.gated_at)) {
    errors.push('consumed_at não pode ser anterior a gated_at');
  }
  if (!object(value.privacy) || value.privacy.content_shared_with_inevita !== false) {
    errors.push('privacy.content_shared_with_inevita precisa ser false');
  }
  if (value.extensions !== undefined && !object(value.extensions)) errors.push('extensions precisa ser objeto');
  return [...new Set(errors)];
}
