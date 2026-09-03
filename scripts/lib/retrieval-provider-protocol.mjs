import { isAbsolute } from 'node:path';

const ID_RE = /^[a-z0-9][a-z0-9-]{0,63}$/;
const VERSION_RE = /^\d+\.\d+\.\d+(?:[-+][A-Za-z0-9.-]+)?$/;
const LOCAL_REF_RE = /^(?!\/)(?!.*(?:^|\/)\.\.(?:\/|$))[A-Za-z0-9.][A-Za-z0-9_./:-]{0,255}$/;
const OPERATIONS = new Set(['retrieve', 'resolve-context', 'health']);
const STATUSES = new Set(['active', 'degraded', 'disabled']);
const ASSURANCE = new Set(['declared', 'receipt-audited', 'runtime-enforced']);
const SECRET_RE = /Bearer\s+|-----BEGIN .*PRIVATE KEY-----|\b(?:sk|ghp|xoxb)[-_A-Za-z0-9]{12,}/i;

function object(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function closed(errors, value, path, allowedKeys) {
  if (!object(value)) return;
  const allowed = new Set(allowedKeys);
  for (const key of Object.keys(value)) if (!allowed.has(key)) errors.push(`${path}.${key} não é permitido`);
}

function text(errors, value, path) {
  if (typeof value !== 'string' || !value.trim()) errors.push(`${path} precisa ser texto não vazio`);
}

function localRef(errors, value, path) {
  if (typeof value !== 'string' || isAbsolute(value) || !LOCAL_REF_RE.test(value)) {
    errors.push(`${path} precisa ser referência local segura`);
  }
}

export function validateRetrievalProviderContract(value) {
  const errors = [];
  if (!object(value)) return ['retrieval provider contract precisa ser objeto'];
  closed(errors, value, 'retrieval_provider', [
    'protocol_version', 'provider_id', 'name', 'version', 'status', 'interface', 'driver',
    'corpus', 'privacy', 'assurance', 'license',
  ]);
  if (value.protocol_version !== 1) errors.push('protocol_version precisa ser 1');
  if (!ID_RE.test(value.provider_id || '')) errors.push('provider_id inválido');
  text(errors, value.name, 'name');
  if (!VERSION_RE.test(value.version || '')) errors.push('version precisa ser semver');
  if (!STATUSES.has(value.status)) errors.push('status inválido');

  if (!object(value.interface)) errors.push('interface precisa ser objeto');
  else {
    closed(errors, value.interface, 'interface', ['operations', 'receipt_kind', 'fail_mode']);
    const operations = Array.isArray(value.interface.operations) ? value.interface.operations : [];
    if (!Array.isArray(value.interface.operations) || operations.length < 2) errors.push('interface.operations precisa ter pelo menos 2 itens');
    if (new Set(operations).size !== operations.length) errors.push('interface.operations não pode repetir itens');
    for (const operation of operations) if (!OPERATIONS.has(operation)) errors.push('interface.operations contém valor inválido');
    if (!operations.includes('retrieve') || !operations.includes('health')) errors.push('interface.operations exige retrieve e health');
    if (value.interface.receipt_kind !== 'retrieval-receipt') errors.push('interface.receipt_kind inválido');
    if (value.interface.fail_mode !== 'closed') errors.push('interface.fail_mode precisa ser closed');
  }

  if (!object(value.driver)) errors.push('driver precisa ser objeto');
  else {
    closed(errors, value.driver, 'driver', [
      'implementation', 'implementation_version', 'transport', 'adapter_ref', 'profile_ref',
    ]);
    if (!ID_RE.test(value.driver.implementation || '')) errors.push('driver.implementation inválido');
    text(errors, value.driver.implementation_version, 'driver.implementation_version');
    if (!ID_RE.test(value.driver.transport || '')) errors.push('driver.transport inválido');
    localRef(errors, value.driver.adapter_ref, 'driver.adapter_ref');
    localRef(errors, value.driver.profile_ref, 'driver.profile_ref');
  }

  if (!object(value.corpus)) errors.push('corpus precisa ser objeto');
  else {
    closed(errors, value.corpus, 'corpus', ['source_ref', 'catalog_ref', 'policy']);
    if (!ID_RE.test(value.corpus.source_ref || '')) errors.push('corpus.source_ref inválido');
    localRef(errors, value.corpus.catalog_ref, 'corpus.catalog_ref');
    if (value.corpus.policy !== 'explicit-allowlist') errors.push('corpus.policy precisa ser explicit-allowlist');
  }

  if (!object(value.privacy)) errors.push('privacy precisa ser objeto');
  else {
    closed(errors, value.privacy, 'privacy', [
      'local_only', 'query_persisted', 'content_persisted_in_receipt', 'third_party_zone_indexed',
    ]);
    if (value.privacy.local_only !== true) errors.push('privacy.local_only precisa ser true');
    for (const field of ['query_persisted', 'content_persisted_in_receipt', 'third_party_zone_indexed']) {
      if (value.privacy[field] !== false) errors.push(`privacy.${field} precisa ser false`);
    }
  }
  if (!ASSURANCE.has(value.assurance)) errors.push('assurance inválida');

  if (!object(value.license)) errors.push('license precisa ser objeto');
  else {
    closed(errors, value.license, 'license', ['spdx', 'notice_ref']);
    text(errors, value.license.spdx, 'license.spdx');
    text(errors, value.license.notice_ref, 'license.notice_ref');
    if (typeof value.license.notice_ref === 'string'
      && !value.license.notice_ref.startsWith('https://')) localRef(errors, value.license.notice_ref, 'license.notice_ref');
  }
  if (SECRET_RE.test(JSON.stringify(value))) errors.push('contrato não pode carregar segredo');
  return errors;
}
