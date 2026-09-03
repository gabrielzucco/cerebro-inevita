import { createHash } from 'node:crypto';
import {
  existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, realpathSync, statSync,
} from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import {
  ID_RE, VERSION_RE, latestRunRecords, layout, readJson, validateSystemContract, writeJsonAtomic,
} from './system-protocol.mjs';
import { readExecutionTrace } from './execution-trace-runtime.mjs';
import { validateJsonSchema } from './json-schema-runtime.mjs';

const OPAQUE_REF_RE = /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$/;
const LOCAL_REF_RE = /^(?!.*\.\.(?:\/|$))[A-Za-z0-9.][A-Za-z0-9_./:-]{0,255}$/;
const HASH_RE = /^[a-f0-9]{64}$/;
const ACCEPTED_VERSION_RE = /^\d+(?:\.x|\.\d+(?:\.x|\.\d+)?)?$/;
const EXPERIMENT_ID_RE = /^EXP-[A-Za-z0-9_-]{1,48}$/;
const MAX_ARTIFACT_BYTES = 4 * 1024 * 1024;
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

function safeDirectory(root, configured, fallback, { runtimeOnly = false } = {}) {
  const rootPath = resolve(root);
  const target = resolve(root, configured || fallback);
  const lexical = relative(rootPath, target);
  if (!lexical || lexical.startsWith('..') || lexical.startsWith(sep)) throw new Error('handoff-layout-outside-brain');
  if (runtimeOnly) {
    const runtime = resolve(root, '.cerebro', 'runtime');
    const runtimeRelative = relative(runtime, target);
    if (!runtimeRelative || runtimeRelative.startsWith('..') || runtimeRelative.startsWith(sep)) {
      throw new Error('handoff-receipts-not-private');
    }
  }
  mkdirSync(target, { recursive: true, mode: 0o700 });
  if (lstatSync(target).isSymbolicLink()) throw new Error('handoff-directory-symlink-blocked');
  const realRoot = realpathSync(rootPath);
  const realTarget = realpathSync(target);
  const realRelative = relative(realRoot, realTarget);
  if (!realRelative || realRelative.startsWith('..') || realRelative.startsWith(sep)) {
    throw new Error('handoff-directory-outside-brain');
  }
  return realTarget;
}

export function handoffContractDirectory(root) {
  return safeDirectory(root, layout(root).handoffContracts, join('.cerebro', 'contracts', 'handoffs'));
}

export function handoffReceiptDirectory(root) {
  return safeDirectory(root, layout(root).handoffReceipts, join('.cerebro', 'runtime', 'receipts', 'handoffs'), {
    runtimeOnly: true,
  });
}

function systemContract(root, systemRef) {
  const directory = resolve(root, layout(root).systemContracts || join('.cerebro', 'contracts', 'systems'));
  const path = join(directory, `${systemRef}.json`);
  if (!existsSync(path) || lstatSync(path).isSymbolicLink()) throw new Error('handoff-system-contract-missing');
  const contract = readJson(path, 'System Contract');
  if (validateSystemContract(contract).length || contract.system_id !== systemRef) {
    throw new Error('handoff-system-contract-invalid');
  }
  return contract;
}

function interfaceErrors(root, contract) {
  const errors = [];
  const producer = systemContract(root, contract.producer.system_ref);
  const consumer = systemContract(root, contract.consumer.system_ref);
  const produced = producer.artifacts?.produces?.find((item) => item.role === contract.producer.artifact_role);
  if (!produced) errors.push('producer não declara artifact_role em artifacts.produces');
  else {
    if (produced.artifact_type !== contract.artifact.artifact_type) errors.push('artifact_type diverge do produtor');
    if (produced.schema_ref !== contract.artifact.schema_ref) errors.push('schema_ref diverge do produtor');
  }
  const consumed = consumer.artifacts?.consumes?.find((item) => item.role === contract.consumer.input_role);
  if (!consumed) errors.push('consumer não declara input_role em artifacts.consumes');
  else {
    if (consumed.artifact_type !== contract.artifact.artifact_type) errors.push('artifact_type diverge do consumidor');
    if (consumed.schema_ref !== contract.artifact.schema_ref) errors.push('schema_ref diverge do consumidor');
    if (contract.consumer.required !== consumed.required) errors.push('required diverge do consumidor');
    if (!contract.artifact.accepted_versions.some((version) => consumed.accepted_versions.includes(version))) {
      errors.push('accepted_versions não intersectam a interface do consumidor');
    }
  }
  return errors;
}

export function registerHandoffContract(root, contract) {
  const errors = validateHandoffContract(contract);
  if (errors.length === 0) errors.push(...interfaceErrors(root, contract));
  if (errors.length) throw new Error(`handoff-contract-invalid:${errors.join('|')}`);
  const path = join(handoffContractDirectory(root), `${contract.handoff_id}.json`);
  if (existsSync(path)) {
    const current = readJson(path, 'Handoff Contract');
    if (JSON.stringify(current) !== JSON.stringify(contract)) throw new Error('handoff-contract-already-exists');
    return { contract: current, ref: `handoff-contract:${current.handoff_id}` };
  }
  writeJsonAtomic(path, contract);
  return { contract, ref: `handoff-contract:${contract.handoff_id}` };
}

export function loadHandoffContract(root, handoffId) {
  if (!ID_RE.test(handoffId || '')) throw new Error('handoff-id-invalid');
  const path = join(handoffContractDirectory(root), `${handoffId}.json`);
  if (!existsSync(path) || lstatSync(path).isSymbolicLink()) throw new Error('handoff-contract-missing');
  const contract = readJson(path, 'Handoff Contract');
  const errors = [...validateHandoffContract(contract), ...interfaceErrors(root, contract)];
  if (errors.length || contract.handoff_id !== handoffId) throw new Error('handoff-contract-invalid');
  return { contract, ref: `handoff-contract:${handoffId}` };
}

export function listHandoffContracts(root) {
  const configured = resolve(root, layout(root).handoffContracts || join('.cerebro', 'contracts', 'handoffs'));
  if (!existsSync(configured)) return [];
  const directory = handoffContractDirectory(root);
  return readdirSync(directory).filter((name) => name.endsWith('.json')).sort().flatMap((name) => {
    try { return [loadHandoffContract(root, name.slice(0, -5)).contract]; } catch { return []; }
  });
}

export function listHandoffReceipts(root) {
  const configured = resolve(root, layout(root).handoffReceipts || join('.cerebro', 'runtime', 'receipts', 'handoffs'));
  if (!existsSync(configured)) return [];
  const directory = handoffReceiptDirectory(root);
  return readdirSync(directory).filter((name) => name.endsWith('.json')).sort().flatMap((name) => {
    try {
      const receipt = readJson(join(directory, name), 'Handoff Receipt');
      return validateHandoffReceipt(receipt).length ? [] : [receipt];
    } catch { return []; }
  });
}

export function readHandoffReceipt(root, receiptId) {
  if (!OPAQUE_REF_RE.test(receiptId || '')) throw new Error('handoff-receipt-id-invalid');
  const path = join(handoffReceiptDirectory(root), `${receiptId}.json`);
  if (!existsSync(path) || lstatSync(path).isSymbolicLink()) throw new Error('handoff-receipt-missing');
  const receipt = readJson(path, 'Handoff Receipt');
  const errors = validateHandoffReceipt(receipt);
  if (errors.length || receipt.receipt_id !== receiptId) throw new Error('handoff-receipt-invalid');
  return receipt;
}

function parseRunRef(value) {
  if (!String(value).startsWith('run-record:')) throw new Error('handoff-run-ref-invalid');
  return value.slice('run-record:'.length);
}

function versionAccepted(version, ranges) {
  const parts = String(version).split(/[+-]/, 1)[0].split('.');
  return ranges.some((range) => {
    const accepted = String(range).split('.');
    return accepted.every((part, index) => part === 'x' || part === parts[index]);
  });
}

function safeArtifact(root, artifactRef) {
  if (!LOCAL_REF_RE.test(artifactRef || '')) throw new Error('handoff-artifact-ref-invalid');
  const rootPath = realpathSync(root);
  const path = resolve(root, artifactRef);
  const lexical = relative(resolve(root), path);
  if (!lexical || lexical.startsWith('..') || lexical.startsWith(sep)) throw new Error('handoff-artifact-outside-brain');
  if (!existsSync(path) || lstatSync(path).isSymbolicLink()) throw new Error('handoff-artifact-missing');
  const stat = statSync(path);
  if (!stat.isFile() || stat.size < 2 || stat.size > MAX_ARTIFACT_BYTES) throw new Error('handoff-artifact-size-invalid');
  const realPath = realpathSync(path);
  const realRelative = relative(rootPath, realPath);
  if (!realRelative || realRelative.startsWith('..') || realRelative.startsWith(sep)) {
    throw new Error('handoff-artifact-outside-brain');
  }
  const bytes = readFileSync(realPath);
  let value;
  try { value = JSON.parse(bytes.toString('utf8')); } catch { throw new Error('handoff-artifact-json-invalid'); }
  return { bytes, value };
}

function traceProves(root, runId, artifactRef, direction, { chainId, mode, experimentRef, handoffId }) {
  const events = readExecutionTrace(root, runId);
  const field = direction === 'producer' ? 'output_refs' : 'input_refs';
  return events.length > 0
    && events.every((event) => event.chain_id === chainId && event.mode === mode
      && event.experiment_ref === experimentRef
      && event.handoff_refs.includes(`handoff-contract:${handoffId}`))
    && events.some((event) => event[field].includes(artifactRef));
}

export function recordAcceptedHandoff(root, handoffId, {
  receiptId,
  chainId,
  mode,
  experimentRef = null,
  producerRunRef,
  consumerRunRef,
  artifactRef,
  humanDecision = 'approved',
  approvalRef = null,
  producedAt,
  gatedAt,
  consumedAt,
} = {}) {
  if (!OPAQUE_REF_RE.test(receiptId || '')) throw new Error('handoff-receipt-id-invalid');
  if (!OPAQUE_REF_RE.test(chainId || '')) throw new Error('handoff-chain-id-invalid');
  if (!['replay', 'live'].includes(mode)) throw new Error('handoff-mode-invalid');
  if (experimentRef !== null && !EXPERIMENT_ID_RE.test(experimentRef || '')) throw new Error('handoff-experiment-ref-invalid');
  const { contract } = loadHandoffContract(root, handoffId);
  if (contract.status !== 'active') throw new Error('handoff-contract-not-active');
  const producerId = parseRunRef(producerRunRef);
  const consumerId = parseRunRef(consumerRunRef);
  const records = latestRunRecords(root);
  const producer = records.find((record) => record.run_id === producerId);
  const consumer = records.find((record) => record.run_id === consumerId);
  if (!producer || !consumer) throw new Error('handoff-run-missing');
  if (producer.system_id !== contract.producer.system_ref || consumer.system_id !== contract.consumer.system_ref) {
    throw new Error('handoff-run-system-mismatch');
  }
  for (const record of [producer, consumer]) {
    if (record.chain_id !== chainId || record.mode !== mode || record.experiment_ref !== experimentRef) {
      throw new Error('handoff-run-lineage-mismatch');
    }
    if (!record.handoff_refs?.includes(`handoff-contract:${handoffId}`)) {
      throw new Error('handoff-contract-ref-missing-from-run');
    }
  }
  if (!producer.output_refs.includes(artifactRef)) throw new Error('handoff-artifact-not-produced');
  const traceLineage = { chainId, mode, experimentRef, handoffId };
  if (!traceProves(root, producerId, artifactRef, 'producer', traceLineage)) throw new Error('handoff-producer-trace-missing');
  if (!traceProves(root, consumerId, artifactRef, 'consumer', traceLineage)) throw new Error('handoff-consumer-trace-missing');
  const artifact = safeArtifact(root, artifactRef);
  const schemaPath = resolve(root, contract.artifact.schema_ref);
  const schemaRelative = relative(resolve(root), schemaPath);
  if (!schemaRelative || schemaRelative.startsWith('..') || schemaRelative.startsWith(sep)) {
    throw new Error('handoff-artifact-schema-outside-brain');
  }
  if (!existsSync(schemaPath) || lstatSync(schemaPath).isSymbolicLink()) throw new Error('handoff-artifact-schema-missing');
  const schema = readJson(schemaPath, 'Artifact Schema');
  const schemaErrors = validateJsonSchema(artifact.value, schema);
  if (schemaErrors.length) throw new Error(`handoff-artifact-schema-invalid:${schemaErrors.join('|')}`);
  if (artifact.value.artifact_type !== contract.artifact.artifact_type) throw new Error('handoff-artifact-type-mismatch');
  if (!versionAccepted(artifact.value.schema_version, contract.artifact.accepted_versions)) {
    throw new Error('handoff-artifact-version-not-accepted');
  }
  if (artifact.value.produced_by?.system_ref !== producer.system_id
    || artifact.value.produced_by?.run_ref !== producer.run_id) throw new Error('handoff-artifact-producer-mismatch');
  if (artifact.value.experiment_ref !== experimentRef) throw new Error('handoff-artifact-experiment-mismatch');
  if (contract.acceptance_gate.human_approval_required && humanDecision !== 'approved') {
    throw new Error('handoff-human-approval-required');
  }
  if (contract.acceptance_gate.human_approval_required && !LOCAL_REF_RE.test(approvalRef || '')) {
    throw new Error('handoff-approval-ref-required');
  }
  for (const [label, value] of [['produced_at', producedAt], ['gated_at', gatedAt], ['consumed_at', consumedAt]]) {
    if (!Number.isFinite(Date.parse(value || ''))) throw new Error(`handoff-${label.replace('_', '-')}-invalid`);
  }
  const checks = contract.acceptance_gate.deterministic_checks.map((check) => ({ check, passed: true }));
  const receipt = {
    protocol_version: 1,
    receipt_id: receiptId,
    handoff_ref: handoffId,
    chain_id: chainId,
    mode,
    experiment_ref: experimentRef,
    producer_run_ref: producerRunRef,
    artifact: {
      artifact_ref: artifactRef,
      artifact_type: contract.artifact.artifact_type,
      schema_ref: contract.artifact.schema_ref,
      schema_version: artifact.value.schema_version,
      sha256: createHash('sha256').update(artifact.bytes).digest('hex'),
      schema_validated: true,
    },
    gate: {
      result: 'passed', checks,
      human_decision: contract.acceptance_gate.human_approval_required ? humanDecision : 'not-required',
    },
    consumer_run_ref: consumerRunRef,
    status: 'accepted',
    produced_at: new Date(producedAt).toISOString(),
    gated_at: new Date(gatedAt).toISOString(),
    consumed_at: new Date(consumedAt).toISOString(),
    privacy: { content_shared_with_inevita: false },
    extensions: { approval_ref: approvalRef },
  };
  const errors = validateHandoffReceipt(receipt);
  if (errors.length) throw new Error(`handoff-receipt-invalid:${errors.join('|')}`);
  const path = join(handoffReceiptDirectory(root), `${receipt.receipt_id}.json`);
  if (existsSync(path)) throw new Error('handoff-receipt-already-exists');
  writeJsonAtomic(path, receipt);
  return { receipt, ref: `handoff-receipt:${receipt.receipt_id}` };
}
