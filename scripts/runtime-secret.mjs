#!/usr/bin/env node

import { resolve } from 'node:path';
import { createSecretProvider, SecretProviderError } from './lib/secret-provider.mjs';
import { ensureBrain } from './lib/system-protocol.mjs';

function fail(message) {
  console.error(`✗ ${message}`);
  process.exit(1);
}

function option(name) {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length) || '';
}

async function readSecretHidden() {
  if (!process.stdin.isTTY || typeof process.stdin.setRawMode !== 'function') {
    throw new SecretProviderError('interactive-terminal-required', 'set exige terminal interativo; segredo nunca entra por argumento');
  }
  process.stdout.write('Segredo (não será exibido): ');
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.setEncoding('utf8');
  let value = '';
  try {
    for await (const chunk of process.stdin) {
      for (const char of chunk) {
        if (char === '\u0003') throw new SecretProviderError('cancelled', 'operação cancelada');
        if (char === '\r' || char === '\n') {
          process.stdout.write('\n');
          return value;
        }
        if (char === '\u007f') value = value.slice(0, -1);
        else value += char;
      }
    }
  } finally {
    process.stdin.setRawMode(false);
    process.stdin.pause();
  }
  return value;
}

const root = resolve(process.env.CEREBRO_INSTALL_ROOT || process.cwd());
const [action = 'status', ref = ''] = process.argv.slice(2).filter((arg) => !arg.startsWith('--'));

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
  if (!ref) fail('informe credential_ref');
  if (action === 'has') {
    console.log(JSON.stringify({ credential_ref: ref, present: provider.hasSecret(ref) }, null, 2));
    process.exit(0);
  }
  if (action === 'set') {
    if (!provider.available) fail(provider.status().reason_code);
    if (provider.interactiveSet) provider.setSecretInteractive(ref);
    else {
      let secret = await readSecretHidden();
      provider.setSecret(ref, secret);
      secret = '';
    }
    console.log(`✓ credencial armazenada em ${provider.name}: ${ref}`);
    process.exit(0);
  }
  if (action === 'delete') {
    if (!process.argv.includes('--confirm')) fail('remoção exige --confirm');
    const removed = provider.deleteSecret(ref);
    console.log(JSON.stringify({ credential_ref: ref, removed, provider: provider.name }, null, 2));
    process.exit(0);
  }
  fail('ação válida: status, has, set ou delete');
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
}
