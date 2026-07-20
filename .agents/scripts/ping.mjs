#!/usr/bin/env node
import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { platform } from 'node:os';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const EVENTOS = new Set([
  'instalou', 'sessao', 'comecou', 'teste', 'atualizou', 'guardou', 'daily',
  'operou', 'proof_delivered', 'first_value_confirmed', 'contribution_prepared',
  'contribution_approved',
]);
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RUNTIMES = new Set(['claude-code', 'codex', 'gemini-cli', 'antigravity', 'outro']);
const SYSTEM_ID_RE = /^[a-z0-9][a-z0-9-]{0,63}$/;

function read(relative) {
  try {
    return readFileSync(join(ROOT, relative), 'utf8').trim();
  } catch {
    return '';
  }
}

async function main() {
  const diagnose = process.argv.includes('--diagnose');
  const args = process.argv.slice(2).filter((arg) => arg !== '--diagnose');
  if (process.env.CEREBRO_TELEMETRY === 'off') {
    if (diagnose) console.log('ping: desativado por CEREBRO_TELEMETRY=off');
    return;
  }
  if (existsSync(join(ROOT, '.cerebro', 'sem-telemetria'))) {
    if (diagnose) console.log('ping: desativado por .cerebro/sem-telemetria');
    return;
  }

  let event = args[0] || 'sessao';
  if (!EVENTOS.has(event)) {
    if (diagnose) {
      console.error(`ping: evento inválido (${event})`);
      process.exitCode = 1;
    }
    return;
  }
  const systemId = String(args[1] || '').toLowerCase();

  const idFile = join(ROOT, '.cerebro', 'id');
  let installId = read('.cerebro/id').toLowerCase();
  if (!UUID_RE.test(installId)) {
    installId = randomUUID();
    mkdirSync(dirname(idFile), { recursive: true });
    writeFileSync(idFile, `${installId}\n`, { mode: 0o600 });
    if (event === 'sessao') event = 'instalou';
  }

  const email = read('.cerebro/acesso-email').toLowerCase();
  const memberId = read('.cerebro/member-id').toLowerCase();
  const runtime = read('.cerebro/runtime').toLowerCase();
  const payload = {
    install_id: installId,
    event,
    version: read('VERSION').slice(0, 20) || null,
    os: platform().slice(0, 20),
    ...(EMAIL_RE.test(email) ? { email } : {}),
    ...(UUID_RE.test(memberId) ? { member_id: memberId } : {}),
    ...(RUNTIMES.has(runtime) ? { runtime } : {}),
    ...(SYSTEM_ID_RE.test(systemId) ? { system_id: systemId } : {}),
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2000);
  try {
    const response = await fetch('https://peegicizxybjgvuutegc.supabase.co/functions/v1/cerebro-ping', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    if (diagnose) console.log(`ping: ok (${event}, HTTP ${response.status})`);
  } catch (error) {
    // Telemetria nunca pode interromper o trabalho.
    if (diagnose) {
      console.error(`ping: indisponível (${error instanceof Error ? error.message : 'erro desconhecido'})`);
      process.exitCode = 1;
    }
  } finally {
    clearTimeout(timeout);
  }
}

await main();
