import { createHash } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  unlinkSync,
} from 'node:fs';
import { delimiter, dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';

const CREDENTIAL_REF_RE = /^[a-z][a-z0-9-]{1,31}:[A-Za-z0-9][A-Za-z0-9_./:-]{0,223}$/;
const SERVICE = 'com.inevita.company-brain';

export class SecretProviderError extends Error {
  constructor(reasonCode, message) {
    super(message);
    this.name = 'SecretProviderError';
    this.reasonCode = reasonCode;
  }
}

function credentialRef(value) {
  if (!CREDENTIAL_REF_RE.test(value || '')) {
    throw new SecretProviderError('credential-ref-invalid', 'credential_ref inválido');
  }
  return value;
}

function commandPath(names, env, platform) {
  const extensions = platform === 'win32'
    ? String(env.PATHEXT || '.EXE;.CMD;.BAT').split(';')
    : [''];
  for (const directory of String(env.PATH || '').split(delimiter).filter(Boolean)) {
    for (const name of names) {
      for (const extension of extensions) {
        const candidate = join(directory, platform === 'win32' ? `${name}${extension}` : name);
        if (existsSync(candidate)) return candidate;
      }
    }
  }
  return null;
}

function safeSpawn(spawn, command, args, options, reasonCode, message) {
  const result = spawn(command, args, options);
  if (result.error || result.status !== 0) throw new SecretProviderError(reasonCode, message);
  return result;
}

class UnavailableSecretProvider {
  constructor(reasonCode) {
    this.name = 'unavailable';
    this.available = false;
    this.reasonCode = reasonCode;
    this.interactiveSet = false;
  }

  status() {
    return {
      mode: 'file-only',
      provider: this.name,
      available: false,
      reason_code: this.reasonCode,
    };
  }

  fail() {
    throw new SecretProviderError(this.reasonCode, 'provider de segredos indisponível; runtime degradado para file-only');
  }

  hasSecret() { return false; }
  getSecret() { return this.fail(); }
  setSecret() { return this.fail(); }
  setSecretInteractive() { return this.fail(); }
  deleteSecret() { return this.fail(); }
}

class MemorySecretProvider {
  constructor(store = new Map()) {
    this.name = 'memory-ephemeral';
    this.available = true;
    this.reasonCode = null;
    this.interactiveSet = false;
    this.store = store;
  }

  status() {
    return { mode: 'managed', provider: this.name, available: true, reason_code: null };
  }

  hasSecret(ref) { return this.store.has(credentialRef(ref)); }

  getSecret(ref) {
    const key = credentialRef(ref);
    if (!this.store.has(key)) throw new SecretProviderError('credential-missing', 'credencial não encontrada');
    return this.store.get(key);
  }

  setSecret(ref, secret) {
    if (typeof secret !== 'string' || secret.length === 0) throw new SecretProviderError('secret-empty', 'segredo vazio');
    this.store.set(credentialRef(ref), secret);
  }

  deleteSecret(ref) { return this.store.delete(credentialRef(ref)); }
}

class MacOSKeychainProvider {
  constructor({ spawn = spawnSync } = {}) {
    this.name = 'macos-keychain';
    this.available = existsSync('/usr/bin/security');
    this.reasonCode = this.available ? null : 'macos-keychain-unavailable';
    this.interactiveSet = true;
    this.spawn = spawn;
  }

  status() {
    return {
      mode: this.available ? 'managed' : 'file-only',
      provider: this.name,
      available: this.available,
      reason_code: this.reasonCode,
    };
  }

  args(ref) { return ['-a', credentialRef(ref), '-s', SERVICE]; }

  hasSecret(ref) {
    if (!this.available) return false;
    const result = this.spawn('/usr/bin/security', ['find-generic-password', ...this.args(ref)], {
      stdio: 'ignore',
    });
    return !result.error && result.status === 0;
  }

  getSecret(ref) {
    if (!this.available) throw new SecretProviderError(this.reasonCode, 'Keychain indisponível');
    const result = safeSpawn(this.spawn, '/usr/bin/security', [
      'find-generic-password', ...this.args(ref), '-w',
    ], {
      encoding: 'utf8',
      maxBuffer: 1024 * 1024,
      stdio: ['ignore', 'pipe', 'ignore'],
    }, 'credential-missing', 'credencial não encontrada no Keychain');
    return String(result.stdout || '').replace(/[\r\n]+$/, '');
  }

  setSecret() {
    throw new SecretProviderError('interactive-set-required', 'macOS exige entrada direta no prompt do Keychain');
  }

  setSecretInteractive(ref) {
    if (!this.available) throw new SecretProviderError(this.reasonCode, 'Keychain indisponível');
    safeSpawn(this.spawn, '/usr/bin/security', [
      'add-generic-password', ...this.args(ref), '-U', '-w',
    ], { stdio: 'inherit' }, 'credential-store-failed', 'Keychain não armazenou a credencial');
  }

  deleteSecret(ref) {
    if (!this.available) throw new SecretProviderError(this.reasonCode, 'Keychain indisponível');
    if (!this.hasSecret(ref)) return false;
    safeSpawn(this.spawn, '/usr/bin/security', [
      'delete-generic-password', ...this.args(ref),
    ], { stdio: 'ignore' }, 'credential-delete-failed', 'Keychain não removeu a credencial');
    return true;
  }
}

class LinuxSecretServiceProvider {
  constructor({ executable, spawn = spawnSync } = {}) {
    this.name = 'linux-secret-service';
    this.executable = executable;
    this.available = Boolean(executable);
    this.reasonCode = this.available ? null : 'linux-secret-service-unavailable';
    this.interactiveSet = false;
    this.spawn = spawn;
  }

  status() {
    return {
      mode: this.available ? 'managed' : 'file-only',
      provider: this.name,
      available: this.available,
      reason_code: this.reasonCode,
    };
  }

  attrs(ref) { return ['application', SERVICE, 'credential-ref', credentialRef(ref)]; }

  hasSecret(ref) {
    if (!this.available) return false;
    const result = this.spawn(this.executable, ['lookup', ...this.attrs(ref)], {
      encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'],
    });
    return !result.error && result.status === 0 && String(result.stdout || '').length > 0;
  }

  getSecret(ref) {
    if (!this.available) throw new SecretProviderError(this.reasonCode, 'Secret Service indisponível');
    const result = safeSpawn(this.spawn, this.executable, ['lookup', ...this.attrs(ref)], {
      encoding: 'utf8', maxBuffer: 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'],
    }, 'credential-missing', 'credencial não encontrada no Secret Service');
    return String(result.stdout || '').replace(/[\r\n]+$/, '');
  }

  setSecret(ref, secret) {
    if (!this.available) throw new SecretProviderError(this.reasonCode, 'Secret Service indisponível');
    if (typeof secret !== 'string' || secret.length === 0) throw new SecretProviderError('secret-empty', 'segredo vazio');
    safeSpawn(this.spawn, this.executable, [
      'store', `--label=Company Brain · ${credentialRef(ref)}`, ...this.attrs(ref),
    ], {
      input: secret,
      encoding: 'utf8',
      stdio: ['pipe', 'ignore', 'ignore'],
    }, 'credential-store-failed', 'Secret Service não armazenou a credencial');
  }

  deleteSecret(ref) {
    if (!this.available) throw new SecretProviderError(this.reasonCode, 'Secret Service indisponível');
    if (!this.hasSecret(ref)) return false;
    safeSpawn(this.spawn, this.executable, ['clear', ...this.attrs(ref)], {
      stdio: 'ignore',
    }, 'credential-delete-failed', 'Secret Service não removeu a credencial');
    return true;
  }
}

class WindowsDpapiProvider {
  constructor({ root, executable, spawn = spawnSync } = {}) {
    this.name = 'windows-dpapi';
    this.root = root;
    this.executable = executable;
    this.available = Boolean(executable);
    this.reasonCode = this.available ? null : 'windows-dpapi-unavailable';
    this.interactiveSet = false;
    this.spawn = spawn;
  }

  status() {
    return {
      mode: this.available ? 'managed' : 'file-only',
      provider: this.name,
      available: this.available,
      reason_code: this.reasonCode,
    };
  }

  path(ref) {
    const digest = createHash('sha256').update(credentialRef(ref)).digest('hex');
    return join(this.root, '.cerebro', 'runtime', 'secrets', `${digest}.dpapi`);
  }

  hasSecret(ref) { return this.available && existsSync(this.path(ref)); }

  setSecret(ref, secret) {
    if (!this.available) throw new SecretProviderError(this.reasonCode, 'DPAPI indisponível');
    if (typeof secret !== 'string' || secret.length === 0) throw new SecretProviderError('secret-empty', 'segredo vazio');
    const path = this.path(ref);
    mkdirSync(dirname(path), { recursive: true });
    const script = [
      '$value=[Console]::In.ReadToEnd();',
      '$bytes=[Text.Encoding]::UTF8.GetBytes($value);',
      '$encrypted=[Security.Cryptography.ProtectedData]::Protect($bytes,$null,[Security.Cryptography.DataProtectionScope]::CurrentUser);',
      '[IO.File]::WriteAllBytes($args[0],$encrypted);',
    ].join('');
    safeSpawn(this.spawn, this.executable, ['-NoProfile', '-NonInteractive', '-Command', script, path], {
      input: secret, encoding: 'utf8', stdio: ['pipe', 'ignore', 'ignore'],
    }, 'credential-store-failed', 'DPAPI não armazenou a credencial');
  }

  getSecret(ref) {
    if (!this.available) throw new SecretProviderError(this.reasonCode, 'DPAPI indisponível');
    const path = this.path(ref);
    if (!existsSync(path)) throw new SecretProviderError('credential-missing', 'credencial não encontrada');
    const script = [
      '$encrypted=[IO.File]::ReadAllBytes($args[0]);',
      '$bytes=[Security.Cryptography.ProtectedData]::Unprotect($encrypted,$null,[Security.Cryptography.DataProtectionScope]::CurrentUser);',
      '[Console]::Out.Write([Text.Encoding]::UTF8.GetString($bytes));',
    ].join('');
    const result = safeSpawn(this.spawn, this.executable, [
      '-NoProfile', '-NonInteractive', '-Command', script, path,
    ], {
      encoding: 'utf8', maxBuffer: 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'],
    }, 'credential-read-failed', 'DPAPI não recuperou a credencial');
    return String(result.stdout || '');
  }

  deleteSecret(ref) {
    if (!this.available) throw new SecretProviderError(this.reasonCode, 'DPAPI indisponível');
    const path = this.path(ref);
    if (!existsSync(path)) return false;
    unlinkSync(path);
    return true;
  }
}

export function createSecretProvider({
  root = process.cwd(),
  provider = 'auto',
  platform = process.platform,
  env = process.env,
  spawn = spawnSync,
  memoryStore,
  testOnly = false,
} = {}) {
  if (provider === 'memory') {
    if (!testOnly && env.CEREBRO_RUNTIME_TEST !== '1') {
      throw new SecretProviderError('memory-provider-forbidden', 'provider em memória é exclusivo do harness');
    }
    return new MemorySecretProvider(memoryStore);
  }
  if (provider === 'macos-keychain' || (provider === 'auto' && platform === 'darwin')) {
    return new MacOSKeychainProvider({ spawn });
  }
  if (provider === 'linux-secret-service' || (provider === 'auto' && platform === 'linux')) {
    return new LinuxSecretServiceProvider({
      executable: commandPath(['secret-tool'], env, platform),
      spawn,
    });
  }
  if (provider === 'windows-dpapi' || (provider === 'auto' && platform === 'win32')) {
    return new WindowsDpapiProvider({
      root,
      executable: commandPath(['pwsh', 'powershell'], env, platform),
      spawn,
    });
  }
  return new UnavailableSecretProvider('secret-provider-unsupported');
}

// Exportado apenas para o harness verificar que nenhuma implementação persiste o plaintext.
export function encryptedSecretArtifact(root, ref) {
  const digest = createHash('sha256').update(credentialRef(ref)).digest('hex');
  return join(root, '.cerebro', 'runtime', 'secrets', `${digest}.dpapi`);
}
