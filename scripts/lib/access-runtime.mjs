import { randomUUID } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';
import {
  ID_RE,
  REF_ID_RE,
  layout,
  readJson,
  validateAccessGrant,
  writeJsonAtomic,
} from './system-protocol.mjs';

const LOCAL_REF_RE = /^[A-Za-z0-9][A-Za-z0-9_./:-]{0,255}$/;
const CREDENTIAL_REF_RE = /^[a-z][a-z0-9-]{1,31}:[A-Za-z0-9][A-Za-z0-9_./:-]{0,223}$/;
const DECISIONS = new Set(['allowed', 'denied', 'failed', 'revoked', 'file-only']);
const MODES = new Set(['read', 'propose', 'write-with-approval', 'external-action']);
const ASSURANCES = new Set(['runtime-enforced', 'receipt-audited', 'exported']);
const CREDENTIAL_STATUSES = new Set(['present', 'missing', 'not-checked']);

function object(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function safeConfiguredDirectory(root, configured, fallback) {
  const brainRoot = resolve(root);
  const target = resolve(root, configured || fallback);
  if (target === brainRoot || !target.startsWith(`${brainRoot}${sep}`)) {
    throw new Error('layout do runtime aponta para fora do cérebro');
  }
  return target;
}

function accessGrantDirectory(root) {
  const configured = layout(root).accessGrants;
  return safeConfiguredDirectory(root, configured, join('.cerebro', 'contracts', 'access-grants'));
}

export function accessGrantPath(root, grantId) {
  if (!REF_ID_RE.test(grantId || '')) throw new Error('grant_id inválido');
  return join(accessGrantDirectory(root), `${grantId}.json`);
}

function accessReceiptDirectory(root) {
  const configured = layout(root).accessReceipts;
  return safeConfiguredDirectory(root, configured, join('.cerebro', 'runtime', 'receipts', 'access'));
}

export function validateAccessReceipt(value) {
  const errors = [];
  if (!object(value)) return ['access receipt precisa ser objeto'];
  const allowed = new Set([
    'protocol_version', 'receipt_id', 'decision', 'occurred_at', 'grant_ref', 'grant_id',
    'subject_ref', 'system_ref', 'source_ref', 'action', 'mode', 'assurance', 'reason_code',
    'credential_ref', 'credential_status', 'operation_ref', 'approved_by', 'privacy',
  ]);
  for (const key of Object.keys(value)) if (!allowed.has(key)) errors.push(`${key} não é permitido`);
  if (value.protocol_version !== 1) errors.push('protocol_version precisa ser 1');
  if (!REF_ID_RE.test(value.receipt_id || '')) errors.push('receipt_id inválido');
  if (!DECISIONS.has(value.decision)) errors.push('decision inválida');
  if (!Number.isFinite(Date.parse(value.occurred_at || ''))) errors.push('occurred_at inválido');
  if (!LOCAL_REF_RE.test(value.grant_ref || '')) errors.push('grant_ref inválido');
  if (!REF_ID_RE.test(value.grant_id || '')) errors.push('grant_id inválido');
  if (!REF_ID_RE.test(value.subject_ref || '')) errors.push('subject_ref inválido');
  if (value.system_ref !== null && !ID_RE.test(value.system_ref || '')) errors.push('system_ref inválido');
  if (value.source_ref !== null && !REF_ID_RE.test(value.source_ref || '')) errors.push('source_ref inválido');
  if (value.action !== null && !ID_RE.test(value.action || '')) errors.push('action inválida');
  if (!MODES.has(value.mode)) errors.push('mode inválido');
  if (!ASSURANCES.has(value.assurance)) errors.push('assurance inválido');
  if (!ID_RE.test(value.reason_code || '')) errors.push('reason_code inválido');
  if (value.credential_ref !== null && !LOCAL_REF_RE.test(value.credential_ref || '')) errors.push('credential_ref inválido');
  if (!CREDENTIAL_STATUSES.has(value.credential_status)) errors.push('credential_status inválido');
  if (value.operation_ref !== null && !LOCAL_REF_RE.test(value.operation_ref || '')) errors.push('operation_ref inválido');
  if (value.approved_by !== null && !REF_ID_RE.test(value.approved_by || '')) errors.push('approved_by inválido');
  if (!object(value.privacy) || value.privacy.content_shared_with_inevita !== false
    || Object.keys(value.privacy || {}).some((key) => key !== 'content_shared_with_inevita')) {
    errors.push('privacy inválida');
  }
  if (value.decision === 'revoked') {
    if (value.system_ref !== null || value.source_ref !== null || value.action !== null) {
      errors.push('revogação precisa representar o grant inteiro');
    }
    if (value.credential_status !== 'not-checked') errors.push('revogação não pode alegar inspeção da credencial');
    if (value.approved_by === null) errors.push('revogação exige approved_by');
  } else if (value.system_ref === null || value.source_ref === null || value.action === null) {
    errors.push('recibo operacional exige system_ref, source_ref e action');
  }
  const serialized = JSON.stringify(value);
  if (/Bearer\s+|-----BEGIN .*PRIVATE KEY-----|\b(?:sk|ghp|xoxb)[-_A-Za-z0-9]{12,}/i.test(serialized)) {
    errors.push('receipt parece conter segredo');
  }
  return errors;
}

function receipt(root, grant, request, decision, reasonCode, {
  credentialStatus = 'not-checked',
  operationRef = null,
  approvedBy = null,
  now = new Date(),
  receiptId = `access-${randomUUID()}`,
} = {}) {
  const value = {
    protocol_version: 1,
    receipt_id: receiptId,
    decision,
    occurred_at: now.toISOString(),
    grant_ref: `access-grant:${grant.grant_id}`,
    grant_id: grant.grant_id,
    subject_ref: request.subject_ref,
    system_ref: request.system_ref,
    source_ref: request.source_ref,
    action: request.action,
    mode: request.mode,
    assurance: grant.assurance,
    reason_code: reasonCode,
    credential_ref: grant.credential_ref,
    credential_status: credentialStatus,
    operation_ref: operationRef,
    approved_by: approvedBy,
    privacy: { content_shared_with_inevita: false },
  };
  const errors = validateAccessReceipt(value);
  if (errors.length) throw new Error(`Access Receipt inválido: ${errors.join(' · ')}`);
  const path = join(accessReceiptDirectory(root), `${value.receipt_id}.json`);
  writeJsonAtomic(path, value);
  return { value, path, ref: `access-receipt:${value.receipt_id}` };
}

function appendUseReceipt(root, grantPath, grant, receiptRef) {
  const next = {
    ...grant,
    receipts: {
      ...grant.receipts,
      use_refs: [...new Set([...(grant.receipts.use_refs || []), receiptRef])],
    },
  };
  const errors = validateAccessGrant(next);
  if (errors.length) throw new Error(`Access Grant inválido após recibo: ${errors.join(' · ')}`);
  writeJsonAtomic(grantPath, next);
  return next;
}

function requestErrors(request) {
  const errors = [];
  if (!REF_ID_RE.test(request.subject_ref || '')) errors.push('subject_ref inválido');
  if (!ID_RE.test(request.system_ref || '')) errors.push('system_ref inválido');
  if (!REF_ID_RE.test(request.source_ref || '')) errors.push('source_ref inválido');
  if (!ID_RE.test(request.action || '')) errors.push('action inválida');
  if (!MODES.has(request.mode)) errors.push('mode inválido');
  return errors;
}

function runtimeGrantErrors(grant) {
  const errors = validateAccessGrant(grant);
  if (grant?.assurance === 'runtime-enforced' && !CREDENTIAL_REF_RE.test(grant.credential_ref || '')) {
    errors.push('runtime-enforced exige credential_ref namespaced, nunca valor cru');
  }
  return errors;
}

export function registerAccessGrant(root, grant) {
  const errors = runtimeGrantErrors(grant);
  if (errors.length) throw new Error(`Access Grant inválido: ${errors.join(' · ')}`);
  const path = accessGrantPath(root, grant.grant_id);
  if (existsSync(path)) {
    const current = readJson(path, `Access Grant ${grant.grant_id}`);
    if (JSON.stringify(current) === JSON.stringify(grant)) {
      return { status: 'no-change', path, ref: `access-grant:${grant.grant_id}`, grant: current };
    }
    throw new Error('Access Grant existente diverge; substituição silenciosa bloqueada');
  }
  writeJsonAtomic(path, grant);
  return { status: 'created', path, ref: `access-grant:${grant.grant_id}`, grant };
}

export function loadAccessGrant(root, grantId) {
  const path = accessGrantPath(root, grantId);
  if (!existsSync(path)) throw new Error(`Access Grant não encontrado: ${grantId}`);
  const grant = readJson(path, `Access Grant ${grantId}`);
  const errors = runtimeGrantErrors(grant);
  if (errors.length) throw new Error(`Access Grant inválido: ${errors.join(' · ')}`);
  return { grant, path, ref: `access-grant:${grant.grant_id}` };
}

export function evaluateAccess(grant, request, provider, now = new Date()) {
  const invalidRequest = requestErrors(request);
  if (invalidRequest.length) return { decision: 'denied', reason_code: 'request-invalid', credential_status: 'not-checked' };
  if (grant.revoked_at && Date.parse(grant.revoked_at) <= now.getTime()) {
    return { decision: 'denied', reason_code: 'grant-revoked', credential_status: 'not-checked' };
  }
  if (Date.parse(grant.issued_at) > now.getTime()) {
    return { decision: 'denied', reason_code: 'grant-not-active', credential_status: 'not-checked' };
  }
  if (grant.expires_at && Date.parse(grant.expires_at) <= now.getTime()) {
    return { decision: 'denied', reason_code: 'grant-expired', credential_status: 'not-checked' };
  }
  if (grant.subject.ref !== request.subject_ref) {
    return { decision: 'denied', reason_code: 'subject-not-granted', credential_status: 'not-checked' };
  }
  if (!grant.scope.system_refs.includes(request.system_ref)) {
    return { decision: 'denied', reason_code: 'system-not-granted', credential_status: 'not-checked' };
  }
  if (!grant.scope.source_refs.includes(request.source_ref)) {
    return { decision: 'denied', reason_code: 'source-not-granted', credential_status: 'not-checked' };
  }
  if (!grant.scope.actions.includes(request.action)) {
    return { decision: 'denied', reason_code: 'action-not-granted', credential_status: 'not-checked' };
  }
  if (grant.mode !== request.mode) {
    return { decision: 'denied', reason_code: 'mode-not-granted', credential_status: 'not-checked' };
  }
  if (grant.assurance === 'receipt-audited') {
    return { decision: 'file-only', reason_code: 'direct-access-not-runtime-enforced', credential_status: 'not-checked' };
  }
  if (grant.assurance === 'exported') {
    return { decision: 'file-only', reason_code: 'export-not-revocable', credential_status: 'not-checked' };
  }
  if (!provider?.available) {
    return {
      decision: 'denied',
      reason_code: provider?.status?.().reason_code || 'secret-provider-unavailable',
      credential_status: 'not-checked',
    };
  }
  try {
    const present = provider.hasSecret(grant.credential_ref);
    if (!present) return { decision: 'denied', reason_code: 'credential-missing', credential_status: 'missing' };
  } catch {
    return { decision: 'denied', reason_code: 'credential-ref-invalid', credential_status: 'not-checked' };
  }
  return { decision: 'allowed', reason_code: 'grant-valid', credential_status: 'present' };
}

export function checkAccess(root, grantId, request, provider, { now = new Date() } = {}) {
  const invalidRequest = requestErrors(request);
  if (invalidRequest.length) throw new Error(invalidRequest.join(' · '));
  const loaded = loadAccessGrant(root, grantId);
  const evaluation = evaluateAccess(loaded.grant, request, provider, now);
  const recorded = receipt(root, loaded.grant, request, evaluation.decision,
    evaluation.reason_code, { credentialStatus: evaluation.credential_status, now });
  appendUseReceipt(root, loaded.path, loaded.grant, recorded.ref);
  return {
    ...evaluation,
    assurance: loaded.grant.assurance,
    receipt_ref: recorded.ref,
  };
}

function resultContainsSecret(value, secret, seen = new WeakSet()) {
  if (typeof value === 'string') return value.includes(secret);
  if (Buffer.isBuffer(value)) return value.includes(Buffer.from(secret));
  if (value === null || typeof value !== 'object') return false;
  if (seen.has(value)) return false;
  seen.add(value);
  try {
    if (Array.isArray(value)) return value.some((item) => resultContainsSecret(item, secret, seen));
    return Object.values(value).some((item) => resultContainsSecret(item, secret, seen));
  } catch {
    return false;
  }
}

export async function executeWithGrant(root, grantId, request, provider, operation, {
  operationRef,
  now = new Date(),
} = {}) {
  if (typeof operation !== 'function') throw new Error('operation precisa ser função de conector confiável');
  if (!LOCAL_REF_RE.test(operationRef || '')) throw new Error('operationRef opaco é obrigatório');
  const invalidRequest = requestErrors(request);
  if (invalidRequest.length) throw new Error(invalidRequest.join(' · '));
  const loaded = loadAccessGrant(root, grantId);
  const evaluation = evaluateAccess(loaded.grant, request, provider, now);
  if (evaluation.decision !== 'allowed') {
    const denied = receipt(root, loaded.grant, request, evaluation.decision,
      evaluation.reason_code, { credentialStatus: evaluation.credential_status, operationRef, now });
    appendUseReceipt(root, loaded.path, loaded.grant, denied.ref);
    return { executed: false, ...evaluation, assurance: loaded.grant.assurance, receipt_ref: denied.ref };
  }
  let secret = '';
  try {
    secret = provider.getSecret(loaded.grant.credential_ref);
    if (typeof secret !== 'string' || secret.length === 0) throw new Error('credencial vazia');
  } catch {
    const failed = receipt(root, loaded.grant, request, 'failed', 'credential-read-failed', {
      credentialStatus: 'missing', operationRef, now,
    });
    appendUseReceipt(root, loaded.path, loaded.grant, failed.ref);
    return {
      executed: false,
      decision: 'failed',
      reason_code: 'credential-read-failed',
      assurance: loaded.grant.assurance,
      receipt_ref: failed.ref,
    };
  }
  try {
    let result;
    try {
      result = await operation(secret);
    } catch {
      const failed = receipt(root, loaded.grant, request, 'failed', 'connector-failed', {
        credentialStatus: 'present', operationRef, now,
      });
      appendUseReceipt(root, loaded.path, loaded.grant, failed.ref);
      return {
        executed: false,
        decision: 'failed',
        reason_code: 'connector-failed',
        assurance: loaded.grant.assurance,
        receipt_ref: failed.ref,
      };
    }
    if (resultContainsSecret(result, secret)) {
      const blocked = receipt(root, loaded.grant, request, 'failed', 'credential-exfiltration-blocked', {
        credentialStatus: 'present', operationRef, now,
      });
      appendUseReceipt(root, loaded.path, loaded.grant, blocked.ref);
      return {
        executed: false,
        decision: 'failed',
        reason_code: 'credential-exfiltration-blocked',
        assurance: loaded.grant.assurance,
        receipt_ref: blocked.ref,
      };
    }
    const allowed = receipt(root, loaded.grant, request, 'allowed', 'operation-completed', {
      credentialStatus: 'present', operationRef, now,
    });
    appendUseReceipt(root, loaded.path, loaded.grant, allowed.ref);
    return {
      executed: true,
      decision: 'allowed',
      reason_code: 'operation-completed',
      assurance: loaded.grant.assurance,
      receipt_ref: allowed.ref,
      result,
    };
  } finally {
    secret = '';
  }
}

export function revokeAccessGrant(root, grantId, approvedBy, { now = new Date() } = {}) {
  if (!REF_ID_RE.test(approvedBy || '')) throw new Error('approved_by inválido');
  const loaded = loadAccessGrant(root, grantId);
  if (loaded.grant.revoked_at) {
    const prefix = 'access-receipt:';
    const receiptId = loaded.grant.receipts.revocation_ref?.startsWith(prefix)
      ? loaded.grant.receipts.revocation_ref.slice(prefix.length)
      : '';
    if (!REF_ID_RE.test(receiptId)) throw new Error('grant revogado tem revocation_ref inválido');
    const receiptPath = join(accessReceiptDirectory(root), `${receiptId}.json`);
    if (!existsSync(receiptPath)) {
      receipt(root, loaded.grant, {
        subject_ref: loaded.grant.subject.ref,
        system_ref: null,
        source_ref: null,
        action: null,
        mode: loaded.grant.mode,
      }, 'revoked', 'human-revocation', {
        credentialStatus: 'not-checked',
        approvedBy,
        now: new Date(loaded.grant.revoked_at),
        receiptId,
      });
      return {
        status: 'revocation-receipt-recovered',
        grant: loaded.grant,
        receipt_ref: loaded.grant.receipts.revocation_ref,
      };
    }
    return {
      status: 'already-revoked',
      grant: loaded.grant,
      receipt_ref: loaded.grant.receipts.revocation_ref,
    };
  }
  const request = {
    subject_ref: loaded.grant.subject.ref,
    system_ref: null,
    source_ref: null,
    action: null,
    mode: loaded.grant.mode,
  };
  const receiptId = `access-${randomUUID()}`;
  const receiptRef = `access-receipt:${receiptId}`;
  const next = {
    ...loaded.grant,
    revoked_at: now.toISOString(),
    receipts: {
      ...loaded.grant.receipts,
      revocation_ref: receiptRef,
    },
  };
  const errors = validateAccessGrant(next);
  if (errors.length) throw new Error(`Access Grant inválido após revogação: ${errors.join(' · ')}`);
  writeJsonAtomic(loaded.path, next);
  const recorded = receipt(root, next, request, 'revoked', 'human-revocation', {
    credentialStatus: 'not-checked',
    approvedBy,
    now,
    receiptId,
  });
  return { status: 'revoked', grant: next, receipt_ref: recorded.ref };
}

export function readAccessReceipt(root, receiptRef) {
  const prefix = 'access-receipt:';
  const receiptId = receiptRef?.startsWith(prefix) ? receiptRef.slice(prefix.length) : '';
  if (!REF_ID_RE.test(receiptId)) throw new Error('Access Receipt inválido');
  const path = join(accessReceiptDirectory(root), `${receiptId}.json`);
  if (!existsSync(path)) throw new Error('Access Receipt não encontrado');
  const value = JSON.parse(readFileSync(path, 'utf8'));
  const errors = validateAccessReceipt(value);
  if (errors.length) throw new Error(`Access Receipt inválido: ${errors.join(' · ')}`);
  return value;
}
