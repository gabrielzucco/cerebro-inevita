import { createHash, randomBytes } from 'node:crypto';
import { spawn } from 'node:child_process';
import { chmodSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { delimiter, join, resolve } from 'node:path';
import {
  bindHermesProject,
  configureHermesCodex,
  configureHermesTelegram,
  controlHermesGateway,
  createHermesConfigSnapshot,
  discardHermesConfigSnapshot,
  hermesRuntimeInternals,
  readHermesStatus,
  restoreHermesConfigSnapshot,
  runHermesDoctor,
} from './hermes-runtime.mjs';

export const HERMES_PIN = Object.freeze({
  commit: '4281151ae859241351ba14d8c7682dc67ff4c126',
  minimumVersion: '0.18.2',
  posix: Object.freeze({
    url: 'https://raw.githubusercontent.com/NousResearch/hermes-agent/4281151ae859241351ba14d8c7682dc67ff4c126/scripts/install.sh',
    sha256: 'c2e4326c1660bd45f64321996eb15bda35e7a4649e32a310495a61972a2804c8',
  }),
  win32: Object.freeze({
    url: 'https://raw.githubusercontent.com/NousResearch/hermes-agent/4281151ae859241351ba14d8c7682dc67ff4c126/scripts/install.ps1',
    sha256: 'bc90b0c20e92439dbeb432b12b836587d14b1cc49a1a1d9e1949b8b8b94a8256',
  }),
});

const INSTALLER_HOSTS = new Set(['raw.githubusercontent.com']);
const INSTALLER_LIMIT = 2 * 1024 * 1024;
const TELEGRAM_LIMIT = 256 * 1024;
const DOWNLOAD_TIMEOUT_MS = 60 * 1000;
const TELEGRAM_REQUEST_TIMEOUT_MS = 30 * 1000;
const OWNER_TIMEOUT_MS = 10 * 60 * 1000;
const OAUTH_TIMEOUT_MS = 15 * 60 * 1000;
const ACTION_STATUSES = new Set(['running', 'awaiting-confirmation']);

function safeError(error, fallback = 'activation-failed') {
  const message = error instanceof Error ? error.message : String(error || '');
  return /^[a-z0-9-]+$/.test(message) ? message : fallback;
}

function stripAnsi(value) {
  return String(value || '').replace(/\u001b\[[0-9;]*m/g, '').replace(/\r/g, '');
}

function safeDisplay(user) {
  const username = String(user?.username || '').replace(/[^A-Za-z0-9_]/g, '').slice(0, 32);
  if (username) return `@${username}`;
  const name = [user?.first_name, user?.last_name]
    .map((part) => String(part || '').replace(/[\r\n\0<>]/g, '').trim())
    .filter(Boolean)
    .join(' ')
    .slice(0, 80);
  return name || 'Conta privada do Telegram';
}

function versionTuple(value) {
  const match = String(value || '').match(/\bv?(\d+)\.(\d+)\.(\d+)\b/);
  return match ? match.slice(1).map(Number) : null;
}

function versionAtLeast(value, minimum) {
  const current = versionTuple(value);
  const required = versionTuple(minimum);
  if (!current || !required) return false;
  for (let index = 0; index < 3; index += 1) {
    if (current[index] !== required[index]) return current[index] > required[index];
  }
  return true;
}

function isReady(status) {
  return Boolean(status?.installed
    && status?.codex_authenticated
    && status?.project_bound
    && status?.skills_trusted
    && status?.telegram?.token_configured
    && status?.telegram?.allowlist_configured
    && status?.telegram?.allow_all_disabled
    && status?.gateway?.running);
}

function phaseFor(status) {
  if (isReady(status)) return 'ready';
  if (!status?.installed || !versionAtLeast(status.version, HERMES_PIN.minimumVersion)
    || !status?.project_bound || !status?.skills_trusted) return 'prepare';
  if (!status?.codex_authenticated) return 'codex-login';
  if (!status?.telegram?.token_configured || !status?.telegram?.allowlist_configured) return 'bot-token';
  return 'attention';
}

function activationEnv(source) {
  const localBin = join(homedir(), '.local', 'bin');
  const current = String(source.PATH || source.Path || '');
  return { ...source, PATH: current.split(delimiter).includes(localBin) ? current : `${localBin}${delimiter}${current}` };
}

async function readLimited(response, limit) {
  if (!response) throw new Error('remote-request-failed');
  const length = Number(response.headers?.get?.('content-length') || 0);
  if (length > limit) throw new Error('remote-response-too-large');
  if (!response.body?.getReader) {
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.length > limit) throw new Error('remote-response-too-large');
    return bytes;
  }
  const reader = response.body.getReader();
  const chunks = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > limit) {
      await reader.cancel();
      throw new Error('remote-response-too-large');
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  return bytes;
}

async function downloadInstaller(platform, fetcher, signal) {
  const spec = platform === 'win32' ? HERMES_PIN.win32 : HERMES_PIN.posix;
  const parsed = new URL(spec.url);
  if (parsed.protocol !== 'https:' || !INSTALLER_HOSTS.has(parsed.hostname)) {
    throw new Error('hermes-installer-host-denied');
  }
  let bytes;
  const requestAbort = new AbortController();
  const abortRequest = () => requestAbort.abort();
  signal?.addEventListener('abort', abortRequest, { once: true });
  const requestTimer = setTimeout(abortRequest, DOWNLOAD_TIMEOUT_MS);
  try {
    const response = await fetcher(spec.url, {
      redirect: 'error', signal: requestAbort.signal,
      headers: { Accept: 'application/octet-stream', 'User-Agent': 'Cerebro-INEVITA-Cockpit/1.37.0' },
    });
    if (!response?.ok) throw new Error('hermes-installer-download-failed');
    bytes = await readLimited(response, INSTALLER_LIMIT);
  } catch (error) {
    if (safeError(error) === 'remote-response-too-large') throw new Error('hermes-installer-too-large');
    throw new Error('hermes-installer-download-failed');
  } finally {
    clearTimeout(requestTimer);
    signal?.removeEventListener('abort', abortRequest);
  }
  const digest = createHash('sha256').update(bytes).digest('hex');
  if (digest !== spec.sha256) throw new Error('hermes-installer-checksum-failed');
  const directory = mkdtempSync(join(tmpdir(), 'inevita-hermes-'));
  const file = join(directory, platform === 'win32' ? 'install.ps1' : 'install.sh');
  writeFileSync(file, bytes, { mode: 0o700, flag: 'wx' });
  if (platform !== 'win32') chmodSync(file, 0o700);
  return { directory, file };
}

function installerCommand(platform, file) {
  if (platform === 'win32') {
    return {
      command: 'powershell.exe',
      args: ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', file, '-NonInteractive', '-SkipSetup', '-Commit', HERMES_PIN.commit],
    };
  }
  return {
    command: '/bin/bash',
    args: [file, '--non-interactive', '--skip-setup', '--no-skills', '--commit', HERMES_PIN.commit],
  };
}

function runProcess(spawnProcess, command, args, options, { timeout, onData = () => {} } = {}) {
  return new Promise((resolveProcess, rejectProcess) => {
    let settled = false;
    let outputSize = 0;
    let child;
    let timer = null;
    const finish = (callback, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      callback(value);
    };
    const { onChild, ...spawnOptions } = options;
    try {
      child = spawnProcess(command, args, { ...spawnOptions, shell: false, windowsHide: true });
    } catch {
      rejectProcess(new Error('hermes-process-start-failed'));
      return;
    }
    timer = setTimeout(() => {
      try { child.kill('SIGTERM'); } catch { /* best effort */ }
      finish(rejectProcess, new Error('hermes-process-timeout'));
    }, timeout);
    const capture = (chunk) => {
      outputSize += Buffer.byteLength(chunk);
      if (outputSize <= 128 * 1024) onData(stripAnsi(chunk));
    };
    child.stdout?.on?.('data', capture);
    child.stderr?.on?.('data', capture);
    child.once?.('error', () => finish(rejectProcess, new Error('hermes-process-start-failed')));
    child.once?.('close', (code) => {
      if (code === 0) finish(resolveProcess, { child, status: 0 });
      else finish(rejectProcess, new Error('hermes-process-failed'));
    });
    onChild?.(child);
  });
}

function parseOAuthOutput(previous, chunk) {
  const buffer = stripAnsi(`${previous || ''}${chunk || ''}`).slice(-12_000);
  const verification = buffer.match(/https:\/\/auth\.openai\.com\/codex\/device\b/i)?.[0] || null;
  const codeSection = buffer.split(/Enter this code:\s*/i).at(-1);
  const userCode = codeSection !== buffer
    ? codeSection.match(/\b[A-Z0-9]{4,12}(?:-[A-Z0-9]{2,12})?\b/)?.[0] || null
    : null;
  return { buffer, verification, userCode };
}

async function telegramCall(fetcher, token, method, payload, signal) {
  if (!hermesRuntimeInternals.TELEGRAM_TOKEN_RE.test(token)) throw new Error('telegram-token-invalid');
  const requestAbort = new AbortController();
  const abortRequest = () => requestAbort.abort();
  signal?.addEventListener('abort', abortRequest, { once: true });
  const requestTimer = setTimeout(abortRequest, TELEGRAM_REQUEST_TIMEOUT_MS);
  let bytes;
  try {
    const response = await fetcher(`https://api.telegram.org/bot${token}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload || {}),
      signal: requestAbort.signal,
      redirect: 'error',
    });
    bytes = await readLimited(response, TELEGRAM_LIMIT);
  } catch {
    throw new Error('telegram-request-failed');
  } finally {
    clearTimeout(requestTimer);
    signal?.removeEventListener('abort', abortRequest);
  }
  let value;
  try { value = JSON.parse(Buffer.from(bytes).toString('utf8')); } catch { throw new Error('telegram-response-invalid'); }
  if (!value?.ok) throw new Error(method === 'getMe' ? 'telegram-token-invalid' : 'telegram-request-failed');
  return value.result;
}

function cleanAction(action) {
  return {
    id: action.id,
    kind: action.kind,
    status: action.status,
    progress: action.progress,
    verification_url: action.verification_url,
    user_code: action.user_code,
    expires_at: action.expires_at,
    error_code: action.error_code,
  };
}

export function createHermesActivationController({
  root,
  hermesRunner,
  hermesEnv = process.env,
  spawnProcess = spawn,
  fetcher = globalThis.fetch,
  platform = process.platform,
  clock = () => Date.now(),
} = {}) {
  const brainRoot = resolve(root || process.cwd());
  const runtimeOptions = { runner: hermesRunner, env: activationEnv(hermesEnv) };
  let phase = 'prepare';
  let action = {
    id: null, kind: null, status: 'idle', progress: 0,
    verification_url: null, user_code: null, expires_at: null, error_code: null,
  };
  let bot = { username: null, owner_candidate_display: null, connected: false };
  let currentChild = null;
  let currentAbort = null;
  let installerDirectory = null;
  let telegramToken = null;
  let telegramCandidateId = null;
  let telegramNextOffset = 0;
  let ownerDeadline = 0;
  let gatewayWasRunning = false;
  let gatewayStateCaptured = false;
  let identityRefresh = null;
  let identityAbort = null;
  let botUsernameBeforeProbe = null;

  const readStatus = () => readHermesStatus(brainRoot, runtimeOptions);
  const sync = (status = readStatus()) => {
    if (!ACTION_STATUSES.has(action.status)) phase = action.status === 'error' ? 'attention' : phaseFor(status);
    bot.connected = Boolean(status.telegram?.token_configured && status.telegram?.allowlist_configured);
    return status;
  };
  sync();

  function snapshot(status = null) {
    if (status) sync(status);
    return {
      phase,
      action: cleanAction(action),
      bot: { ...bot },
    };
  }

  function begin(kind, nextPhase, expiresIn) {
    if (ACTION_STATUSES.has(action.status)) throw new Error('activation-busy');
    const id = randomBytes(18).toString('base64url');
    action = {
      id, kind, status: 'running', progress: 1,
      verification_url: null, user_code: null,
      expires_at: new Date(clock() + expiresIn).toISOString(), error_code: null,
    };
    phase = nextPhase;
    return id;
  }

  function succeed(id, nextPhase) {
    if (action.id !== id) return;
    action = { ...action, status: 'succeeded', progress: 100, expires_at: null, error_code: null };
    phase = nextPhase;
  }

  function fail(id, error, fallback) {
    if (action.id !== id || action.status === 'cancelled') return;
    action = { ...action, status: 'error', expires_at: null, error_code: safeError(error, fallback) };
    phase = 'attention';
    telegramCandidateId = null;
    bot.owner_candidate_display = null;
  }

  function cleanupTransient() {
    currentAbort?.abort();
    currentAbort = null;
    if (currentChild) {
      try { currentChild.kill('SIGTERM'); } catch { /* best effort */ }
      currentChild = null;
    }
    if (installerDirectory) {
      rmSync(installerDirectory, { recursive: true, force: true });
      installerDirectory = null;
    }
  }

  function restoreGatewayIfNeeded() {
    if (!gatewayStateCaptured) return;
    try {
      controlHermesGateway(brainRoot, gatewayWasRunning ? 'restart' : 'stop', runtimeOptions);
    } catch { /* best effort */ }
    gatewayWasRunning = false;
    gatewayStateCaptured = false;
  }

  function refreshExistingBotIdentity(status) {
    if (ACTION_STATUSES.has(action.status) || !status?.telegram?.token_configured || bot.username || identityRefresh) return;
    const token = hermesRuntimeInternals.telegramSecret(brainRoot, runtimeOptions);
    if (!token) return;
    bot.identity_loading = true;
    identityAbort = new AbortController();
    identityRefresh = telegramCall(fetcher, token, 'getMe', {}, identityAbort.signal)
      .then((identity) => {
        bot.username = String(identity?.username || '').replace(/[^A-Za-z0-9_]/g, '').slice(0, 32) || null;
      })
      .catch(() => {})
      .finally(() => {
        bot.identity_loading = false;
        identityRefresh = null;
        identityAbort = null;
      });
  }

  async function prepareTask(id) {
    try {
      let status = readStatus();
      if (status.installed && !versionTuple(status.version)) throw new Error('hermes-version-unrecognized');
      const installNeeded = !status.installed || !versionAtLeast(status.version, HERMES_PIN.minimumVersion);
      if (installNeeded) {
        action.progress = 8;
        currentAbort = new AbortController();
        const installer = await downloadInstaller(platform, fetcher, currentAbort.signal);
        installerDirectory = installer.directory;
        action.progress = 28;
        const command = installerCommand(platform, installer.file);
        await runProcess(spawnProcess, command.command, command.args, {
          cwd: brainRoot,
          env: runtimeOptions.env,
          onChild: (child) => { currentChild = child; },
        }, { timeout: 10 * 60 * 1000 });
        currentChild = null;
        rmSync(installerDirectory, { recursive: true, force: true });
        installerDirectory = null;
        status = readStatus();
        if (!status.installed) throw new Error('hermes-install-not-detected');
      }
      action.progress = 72;
      bindHermesProject(brainRoot, runtimeOptions);
      status = readStatus();
      action.progress = 92;
      if (!status.codex_authenticated) {
        action = {
          ...action,
          kind: 'codex-login',
          progress: 35,
          expires_at: new Date(clock() + OAUTH_TIMEOUT_MS).toISOString(),
        };
        phase = 'codex-login';
        await codexTask(id);
        return;
      }
      succeed(id, bot.connected ? phaseFor(status) : 'bot-token');
    } catch (error) {
      fail(id, error, 'hermes-prepare-failed');
    } finally {
      cleanupTransient();
    }
  }

  function startPrepare() {
    const id = begin('prepare', 'prepare', 10 * 60 * 1000);
    void prepareTask(id);
    return snapshot();
  }

  async function codexTask(id) {
    let parsed = { buffer: '', verification: null, userCode: null };
    try {
      await runProcess(spawnProcess, 'hermes', ['auth', 'add', 'openai-codex', '--type', 'oauth', '--label', 'Cockpit INEVITA'], {
        cwd: brainRoot,
        env: { ...runtimeOptions.env, NO_COLOR: '1', CLICOLOR: '0', PYTHONUNBUFFERED: '1' },
        onChild: (child) => { currentChild = child; },
      }, {
        timeout: OAUTH_TIMEOUT_MS,
        onData: (chunk) => {
          parsed = parseOAuthOutput(parsed.buffer, chunk);
          if (parsed.verification) action.verification_url = parsed.verification;
          if (parsed.userCode) action.user_code = parsed.userCode;
          if (parsed.verification || parsed.userCode) action.progress = 45;
        },
      });
      currentChild = null;
      configureHermesCodex(brainRoot, runtimeOptions);
      action.progress = 78;
      bindHermesProject(brainRoot, runtimeOptions);
      succeed(id, bot.connected ? phaseFor(readStatus()) : 'bot-token');
    } catch (error) {
      fail(id, error, 'hermes-codex-login-failed');
    } finally {
      currentChild = null;
    }
  }

  function startCodex() {
    const status = readStatus();
    if (!status.installed) throw new Error('hermes-install-required');
    const id = begin('codex-login', 'codex-login', OAUTH_TIMEOUT_MS);
    void codexTask(id);
    return snapshot();
  }

  async function ownerProbe(id) {
    try {
      while (action.id === id && action.status === 'running' && clock() < ownerDeadline) {
        currentAbort = new AbortController();
        const updates = await telegramCall(fetcher, telegramToken, 'getUpdates', {
          offset: telegramNextOffset,
          limit: 20,
          timeout: 20,
          allowed_updates: ['message'],
        }, currentAbort.signal);
        currentAbort = null;
        for (const update of Array.isArray(updates) ? updates : []) {
          telegramNextOffset = Math.max(telegramNextOffset, Number(update.update_id || 0) + 1);
          const message = update.message;
          if (message?.chat?.type !== 'private' || !/^\/start(?:@\w+)?(?:\s|$)/i.test(String(message.text || ''))) continue;
          const senderId = String(message.from?.id || message.chat?.id || '');
          if (!/^\d{1,20}$/.test(senderId)) continue;
          telegramCandidateId = senderId;
          bot.owner_candidate_display = safeDisplay(message.from || message.chat);
          action = { ...action, status: 'awaiting-confirmation', progress: 75 };
          return;
        }
      }
      if (action.id === id && action.status === 'running') throw new Error('telegram-owner-timeout');
    } catch (error) {
      if (action.id === id && action.status === 'cancelled') return;
      telegramToken = null;
      bot.username = botUsernameBeforeProbe;
      botUsernameBeforeProbe = null;
      restoreGatewayIfNeeded();
      fail(id, error, 'telegram-owner-detection-failed');
    } finally {
      currentAbort = null;
    }
  }

  async function telegramTask(id, token) {
    try {
      currentAbort = new AbortController();
      const identity = await telegramCall(fetcher, token, 'getMe', {}, currentAbort.signal);
      currentAbort = null;
      bot.username = String(identity?.username || '').replace(/[^A-Za-z0-9_]/g, '').slice(0, 32) || null;
      const status = readStatus();
      gatewayWasRunning = Boolean(status.gateway?.running);
      gatewayStateCaptured = true;
      if (status.gateway?.installed) {
        try { controlHermesGateway(brainRoot, 'stop', runtimeOptions); } catch { /* already stopped */ }
      }
      currentAbort = new AbortController();
      const baseline = await telegramCall(fetcher, token, 'getUpdates', {
        offset: -1, limit: 1, timeout: 0, allowed_updates: ['message'],
      }, currentAbort.signal);
      currentAbort = null;
      telegramNextOffset = Array.isArray(baseline) && baseline.length
        ? Number(baseline.at(-1).update_id || 0) + 1 : 0;
      telegramToken = token;
      ownerDeadline = clock() + OWNER_TIMEOUT_MS;
      action.progress = 52;
      await ownerProbe(id);
    } catch (error) {
      telegramToken = null;
      bot.username = botUsernameBeforeProbe;
      botUsernameBeforeProbe = null;
      restoreGatewayIfNeeded();
      fail(id, error, 'telegram-connect-failed');
    } finally {
      currentAbort = null;
    }
  }

  function startTelegram(token) {
    const value = String(token || '').trim();
    if (!hermesRuntimeInternals.TELEGRAM_TOKEN_RE.test(value) || value.length > 256) {
      throw new Error('telegram-token-invalid');
    }
    const status = readStatus();
    if (!status.codex_authenticated || !status.project_bound || !status.skills_trusted) {
      throw new Error('hermes-prepare-required');
    }
    botUsernameBeforeProbe = bot.username;
    const id = begin('telegram-owner', 'identify-owner', OWNER_TIMEOUT_MS);
    void telegramTask(id, value);
    return snapshot();
  }

  function rejectOwner(id) {
    if (action.id !== id || action.status !== 'awaiting-confirmation') throw new Error('activation-action-invalid');
    telegramCandidateId = null;
    bot.owner_candidate_display = null;
    action = { ...action, status: 'running', progress: 55 };
    void ownerProbe(id);
    return snapshot();
  }

  async function finalizeOwner(id) {
    let configSnapshot = null;
    try {
      configSnapshot = createHermesConfigSnapshot(brainRoot, runtimeOptions);
      configureHermesTelegram(brainRoot, { token: telegramToken, allowed_users: [telegramCandidateId] }, runtimeOptions);
      action.progress = 86;
      const status = readStatus();
      controlHermesGateway(brainRoot, status.gateway?.installed ? 'restart' : 'install', runtimeOptions);
      action.progress = 94;
      const doctor = runHermesDoctor(brainRoot, runtimeOptions);
      if (doctor.status !== 'passed') throw new Error('hermes-doctor-attention');
      let verified = readStatus();
      for (let attempt = 0; attempt < 4 && !isReady(verified); attempt += 1) {
        await new Promise((resolveWait) => setTimeout(resolveWait, 500));
        if (action.id !== id || action.status !== 'running') throw new Error('activation-action-invalid');
        verified = readStatus();
      }
      if (!isReady(verified)) throw new Error('hermes-verification-failed');
      discardHermesConfigSnapshot(configSnapshot);
      configSnapshot = null;
      gatewayWasRunning = false;
      gatewayStateCaptured = false;
      telegramToken = null;
      telegramCandidateId = null;
      bot.owner_candidate_display = null;
      bot.connected = true;
      botUsernameBeforeProbe = null;
      succeed(id, 'ready');
    } catch (error) {
      if (configSnapshot) {
        try { restoreHermesConfigSnapshot(configSnapshot); } catch { /* preserve original error */ }
        try { discardHermesConfigSnapshot(configSnapshot); } catch { /* best effort */ }
      }
      restoreGatewayIfNeeded();
      telegramToken = null;
      bot.username = botUsernameBeforeProbe;
      botUsernameBeforeProbe = null;
      fail(id, error, 'telegram-finalize-failed');
    }
  }

  function confirmOwner(id) {
    if (action.id !== id || action.status !== 'awaiting-confirmation' || !telegramToken || !telegramCandidateId) {
      throw new Error('activation-action-invalid');
    }
    phase = 'finalizing';
    action = { ...action, status: 'running', progress: 82 };
    void finalizeOwner(id);
    return snapshot();
  }

  function cancel(id) {
    if (phase === 'finalizing' || action.id !== id || !ACTION_STATUSES.has(action.status)) {
      throw new Error('activation-action-invalid');
    }
    action = { ...action, status: 'cancelled', expires_at: null, error_code: null };
    cleanupTransient();
    restoreGatewayIfNeeded();
    telegramToken = null;
    telegramCandidateId = null;
    bot.username = botUsernameBeforeProbe;
    botUsernameBeforeProbe = null;
    bot.owner_candidate_display = null;
    phase = phaseFor(readStatus());
    return snapshot();
  }

  function status() {
    const currentStatus = readStatus();
    refreshExistingBotIdentity(currentStatus);
    return snapshot(currentStatus);
  }

  function dispose() {
    cleanupTransient();
    identityAbort?.abort();
    identityAbort = null;
    restoreGatewayIfNeeded();
    telegramToken = null;
    telegramCandidateId = null;
  }

  return Object.freeze({
    status,
    startPrepare,
    startCodex,
    startTelegram,
    rejectOwner,
    confirmOwner,
    cancel,
    dispose,
  });
}

export const hermesActivationInternals = Object.freeze({
  versionAtLeast,
  phaseFor,
  parseOAuthOutput,
  safeDisplay,
  installerCommand,
  telegramCall,
  readLimited,
});
