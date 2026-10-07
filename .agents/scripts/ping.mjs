#!/usr/bin/env node
import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { platform } from 'node:os';
import { flushPendingActivation } from './activate.mjs';
import { readOperatorRuntime } from '../../scripts/lib/runtime-storage.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const EVENTOS = new Set([
  'instalou', 'sessao', 'comecou', 'teste', 'atualizou', 'guardou', 'daily',
  'operou', 'proof_delivered', 'first_value_confirmed', 'contribution_prepared',
  'contribution_approved', 'system_installed', 'system_commissioning', 'system_activated',
  'system_first_run', 'system_needs_attention', 'system_run_started',
  'system_run_completed', 'system_value_confirmed',
  'architect_map_generated',
]);
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RUNTIMES = new Set(['claude-code', 'codex', 'gemini-cli', 'antigravity', 'outro']);
const SYSTEM_ID_RE = /^[a-z0-9][a-z0-9-]{0,63}$/;
const VERSION_RE = /^[0-9A-Za-z][0-9A-Za-z.+-]{0,31}$/;
const REASON_RE = /^[a-z0-9][a-z0-9_-]{0,63}$/;
const HUMAN_DECISIONS = new Set(['approved', 'changes_requested', 'rejected']);

// Quem forka o motor não deve pingar na telemetria da INEVITA. O default é o
// endpoint da casa; CEREBRO_API_URL redireciona para o teu.
const ENDPOINT = (process.env.CEREBRO_API_URL || 'https://inevitasociety.com/supabase/functions/v1').replace(/\/+$/, '');

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

  // O recibo de instalação tem prioridade e usa uma outbox privada. A falha
  // continua silenciosa e nunca interrompe o trabalho atual.
  await flushPendingActivation({ root: ROOT, endpoint: ENDPOINT, timeoutMs: 2000 });

  let event = args[0] || 'sessao';
  if (!EVENTOS.has(event)) {
    if (diagnose) {
      console.error(`ping: evento inválido (${event})`);
      process.exitCode = 1;
    }
    return;
  }
  const systemId = String(args[1] || '').toLowerCase();
  const option = (name) => {
    const prefix = `--${name}=`;
    return args.find((arg) => arg.startsWith(prefix))?.slice(prefix.length) ?? '';
  };
  const runId = option('run-id').toLowerCase();
  const releaseVersion = option('release-version');
  const evalVersion = option('eval-version');
  const evalPassedRaw = option('eval-passed');
  const humanDecision = option('human-decision');
  const reasonCode = option('reason-code').toLowerCase();
  const durationRaw = Number(option('duration-ms'));

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
  const installCredential = read('.cerebro/install-credential');
  const runtime = readOperatorRuntime(ROOT).toLowerCase();
  const hasCredential = /^[A-Za-z0-9_-]{43}$/.test(installCredential);
  const payload = {
    install_id: installId,
    event,
    version: read('VERSION').slice(0, 20) || null,
    os: platform().slice(0, 20),
    ...(hasCredential ? { install_credential: installCredential } : {}),
    ...(!hasCredential && EMAIL_RE.test(email) ? { email } : {}),
    ...(!hasCredential && UUID_RE.test(memberId) ? { member_id: memberId } : {}),
    ...(RUNTIMES.has(runtime) ? { runtime } : {}),
    ...(SYSTEM_ID_RE.test(systemId) ? { system_id: systemId } : {}),
    ...(UUID_RE.test(runId) ? { run_id: runId } : {}),
    ...(VERSION_RE.test(releaseVersion) ? { release_version: releaseVersion } : {}),
    ...(VERSION_RE.test(evalVersion) ? { eval_version: evalVersion } : {}),
    ...(evalPassedRaw === 'true' || evalPassedRaw === 'false'
      ? { eval_passed: evalPassedRaw === 'true' }
      : {}),
    ...(HUMAN_DECISIONS.has(humanDecision) ? { human_decision: humanDecision } : {}),
    ...(REASON_RE.test(reasonCode) ? { reason_code: reasonCode } : {}),
    ...(Number.isInteger(durationRaw) && durationRaw >= 0 && durationRaw <= 86_400_000
      ? { duration_ms: durationRaw }
      : {}),
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2000);
  try {
    const response = await fetch(`${ENDPOINT}/cerebro-ping`, {
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
