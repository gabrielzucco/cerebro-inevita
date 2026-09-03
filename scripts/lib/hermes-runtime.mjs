import { randomBytes } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import {
  chmodSync,
  existsSync,
  lstatSync,
  mkdtempSync,
  rmSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from 'node:fs';
import { basename, delimiter, dirname, isAbsolute, join, resolve } from 'node:path';
import { homedir, tmpdir } from 'node:os';

const TELEGRAM_TOKEN_RE = /^\d+:[A-Za-z0-9_-]{30,}$/;
const TELEGRAM_USER_RE = /^\d{1,20}$/;
const MANAGED_ENV_KEYS = Object.freeze([
  'TELEGRAM_BOT_TOKEN',
  'TELEGRAM_ALLOWED_USERS',
  'TELEGRAM_HOME_CHANNEL',
  'GATEWAY_ALLOW_ALL_USERS',
  'TELEGRAM_ALLOW_ALL_USERS',
]);

function defaultRunner(command, args, options) {
  return spawnSync(command, args, { ...options, shell: false });
}

function clean(value) {
  return String(value || '').replace(/\u001b\[[0-9;]*m/g, '').trim();
}

function commandEnv(env) {
  const localBin = join(homedir(), '.local', 'bin');
  const current = String(env.PATH || env.Path || '');
  return { ...env, PATH: current.split(delimiter).includes(localBin) ? current : `${localBin}${delimiter}${current}` };
}

function invoke(args, {
  runner = defaultRunner,
  cwd = process.cwd(),
  env = process.env,
  timeout = 8_000,
} = {}) {
  const result = runner('hermes', args, {
    cwd,
    env: { ...commandEnv(env), NO_COLOR: '1', CLICOLOR: '0' },
    encoding: 'utf8',
    timeout,
    maxBuffer: 128 * 1024,
    windowsHide: true,
  }) || {};
  return {
    ok: result.status === 0 && !result.error,
    status: Number.isInteger(result.status) ? result.status : null,
    stdout: clean(result.stdout),
    stderr: clean(result.stderr),
    missing: result.error?.code === 'ENOENT',
    timed_out: result.error?.code === 'ETIMEDOUT' || result.signal === 'SIGTERM',
  };
}

function jsonOutput(result) {
  if (!result.ok || !result.stdout) return null;
  try {
    return JSON.parse(result.stdout);
  } catch {
    return result.stdout;
  }
}

function finalLine(value) {
  return clean(value).split(/\r?\n/).filter(Boolean).at(-1) || '';
}

function firstLine(value) {
  return clean(value).split(/\r?\n/).find(Boolean) || '';
}

function hermesPaths(options) {
  const configResult = invoke(['config', 'path'], options);
  const envResult = invoke(['config', 'env-path'], options);
  if (!configResult.ok || !envResult.ok) throw new Error('hermes-config-path-unavailable');
  const configPath = finalLine(configResult.stdout);
  const envPath = finalLine(envResult.stdout);
  if (!isAbsolute(configPath) || !isAbsolute(envPath)) throw new Error('hermes-config-path-invalid');
  if (basename(configPath) !== 'config.yaml' || basename(envPath) !== '.env') throw new Error('hermes-config-path-invalid');
  if (resolve(dirname(configPath)) !== resolve(dirname(envPath))) throw new Error('hermes-config-path-invalid');
  if (existsSync(envPath) && lstatSync(envPath).isSymbolicLink()) throw new Error('hermes-env-symlink-denied');
  return { configPath, envPath };
}

function parseEnv(text) {
  const values = new Map();
  for (const line of String(text || '').split(/\r?\n/)) {
    const match = line.match(/^\s*(?:export\s+)?([A-Z][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    values.set(match[1], value);
  }
  return values;
}

function rewriteEnv(text, changes) {
  const targeted = new Set(Object.keys(changes));
  const kept = String(text || '').split(/\r?\n/).filter((line) => {
    const match = line.match(/^\s*(?:export\s+)?([A-Z][A-Z0-9_]*)\s*=/);
    return !match || !targeted.has(match[1]);
  });
  while (kept.length && !kept.at(-1)) kept.pop();
  const appended = Object.entries(changes)
    .filter(([, value]) => value !== null)
    .map(([key, value]) => `${key}=${value}`);
  return `${[...kept, ...(kept.length && appended.length ? [''] : []), ...appended].join('\n')}\n`;
}

function writeHermesEnv(options, changes) {
  const { envPath } = hermesPaths(options);
  const current = existsSync(envPath) ? readFileSync(envPath, 'utf8') : '';
  const next = rewriteEnv(current, changes);
  const temporary = `${envPath}.cockpit-${randomBytes(8).toString('hex')}.tmp`;
  writeFileSync(temporary, next, { mode: 0o600, flag: 'wx' });
  if (process.platform !== 'win32') chmodSync(temporary, 0o600);
  renameSync(temporary, envPath);
  if (process.platform !== 'win32') chmodSync(envPath, 0o600);
}

function rewriteYamlList(text, dottedKey, values) {
  const [parentKey, childKey, ...rest] = dottedKey.split('.');
  if (!parentKey || !childKey || rest.length) throw new Error('hermes-config-key-invalid');
  const newline = String(text).includes('\r\n') ? '\r\n' : '\n';
  const lines = String(text || '').split(/\r?\n/);
  if (lines.at(-1) === '') lines.pop();
  const indentation = (line) => line.match(/^[ \t]*/)?.[0].replaceAll('\t', '  ').length || 0;
  const isContent = (line) => line.trim() && !line.trimStart().startsWith('#');
  const mapping = (line) => line.match(/^(\s*)([A-Za-z0-9_-]+):(?:\s*(.*))?$/);
  const rendered = [
    `  ${childKey}:`,
    ...values.map((value) => `    - ${JSON.stringify(String(value))}`),
  ];

  let parentIndex = -1;
  for (let index = 0; index < lines.length; index += 1) {
    const match = mapping(lines[index]);
    if (match && indentation(lines[index]) === 0 && match[2] === parentKey) {
      if (match[3] && match[3].trim() !== '{}') throw new Error('hermes-config-shape-unsupported');
      if (match[3]) lines[index] = `${parentKey}:`;
      parentIndex = index;
      break;
    }
  }
  if (parentIndex < 0) {
    if (lines.length && lines.at(-1) !== '') lines.push('');
    lines.push(`${parentKey}:`, ...rendered);
    return `${lines.join(newline)}${newline}`;
  }

  let parentEnd = lines.length;
  for (let index = parentIndex + 1; index < lines.length; index += 1) {
    if (isContent(lines[index]) && indentation(lines[index]) === 0) {
      parentEnd = index;
      break;
    }
  }
  let childIndex = -1;
  for (let index = parentIndex + 1; index < parentEnd; index += 1) {
    const match = mapping(lines[index]);
    if (match && indentation(lines[index]) === 2 && match[2] === childKey) {
      childIndex = index;
      break;
    }
  }
  if (childIndex < 0) {
    lines.splice(parentEnd, 0, ...rendered);
    return `${lines.join(newline)}${newline}`;
  }

  let childEnd = parentEnd;
  for (let index = childIndex + 1; index < parentEnd; index += 1) {
    if (isContent(lines[index]) && indentation(lines[index]) <= 2) {
      childEnd = index;
      break;
    }
  }
  lines.splice(childIndex, childEnd - childIndex, ...rendered);
  return `${lines.join(newline)}${newline}`;
}

function writeHermesConfigList(options, dottedKey, values) {
  const { configPath } = hermesPaths(options);
  if (existsSync(configPath) && lstatSync(configPath).isSymbolicLink()) {
    throw new Error('hermes-config-symlink-denied');
  }
  const current = existsSync(configPath) ? readFileSync(configPath, 'utf8') : '';
  const next = rewriteYamlList(current, dottedKey, values);
  const temporary = `${configPath}.cockpit-${randomBytes(8).toString('hex')}.tmp`;
  writeFileSync(temporary, next, { mode: 0o600, flag: 'wx' });
  if (process.platform !== 'win32') chmodSync(temporary, 0o600);
  renameSync(temporary, configPath);
  if (process.platform !== 'win32') chmodSync(configPath, 0o600);
}

function allowedUsers(value) {
  const raw = Array.isArray(value) ? value : String(value || '').split(',');
  const users = [...new Set(raw.map((item) => String(item).trim()).filter(Boolean))];
  if (!users.length || users.length > 20 || users.some((item) => !TELEGRAM_USER_RE.test(item))) {
    throw new Error('telegram-allowed-users-invalid');
  }
  return users;
}

function providerLabel(value) {
  const safe = (label) => {
    const text = String(label || '').replace(/[\r\n\0]/g, '').slice(0, 120);
    return TELEGRAM_TOKEN_RE.test(text) || /(?:sk|gho|xox[baprs])[_-][A-Za-z0-9_-]{16,}/.test(text)
      ? 'Provider configurado' : text || null;
  };
  if (typeof value === 'string') return safe(value);
  if (value && typeof value === 'object') {
    const provider = typeof value.provider === 'string' ? value.provider : '';
    const model = typeof value.model === 'string' ? value.model : '';
    return safe([provider, model].filter(Boolean).join(' · '));
  }
  return null;
}

function yamlScalar(text, dottedKey) {
  const parts = dottedKey.split('.');
  const stack = [];
  for (const line of String(text || '').split(/\r?\n/)) {
    if (!line.trim() || line.trimStart().startsWith('#')) continue;
    const match = line.match(/^(\s*)([A-Za-z0-9_-]+):(?:\s*(.*))?$/);
    if (!match) continue;
    const depth = Math.floor(match[1].replaceAll('\t', '  ').length / 2);
    stack.length = depth;
    stack[depth] = match[2];
    if (stack.join('.') !== dottedKey || !match[3]) continue;
    const value = match[3].replace(/\s+#.*$/, '').trim();
    return value.replace(/^(?:"([\s\S]*)"|'([\s\S]*)')$/, '$1$2');
  }
  if (parts.length === 2) {
    const legacy = yamlScalar(text, parts[0]);
    if (legacy && legacy !== '{}') return legacy;
  }
  return null;
}

function yamlList(text, dottedKey) {
  const stack = [];
  const values = [];
  let targetDepth = -1;
  for (const line of String(text || '').split(/\r?\n/)) {
    const mapping = line.match(/^(\s*)([A-Za-z0-9_-]+):(?:\s*(.*))?$/);
    if (mapping) {
      const depth = Math.floor(mapping[1].replaceAll('\t', '  ').length / 2);
      stack.length = depth;
      stack[depth] = mapping[2];
      targetDepth = stack.join('.') === dottedKey ? depth : targetDepth >= depth ? -1 : targetDepth;
      continue;
    }
    const item = line.match(/^(\s*)-\s+(.+)$/);
    if (!item || targetDepth < 0) continue;
    const depth = Math.floor(item[1].replaceAll('\t', '  ').length / 2);
    if (depth <= targetDepth) {
      targetDepth = -1;
      continue;
    }
    values.push(item[2].replace(/\s+#.*$/, '').trim().replace(/^(?:"([\s\S]*)"|'([\s\S]*)')$/, '$1$2'));
  }
  return values;
}

function safeEnvState(options, paths = null) {
  try {
    const { envPath } = paths || hermesPaths(options);
    const values = parseEnv(existsSync(envPath) ? readFileSync(envPath, 'utf8') : '');
    const token = values.get('TELEGRAM_BOT_TOKEN') || '';
    const users = (values.get('TELEGRAM_ALLOWED_USERS') || '').split(',').filter(Boolean);
    return {
      token_configured: TELEGRAM_TOKEN_RE.test(token),
      allowlist_configured: users.length > 0 && users.every((item) => TELEGRAM_USER_RE.test(item.trim())),
      allowed_user_count: users.length,
      home_channel_configured: TELEGRAM_USER_RE.test(values.get('TELEGRAM_HOME_CHANNEL') || ''),
      allow_all_disabled: values.get('GATEWAY_ALLOW_ALL_USERS') === 'false'
        && values.get('TELEGRAM_ALLOW_ALL_USERS') === 'false',
    };
  } catch {
    return {
      token_configured: false,
      allowlist_configured: false,
      allowed_user_count: 0,
      home_channel_configured: false,
      allow_all_disabled: false,
    };
  }
}

function pathInList(values, expected) {
  return Array.isArray(values) && values.some((path) => {
    try { return resolve(path) === resolve(expected); } catch { return false; }
  });
}

export function readHermesStatus(root, {
  runner = defaultRunner,
  env = process.env,
  lastDoctor = null,
} = {}) {
  const options = { runner, env, cwd: root };
  const version = invoke(['--version'], options);
  if (!version.ok) {
    return {
      installed: false,
      version: null,
      provider_configured: false,
      provider_label: null,
      codex_authenticated: false,
      project_bound: false,
      skills_trusted: false,
      skills_trust_supported: false,
      telegram: safeEnvState(options),
      gateway: { installed: false, running: false },
      last_doctor: lastDoctor,
    };
  }
  let paths = null;
  let configText = '';
  try {
    paths = hermesPaths(options);
    configText = existsSync(paths.configPath) ? readFileSync(paths.configPath, 'utf8') : '';
  } catch {
    paths = null;
  }
  const model = providerLabel(yamlScalar(configText, 'model.default'));
  const provider = providerLabel(yamlScalar(configText, 'model.provider'));
  const configuredCwd = yamlScalar(configText, 'terminal.cwd');
  const trusted = yamlList(configText, 'skills.trusted_project_dirs');
  const externalSkills = yamlList(configText, 'skills.external_dirs');
  const trustSupport = invoke(['skills', 'trust', '--help'], options);
  const codexAuth = invoke(['auth', 'status', 'openai-codex'], options);
  const gatewayResult = invoke(['gateway', 'status'], { ...options, timeout: 12_000 });
  const gatewayText = `${gatewayResult.stdout}\n${gatewayResult.stderr}`;
  return {
    installed: true,
    version: firstLine(version.stdout || version.stderr).slice(0, 120),
    provider_configured: Boolean(model || provider || codexAuth.ok),
    provider_label: provider || model || (codexAuth.ok ? 'OpenAI Codex' : null),
    codex_authenticated: codexAuth.ok,
    project_bound: typeof configuredCwd === 'string' && resolve(configuredCwd) === resolve(root),
    skills_trusted: pathInList(trusted, root) || pathInList(externalSkills, resolve(root, '.agents', 'skills')),
    skills_trust_supported: trustSupport.ok,
    telegram: safeEnvState(options, paths),
    gateway: {
      installed: gatewayResult.ok && !/not installed|service.*missing|no installed/i.test(gatewayText),
      running: gatewayResult.ok && /\b(running|active)\b/i.test(gatewayText)
        && !/not running|inactive|stopped/i.test(gatewayText),
    },
    last_doctor: lastDoctor,
  };
}

export function configureHermesTelegram(root, payload, options = {}) {
  const token = String(payload.token || '').trim();
  if (!TELEGRAM_TOKEN_RE.test(token) || token.length > 256) throw new Error('telegram-token-invalid');
  const users = allowedUsers(payload.allowed_users);
  writeHermesEnv({ ...options, cwd: root }, {
    TELEGRAM_BOT_TOKEN: token,
    TELEGRAM_ALLOWED_USERS: users.join(','),
    TELEGRAM_HOME_CHANNEL: users[0],
    GATEWAY_ALLOW_ALL_USERS: 'false',
    TELEGRAM_ALLOW_ALL_USERS: 'false',
  });
  return { status: 'configured', allowed_user_count: users.length, restart_required: true };
}

export function disconnectHermesTelegram(root, options = {}) {
  writeHermesEnv({ ...options, cwd: root }, Object.fromEntries(MANAGED_ENV_KEYS.map((key) => [
    key,
    key.endsWith('ALLOW_ALL_USERS') ? 'false' : null,
  ])));
  return { status: 'disconnected', restart_required: true };
}

function assertSucceeded(result, reason) {
  if (result.timed_out) throw new Error('hermes-command-timeout');
  if (!result.ok) throw new Error(reason);
}

export function bindHermesProject(root, options = {}) {
  const invokeOptions = { ...options, cwd: root };
  assertSucceeded(invoke(['config', 'set', 'terminal.cwd', resolve(root)], invokeOptions), 'hermes-project-bind-failed');
  const trustSupport = invoke(['skills', 'trust', '--help'], invokeOptions);
  if (trustSupport.ok) {
    assertSucceeded(invoke(['skills', 'trust', resolve(root)], invokeOptions), 'hermes-skills-trust-failed');
    return { status: 'bound', skills_trusted: true, skills_mode: 'trusted-project' };
  }

  const { configPath } = hermesPaths(invokeOptions);
  const configText = existsSync(configPath) ? readFileSync(configPath, 'utf8') : '';
  const skillRoot = resolve(root, '.agents', 'skills');
  const externalSkills = yamlList(configText, 'skills.external_dirs');
  if (!pathInList(externalSkills, skillRoot)) {
    writeHermesConfigList(invokeOptions, 'skills.external_dirs', [...externalSkills, skillRoot]);
  }
  return { status: 'bound', skills_trusted: true, skills_mode: 'external-directory' };
}

export function configureHermesCodex(root, options = {}) {
  const invokeOptions = { ...options, cwd: root };
  assertSucceeded(invoke(['auth', 'status', 'openai-codex'], invokeOptions), 'hermes-codex-auth-required');
  assertSucceeded(invoke(['config', 'set', 'model.provider', 'openai-codex'], invokeOptions), 'hermes-codex-provider-failed');
  assertSucceeded(invoke(['config', 'set', 'model.default', ''], invokeOptions), 'hermes-codex-provider-failed');
  return { status: 'configured', provider: 'openai-codex', model: 'automatic' };
}

export function createHermesConfigSnapshot(root, options = {}) {
  const { envPath } = hermesPaths({ ...options, cwd: root });
  const existed = existsSync(envPath);
  const backupDirectory = mkdtempSync(join(tmpdir(), 'inevita-hermes-snapshot-'));
  const backupPath = join(backupDirectory, 'hermes.env.backup');
  writeFileSync(backupPath, existed ? readFileSync(envPath) : Buffer.alloc(0), { mode: 0o600, flag: 'wx' });
  if (process.platform !== 'win32') chmodSync(backupPath, 0o600);
  return Object.freeze({ envPath, backupPath, backupDirectory, existed });
}

export function restoreHermesConfigSnapshot(snapshot) {
  if (!snapshot || !isAbsolute(snapshot.envPath) || !isAbsolute(snapshot.backupPath)) {
    throw new Error('hermes-snapshot-invalid');
  }
  if (!existsSync(snapshot.backupPath) || lstatSync(snapshot.backupPath).isSymbolicLink()) {
    throw new Error('hermes-snapshot-invalid');
  }
  if (!snapshot.existed) {
    rmSync(snapshot.envPath, { force: true });
  } else {
    const temporary = `${snapshot.envPath}.cockpit-restore-${randomBytes(8).toString('hex')}.tmp`;
    writeFileSync(temporary, readFileSync(snapshot.backupPath), { mode: 0o600, flag: 'wx' });
    if (process.platform !== 'win32') chmodSync(temporary, 0o600);
    renameSync(temporary, snapshot.envPath);
    if (process.platform !== 'win32') chmodSync(snapshot.envPath, 0o600);
  }
}

export function discardHermesConfigSnapshot(snapshot) {
  if (snapshot?.backupDirectory && isAbsolute(snapshot.backupDirectory)) {
    rmSync(snapshot.backupDirectory, { recursive: true, force: true });
  }
}

export function runHermesDoctor(root, options = {}) {
  const result = invoke(['doctor'], { ...options, cwd: root, timeout: 30_000 });
  if (result.timed_out) throw new Error('hermes-doctor-timeout');
  return {
    status: result.ok ? 'passed' : 'attention',
    checked_at: new Date().toISOString(),
  };
}

export function controlHermesGateway(root, action, options = {}) {
  const commands = {
    install: ['gateway', 'install', '--start-now', '--start-on-login'],
    start: ['gateway', 'start'],
    stop: ['gateway', 'stop'],
    restart: ['gateway', 'restart'],
  };
  if (!commands[action]) throw new Error('hermes-gateway-action-invalid');
  const result = invoke(commands[action], { ...options, cwd: root, timeout: 30_000 });
  assertSucceeded(result, `hermes-gateway-${action}-failed`);
  return { status: 'completed', action };
}

export const hermesRuntimeInternals = Object.freeze({
  parseEnv,
  rewriteEnv,
  allowedUsers,
  yamlList,
  TELEGRAM_TOKEN_RE,
  telegramSecret(root, options = {}) {
    const { envPath } = hermesPaths({ ...options, cwd: root });
    const values = parseEnv(existsSync(envPath) ? readFileSync(envPath, 'utf8') : '');
    const token = values.get('TELEGRAM_BOT_TOKEN') || '';
    return TELEGRAM_TOKEN_RE.test(token) ? token : null;
  },
});
