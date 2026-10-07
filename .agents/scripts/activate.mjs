#!/usr/bin/env node
import { randomUUID } from 'node:crypto';
import {
  chmodSync,
  existsSync,
  mkdirSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { platform } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const DEFAULT_ENDPOINT = 'https://inevitasociety.com/supabase/functions/v1';
const SECRET_RE = /^[A-Za-z0-9_-]{43}$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const RUNTIMES = new Set(['claude-code', 'codex', 'gemini-cli', 'antigravity', 'outro']);
const REQUIRED_FILES = [
  'COMECE-AQUI.md',
  'VERSION',
  'conhecimento/_INDICE.md',
  '.agents/skills/comecar/SKILL.md',
  '.agents/scripts/ping.mjs',
];

export class ActivationRequestError extends Error {
  constructor(message, { status = 0, reason = 'temporarily_unavailable' } = {}) {
    super(message);
    this.name = 'ActivationRequestError';
    this.status = status;
    this.reason = reason;
    this.retryable = status === 0 || status === 429 || status >= 500;
  }
}

function read(root, relative) {
  try {
    return readFileSync(join(root, relative), 'utf8').trim();
  } catch {
    return '';
  }
}

function writePrivate(root, relative, value) {
  const path = join(root, relative);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, value, { mode: 0o600 });
  chmodSync(path, 0o600);
}

function removeIfPresent(root, relative) {
  try {
    unlinkSync(join(root, relative));
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }
}

function endpointBase(value) {
  return String(value || DEFAULT_ENDPOINT).replace(/\/+$/, '');
}

function technicalLabel(value, maxLength = 20) {
  const label = String(value ?? '').trim().slice(0, maxLength);
  return label && /^[0-9A-Za-z._+-]+$/.test(label) ? label : null;
}

function getOrCreateInstallId(root) {
  const current = read(root, '.cerebro/id').toLowerCase();
  if (UUID_RE.test(current)) return current;
  const installId = randomUUID();
  writePrivate(root, '.cerebro/id', `${installId}\n`);
  return installId;
}

function packageFailure(root) {
  return REQUIRED_FILES.find((relative) => !existsSync(join(root, relative)))
    ? 'package_incomplete'
    : null;
}

async function postActivation(fetchImpl, endpoint, payload, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(`${endpointBase(endpoint)}/cerebro-install-activation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    let body = null;
    try {
      body = await response.json();
    } catch {
      body = null;
    }
    if (!response.ok || !body?.ok) {
      throw new ActivationRequestError('activation request rejected', {
        status: response.status,
        reason: String(body?.reason || 'activation_rejected'),
      });
    }
    return body;
  } catch (error) {
    if (error instanceof ActivationRequestError) throw error;
    throw new ActivationRequestError('activation service unavailable');
  } finally {
    clearTimeout(timeout);
  }
}

function readOutbox(root) {
  try {
    const value = JSON.parse(readFileSync(join(root, '.cerebro', 'install-activation-outbox.json'), 'utf8'));
    if (
      value?.version === 1
      && UUID_RE.test(String(value.install_id ?? ''))
      && SECRET_RE.test(String(value.claim ?? ''))
      && RUNTIMES.has(String(value.runtime ?? ''))
      && (!value.credential || SECRET_RE.test(String(value.credential)))
    ) return value;
  } catch {
    // Outbox inválida não é executada nem enviada.
  }
  return null;
}

function saveOutbox(root, state) {
  writePrivate(
    root,
    '.cerebro/install-activation-outbox.json',
    `${JSON.stringify(state, null, 2)}\n`,
  );
}

async function advanceActivation(state, options) {
  const { root, fetchImpl, endpoint, timeoutMs } = options;

  if (!state.credential) {
    const started = await postActivation(fetchImpl, endpoint, {
      action: 'start',
      claim: state.claim,
      install_id: state.install_id,
      runtime: state.runtime,
      version: state.version_label,
      os: state.os,
    }, timeoutMs);
    if (!SECRET_RE.test(String(started.credential ?? ''))
        || !['started', 'reconnected'].includes(String(started.status ?? ''))) {
      throw new ActivationRequestError('invalid activation response');
    }
    state.credential = started.credential;
    state.redemption_status = started.status;
    writePrivate(root, '.cerebro/install-credential', `${state.credential}\n`);
    saveOutbox(root, state);
  }

  if (!state.package_checked) {
    state.failure_reason = packageFailure(root);
    state.package_checked = true;
    saveOutbox(root, state);
  }

  const event = state.failure_reason
    ? 'install_failed'
    : state.redemption_status === 'reconnected'
      ? 'install_reconnected'
      : 'install_completed';

  await postActivation(fetchImpl, endpoint, {
    action: 'finish',
    install_id: state.install_id,
    credential: state.credential,
    event,
    runtime: state.runtime,
    version: state.version_label,
    os: state.os,
    ...(state.failure_reason ? { reason_code: state.failure_reason } : {}),
  }, timeoutMs);

  removeIfPresent(root, '.cerebro/install-activation-outbox.json');
  return {
    ok: !state.failure_reason,
    pending: false,
    event,
    reason: state.failure_reason,
  };
}

function telemetryDisabled(root) {
  return process.env.CEREBRO_TELEMETRY === 'off'
    || existsSync(join(root, '.cerebro', 'sem-telemetria'));
}

export function parseActivationArgs(args) {
  const option = (name) => {
    const prefix = `--${name}=`;
    return args.find((arg) => arg.startsWith(prefix))?.slice(prefix.length) ?? '';
  };
  const claim = option('claim');
  const runtime = option('runtime').toLowerCase();
  if (!SECRET_RE.test(claim)) throw new Error('claim_invalid');
  if (!RUNTIMES.has(runtime)) throw new Error('runtime_invalid');
  return { claim, runtime };
}

export async function activate({
  root = DEFAULT_ROOT,
  claim,
  runtime,
  fetchImpl = fetch,
  endpoint = process.env.CEREBRO_API_URL || DEFAULT_ENDPOINT,
  timeoutMs = 5000,
} = {}) {
  const safeRoot = resolve(root);
  if (!SECRET_RE.test(String(claim ?? ''))) throw new Error('claim_invalid');
  if (!RUNTIMES.has(String(runtime ?? ''))) throw new Error('runtime_invalid');

  const installId = getOrCreateInstallId(safeRoot);
  writePrivate(safeRoot, '.cerebro/operator-runtime', `${runtime}\n`);
  if (telemetryDisabled(safeRoot)) {
    return { ok: true, pending: false, event: 'activation_local_only', reason: null };
  }

  const state = {
    version: 1,
    install_id: installId,
    claim,
    runtime,
    version_label: technicalLabel(read(safeRoot, 'VERSION')),
    os: technicalLabel(platform()),
    credential: null,
    redemption_status: null,
    package_checked: false,
    failure_reason: null,
  };
  saveOutbox(safeRoot, state);

  try {
    return await advanceActivation(state, { root: safeRoot, fetchImpl, endpoint, timeoutMs });
  } catch (error) {
    if (error instanceof ActivationRequestError && !error.retryable) {
      removeIfPresent(safeRoot, '.cerebro/install-activation-outbox.json');
      return { ok: false, pending: false, event: null, reason: error.reason };
    }
    saveOutbox(safeRoot, state);
    return { ok: false, pending: true, event: null, reason: 'temporarily_unavailable' };
  }
}

export async function flushPendingActivation({
  root = DEFAULT_ROOT,
  fetchImpl = fetch,
  endpoint = process.env.CEREBRO_API_URL || DEFAULT_ENDPOINT,
  timeoutMs = 2000,
} = {}) {
  const safeRoot = resolve(root);
  if (telemetryDisabled(safeRoot)) return { ok: true, pending: false, skipped: true };
  const state = readOutbox(safeRoot);
  if (!state) return { ok: true, pending: false, skipped: true };

  try {
    return await advanceActivation(state, { root: safeRoot, fetchImpl, endpoint, timeoutMs });
  } catch (error) {
    if (error instanceof ActivationRequestError && !error.retryable) {
      removeIfPresent(safeRoot, '.cerebro/install-activation-outbox.json');
      return { ok: false, pending: false, reason: error.reason };
    }
    saveOutbox(safeRoot, state);
    return { ok: false, pending: true, reason: 'temporarily_unavailable' };
  }
}

async function main() {
  try {
    const input = parseActivationArgs(process.argv.slice(2));
    const result = await activate(input);
    if (result.pending) {
      console.log('Cérebro preparado. O recibo de ativação será reenviado automaticamente quando a conexão voltar.');
      return;
    }
    if (!result.ok) {
      console.error(`Não foi possível ativar este acesso (${result.reason || 'activation_failed'}). Gere uma nova instrução na plataforma.`);
      process.exitCode = 1;
      return;
    }
    if (result.event === 'activation_local_only') {
      console.log('Cérebro preparado localmente; telemetria desativada nesta instalação.');
      return;
    }
    console.log(result.event === 'install_reconnected'
      ? 'Cérebro reconectado com segurança.'
      : 'Cérebro instalado e conectado com segurança.');
  } catch (error) {
    console.error(`Ativação inválida (${error instanceof Error ? error.message : 'invalid_request'}).`);
    process.exitCode = 1;
  }
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) await main();
