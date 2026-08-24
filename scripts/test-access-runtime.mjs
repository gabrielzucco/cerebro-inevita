#!/usr/bin/env node

import assert from 'node:assert/strict';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import {
  checkAccess,
  executeWithGrant,
  readAccessReceipt,
  registerAccessGrant,
  revokeAccessGrant,
  validateAccessReceipt,
} from './lib/access-runtime.mjs';
import { createSecretProvider, SecretProviderError } from './lib/secret-provider.mjs';

const ROOT = resolve(process.cwd());
const sandbox = mkdtempSync(join(tmpdir(), 'company-brain-runtime-'));
const fakeBin = mkdtempSync(join(tmpdir(), 'company-brain-provider-bin-'));
const secretValue = 'runtime-test-secret-should-never-persist';
const fixedNow = new Date('2026-08-23T18:00:00.000Z');

function json(path) {
  return JSON.parse(readFileSync(join(ROOT, path), 'utf8'));
}

function clone(value) {
  return structuredClone(value);
}

function allFiles(root) {
  if (!existsSync(root)) return [];
  return readdirSync(root).flatMap((name) => {
    const path = join(root, name);
    return statSync(path).isDirectory() ? allFiles(path) : [path];
  });
}

function grantFrom(base, id, overrides = {}) {
  return {
    ...clone(base),
    grant_id: id,
    issued_at: '2026-08-23T17:00:00.000Z',
    expires_at: '2026-08-23T19:00:00.000Z',
    revoked_at: null,
    receipts: { use_refs: [], revocation_ref: null },
    ...overrides,
  };
}

try {
  mkdirSync(join(sandbox, '.cerebro'), { recursive: true });
  writeFileSync(join(sandbox, 'COMECE-AQUI.md'), '# runtime sandbox\n');
  writeFileSync(join(sandbox, 'VERSION'), '9.9.9\n');
  writeFileSync(join(sandbox, '.cerebro', 'layout.json'), `${JSON.stringify({
    version: 3,
    accessGrants: '.cerebro/contracts/access-grants',
    runLedger: '.cerebro/ledger/runs.jsonl',
  }, null, 2)}\n`);

  const receiptExample = json('protocol/examples/access-receipt.v1.json');
  assert.deepEqual(validateAccessReceipt(receiptExample), []);

  assert.throws(() => createSecretProvider({ provider: 'memory' }), (error) => (
    error instanceof SecretProviderError && error.reasonCode === 'memory-provider-forbidden'
  ));
  const provider = createSecretProvider({
    root: sandbox,
    provider: 'memory',
    testOnly: true,
  });
  provider.setSecret('os-keychain:funnel-read-session', secretValue);
  assert.equal(provider.hasSecret('os-keychain:funnel-read-session'), true);

  const baseGrant = json('protocol/examples/access-grant.v1.json');
  const rawCredentialGrant = grantFrom(baseGrant, 'grant-runtime-raw-credential', {
    credential_ref: 'not-namespaced',
  });
  assert.throws(
    () => registerAccessGrant(sandbox, rawCredentialGrant),
    /credential_ref namespaced, nunca valor cru/,
  );
  const grant = grantFrom(baseGrant, 'grant-runtime-001');
  assert.equal(registerAccessGrant(sandbox, grant).status, 'created');
  assert.equal(registerAccessGrant(sandbox, grant).status, 'no-change');

  const request = {
    subject_ref: 'analisar-funil',
    system_ref: 'analisar-funil',
    source_ref: 'paid-media',
    action: 'read-metrics',
    mode: 'read',
  };
  let connectorCalls = 0;
  const allowed = await executeWithGrant(
    sandbox,
    grant.grant_id,
    request,
    provider,
    async (secret) => {
      connectorCalls += 1;
      assert.equal(secret, secretValue);
      return { provider_status: 204, private_payload: 'não pode entrar no recibo' };
    },
    { operationRef: 'connector:paid-media/read-001', now: fixedNow },
  );
  assert.equal(allowed.executed, true);
  assert.equal(allowed.decision, 'allowed');
  assert.equal(connectorCalls, 1);
  assert.equal(allowed.result.private_payload, 'não pode entrar no recibo');
  const allowedReceipt = readAccessReceipt(sandbox, allowed.receipt_ref);
  assert.equal(allowedReceipt.decision, 'allowed');
  assert.equal(allowedReceipt.credential_status, 'present');
  assert.equal(JSON.stringify(allowedReceipt).includes(secretValue), false);
  assert.equal(JSON.stringify(allowedReceipt).includes('private_payload'), false);

  const denied = await executeWithGrant(
    sandbox,
    grant.grant_id,
    { ...request, source_ref: 'not-granted-source' },
    provider,
    async () => { connectorCalls += 1; },
    { operationRef: 'connector:paid-media/read-denied', now: fixedNow },
  );
  assert.equal(denied.executed, false);
  assert.equal(denied.reason_code, 'source-not-granted');
  assert.equal(connectorCalls, 1, 'conector executou apesar do deny');
  assert.equal(readAccessReceipt(sandbox, denied.receipt_ref).decision, 'denied');

  const failingGrant = grantFrom(baseGrant, 'grant-runtime-failure');
  registerAccessGrant(sandbox, failingGrant);
  const failed = await executeWithGrant(
    sandbox,
    failingGrant.grant_id,
    request,
    provider,
    async () => { throw new Error(`erro cru com ${secretValue}`); },
    { operationRef: 'connector:paid-media/read-failed', now: fixedNow },
  );
  assert.equal(failed.decision, 'failed');
  const failedReceipt = readAccessReceipt(sandbox, failed.receipt_ref);
  assert.equal(failedReceipt.reason_code, 'connector-failed');
  assert.equal(JSON.stringify(failedReceipt).includes(secretValue), false);
  assert.equal(JSON.stringify(failedReceipt).includes('erro cru'), false);

  const exfiltrationGrant = grantFrom(baseGrant, 'grant-runtime-exfiltration');
  registerAccessGrant(sandbox, exfiltrationGrant);
  const exfiltration = await executeWithGrant(
    sandbox,
    exfiltrationGrant.grant_id,
    request,
    provider,
    async (secret) => ({ nested: { leaked: `prefix:${secret}:suffix` } }),
    { operationRef: 'connector:paid-media/read-exfiltration', now: fixedNow },
  );
  assert.equal(exfiltration.executed, false);
  assert.equal(exfiltration.decision, 'failed');
  assert.equal(exfiltration.reason_code, 'credential-exfiltration-blocked');
  assert.equal('result' in exfiltration, false);
  const exfiltrationReceipt = readAccessReceipt(sandbox, exfiltration.receipt_ref);
  assert.equal(exfiltrationReceipt.reason_code, 'credential-exfiltration-blocked');
  assert.equal(JSON.stringify(exfiltrationReceipt).includes(secretValue), false);

  const receiptCountBeforeRevoke = allFiles(join(sandbox, '.cerebro', 'runtime', 'receipts')).length;
  const revoked = revokeAccessGrant(sandbox, grant.grant_id, 'role-marketing-owner', {
    now: new Date('2026-08-23T18:05:00.000Z'),
  });
  assert.equal(revoked.status, 'revoked');
  const revocationReceipt = readAccessReceipt(sandbox, revoked.receipt_ref);
  assert.equal(revocationReceipt.decision, 'revoked');
  assert.equal(revocationReceipt.system_ref, null);
  assert.equal(revocationReceipt.source_ref, null);
  assert.equal(revocationReceipt.action, null);
  assert.equal(revocationReceipt.credential_status, 'not-checked');
  assert.equal(provider.hasSecret('os-keychain:funnel-read-session'), true, 'revogação apagou credencial possivelmente compartilhada');
  const revocationReceiptId = revoked.receipt_ref.slice('access-receipt:'.length);
  unlinkSync(join(sandbox, '.cerebro', 'runtime', 'receipts', 'access', `${revocationReceiptId}.json`));
  const recoveredRevoke = revokeAccessGrant(sandbox, grant.grant_id, 'role-marketing-owner', {
    now: new Date('2026-08-23T18:06:00.000Z'),
  });
  assert.equal(recoveredRevoke.status, 'revocation-receipt-recovered');
  const repeatedRevoke = revokeAccessGrant(sandbox, grant.grant_id, 'role-marketing-owner', {
    now: new Date('2026-08-23T18:07:00.000Z'),
  });
  assert.equal(repeatedRevoke.status, 'already-revoked');
  assert.equal(allFiles(join(sandbox, '.cerebro', 'runtime', 'receipts')).length, receiptCountBeforeRevoke + 1);

  const afterRevoke = await executeWithGrant(
    sandbox,
    grant.grant_id,
    request,
    provider,
    async () => { connectorCalls += 1; },
    { operationRef: 'connector:paid-media/read-after-revoke', now: new Date('2026-08-23T18:06:00.000Z') },
  );
  assert.equal(afterRevoke.reason_code, 'grant-revoked');
  assert.equal(connectorCalls, 1, 'conector executou depois da revogação');

  const unavailable = createSecretProvider({
    root: sandbox,
    provider: 'auto',
    platform: 'freebsd',
    env: { PATH: '' },
  });
  assert.equal(unavailable.status().mode, 'file-only');

  const managedWithoutProvider = grantFrom(baseGrant, 'grant-runtime-no-provider');
  registerAccessGrant(sandbox, managedWithoutProvider);
  const providerDenied = checkAccess(sandbox, managedWithoutProvider.grant_id, request, unavailable, { now: fixedNow });
  assert.equal(providerDenied.decision, 'denied');
  assert.equal(providerDenied.reason_code, 'secret-provider-unsupported');

  const auditedGrant = grantFrom(baseGrant, 'grant-file-only', {
    assurance: 'receipt-audited',
    custody: 'agent-direct',
    credential_ref: null,
  });
  registerAccessGrant(sandbox, auditedGrant);
  const degraded = checkAccess(sandbox, auditedGrant.grant_id, request, unavailable, { now: fixedNow });
  assert.equal(degraded.decision, 'file-only');
  assert.equal(degraded.reason_code, 'direct-access-not-runtime-enforced');
  assert.equal(readAccessReceipt(sandbox, degraded.receipt_ref).assurance, 'receipt-audited');

  const missingCredentialGrant = grantFrom(baseGrant, 'grant-runtime-missing-credential', {
    credential_ref: 'os-keychain:missing-credential',
  });
  registerAccessGrant(sandbox, missingCredentialGrant);
  const missing = checkAccess(sandbox, missingCredentialGrant.grant_id, request, provider, { now: fixedNow });
  assert.equal(missing.reason_code, 'credential-missing');
  assert.equal(readAccessReceipt(sandbox, missing.receipt_ref).credential_status, 'missing');

  const fakeSecretTool = join(fakeBin, 'secret-tool');
  writeFileSync(fakeSecretTool, '# fake\n');
  const linuxCalls = [];
  const linuxProvider = createSecretProvider({
    root: sandbox,
    provider: 'linux-secret-service',
    platform: 'linux',
    env: { PATH: fakeBin },
    spawn(command, args, options) {
      linuxCalls.push({ command, args, input: options.input });
      return { status: 0, stdout: args[0] === 'lookup' ? secretValue : '' };
    },
  });
  linuxProvider.setSecret('secret-service:test-ref', secretValue);
  assert.equal(linuxCalls[0].input, secretValue);
  assert.equal(JSON.stringify(linuxCalls[0].args).includes(secretValue), false, 'segredo entrou em argv do Secret Service');

  const fakePowerShell = join(fakeBin, 'pwsh.EXE');
  writeFileSync(fakePowerShell, '# fake\n');
  const windowsCalls = [];
  const windowsProvider = createSecretProvider({
    root: sandbox,
    provider: 'windows-dpapi',
    platform: 'win32',
    env: { PATH: fakeBin, PATHEXT: '.EXE' },
    spawn(command, args, options) {
      windowsCalls.push({ command, args, input: options.input });
      return { status: 0, stdout: '' };
    },
  });
  windowsProvider.setSecret('windows-dpapi:test-ref', secretValue);
  assert.equal(windowsCalls[0].input, secretValue);
  assert.equal(JSON.stringify(windowsCalls[0].args).includes(secretValue), false, 'segredo entrou em argv do DPAPI');

  if (existsSync('/usr/bin/security')) {
    const macCalls = [];
    const macProvider = createSecretProvider({
      root: sandbox,
      provider: 'macos-keychain',
      platform: 'darwin',
      spawn(command, args, options) {
        macCalls.push({ command, args, options });
        return { status: 0, stdout: '' };
      },
    });
    assert.throws(
      () => macProvider.setSecret('os-keychain:test-ref', secretValue),
      (error) => error instanceof SecretProviderError && error.reasonCode === 'interactive-set-required',
    );
    macProvider.setSecretInteractive('os-keychain:test-ref');
    assert.equal(macCalls[0].args.at(-1), '-w');
    assert.equal(JSON.stringify(macCalls[0].args).includes(secretValue), false, 'segredo entrou em argv do Keychain');
  }

  writeFileSync(join(sandbox, '.cerebro', 'layout.json'), `${JSON.stringify({
    version: 3,
    accessGrants: '../../runtime-escape-attempt',
    accessReceipts: '.cerebro/runtime/receipts/access',
  }, null, 2)}\n`);
  assert.throws(
    () => registerAccessGrant(sandbox, grantFrom(baseGrant, 'grant-runtime-path-escape')),
    /layout do runtime aponta para fora do cérebro/,
  );

  for (const path of allFiles(sandbox)) {
    const content = readFileSync(path);
    assert.equal(content.includes(Buffer.from(secretValue)), false, `plaintext persistido em ${path}`);
  }

  console.log('✓ runtime de acesso: provider seguro, allow/deny, falha sanitizada, revoke e file-only');
} finally {
  rmSync(sandbox, { recursive: true, force: true });
  rmSync(fakeBin, { recursive: true, force: true });
}
