#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = process.env.CEREBRO_INSTALL_ROOT
  ? resolve(process.env.CEREBRO_INSTALL_ROOT)
  : resolve(dirname(fileURLToPath(import.meta.url)), '..');
const slug = String(process.argv[2] || '').trim().toLowerCase();
const next = String(process.argv[3] || 'show').toLowerCase();
const states = ['package_added', 'configuring', 'first_run', 'active', 'needs_attention'];
const transitions = {
  package_added: ['configuring'],
  configuring: ['first_run', 'needs_attention'],
  first_run: ['active', 'needs_attention'],
  active: ['needs_attention', 'configuring'],
  needs_attention: ['configuring', 'first_run'],
};
if (!/^[a-z0-9][a-z0-9-]{0,63}$/.test(slug)) throw new Error('system_id inválido');
const path = join(ROOT, '.cerebro', 'sistemas', `${slug}.json`);
if (!existsSync(path)) throw new Error('adicione o pacote antes de mudar o estado');
const state = JSON.parse(readFileSync(path, 'utf8'));
if (next === 'show') {
  console.log(JSON.stringify(state, null, 2));
  process.exit(0);
}
if (!states.includes(next) || !transitions[state.status]?.includes(next)) {
  throw new Error(`transição inválida: ${state.status} → ${next}`);
}
if (next === 'first_run') {
  throw new Error(`use: node scripts/system-run.mjs ${slug} start`);
}
if (next === 'active' && !state.first_value_confirmed) {
  throw new Error('active exige run com eval aprovado e confirmação humana');
}
mkdirSync(dirname(path), { recursive: true });
writeFileSync(path, `${JSON.stringify({ ...state, status: next, updated_at: new Date().toISOString() }, null, 2)}\n`, { mode: 0o600 });
const event = next === 'active'
  ? 'system_activated'
  : next === 'first_run'
    ? 'system_first_run'
    : next === 'needs_attention'
      ? 'system_needs_attention'
      : 'system_commissioning';
spawnSync(process.execPath, [join(ROOT, '.agents', 'scripts', 'ping.mjs'), event, slug], {
  cwd: ROOT,
  env: process.env,
  stdio: 'ignore',
  timeout: 2500,
});
console.log(`✓ ${slug}: ${state.status} → ${next}`);
