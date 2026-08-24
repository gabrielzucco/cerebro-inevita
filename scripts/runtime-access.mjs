#!/usr/bin/env node

import { resolve } from 'node:path';
import {
  checkAccess,
  loadAccessGrant,
  registerAccessGrant,
  revokeAccessGrant,
} from './lib/access-runtime.mjs';
import { createSecretProvider } from './lib/secret-provider.mjs';
import { ensureBrain, readJson } from './lib/system-protocol.mjs';

function fail(message, code = 1) {
  console.error(`✗ ${message}`);
  process.exit(code);
}

function option(name) {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length) || '';
}

const root = resolve(process.env.CEREBRO_INSTALL_ROOT || process.cwd());
const [action = 'status', target = ''] = process.argv.slice(2).filter((arg) => !arg.startsWith('--'));

try {
  ensureBrain(root);
  const provider = createSecretProvider({
    root,
    provider: option('provider') || process.env.CEREBRO_SECRET_PROVIDER || 'auto',
  });
  if (action === 'status') {
    console.log(JSON.stringify(provider.status(), null, 2));
    process.exit(0);
  }
  if (action === 'install') {
    if (!process.argv.includes('--confirm')) fail('instalação exige --confirm');
    if (!target) fail('informe o caminho do Access Grant');
    const result = registerAccessGrant(root, readJson(resolve(root, target), target));
    console.log(JSON.stringify({ status: result.status, grant_ref: result.ref }, null, 2));
    process.exit(0);
  }
  if (action === 'show') {
    if (!target) fail('informe grant_id');
    console.log(JSON.stringify(loadAccessGrant(root, target).grant, null, 2));
    process.exit(0);
  }
  if (action === 'check') {
    if (!target) fail('informe grant_id');
    const result = checkAccess(root, target, {
      subject_ref: option('subject'),
      system_ref: option('system'),
      source_ref: option('source'),
      action: option('action'),
      mode: option('mode'),
    }, provider);
    console.log(JSON.stringify(result, null, 2));
    if (result.decision === 'denied' || result.decision === 'failed') process.exitCode = 2;
    process.exit();
  }
  if (action === 'revoke') {
    if (!process.argv.includes('--confirm')) fail('revogação exige --confirm');
    if (!target) fail('informe grant_id');
    const result = revokeAccessGrant(root, target, option('approved-by'));
    console.log(JSON.stringify({ status: result.status, receipt_ref: result.receipt_ref }, null, 2));
    process.exit(0);
  }
  fail('ação válida: status, install, show, check ou revoke');
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
}
