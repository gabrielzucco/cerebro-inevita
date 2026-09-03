import { existsSync, lstatSync, mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { layout, writeJsonAtomic } from './system-protocol.mjs';

const ID_RE = /^[a-z0-9][a-z0-9-]{0,63}$/;
const REF_RE = /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/;
const LOCAL_REF_RE = /^(?!\.?\.?$)(?!\.?\.?\/)(?!.*\/\.\.(?:\/|$))[A-Za-z0-9.][A-Za-z0-9_./:-]{0,255}$/;
const LOCAL_HTTP_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

function object(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function closed(errors, value, path, allowed) {
  if (!object(value)) {
    errors.push(`${path} precisa ser objeto`);
    return;
  }
  const keys = new Set(allowed);
  for (const key of Object.keys(value)) if (!keys.has(key)) errors.push(`${path}.${key} não é permitido`);
}

function validInterfaceUrl(value) {
  try {
    const url = new URL(value);
    const localHttp = url.protocol === 'http:' && LOCAL_HTTP_HOSTS.has(url.hostname.toLowerCase());
    return (url.protocol === 'https:' || localHttp)
      && !url.username && !url.password && !url.search && !url.hash;
  } catch {
    return false;
  }
}

export function validateSystemRuntimeBinding(value) {
  const errors = [];
  closed(errors, value, 'system_runtime_binding', [
    'protocol_version', 'binding_id', 'system_ref', 'kind', 'host_ref', 'workspace_ref',
    'workspace_path', 'interface', 'status', 'observed_at', 'privacy',
  ]);
  if (!object(value)) return errors;
  if (value.protocol_version !== 1) errors.push('protocol_version precisa ser 1');
  if (!REF_RE.test(value.binding_id || '')) errors.push('binding_id inválido');
  if (!ID_RE.test(value.system_ref || '')) errors.push('system_ref inválido');
  if (value.kind !== 'local-system') errors.push('kind precisa ser local-system');
  if (!REF_RE.test(value.host_ref || '')) errors.push('host_ref inválido');
  if (!REF_RE.test(value.workspace_ref || '')) errors.push('workspace_ref inválido');
  if (value.workspace_path !== '.' && !LOCAL_REF_RE.test(value.workspace_path || '')) errors.push('workspace_path inválido');

  closed(errors, value.interface, 'interface', ['role', 'kind', 'url', 'launch_mode', 'healthcheck']);
  if (object(value.interface)) {
    if (!ID_RE.test(value.interface.role || '')) errors.push('interface.role inválido');
    if (value.interface.kind !== 'web-ui') errors.push('interface.kind precisa ser web-ui');
    if (!validInterfaceUrl(value.interface.url)) errors.push('interface.url precisa ser HTTPS ou HTTP local sem segredo');
    if (value.interface.launch_mode !== 'external-browser') errors.push('interface.launch_mode precisa ser external-browser');
    closed(errors, value.interface.healthcheck, 'interface.healthcheck', ['method', 'timeout_ms']);
    if (object(value.interface.healthcheck)) {
      if (value.interface.healthcheck.method !== 'HEAD') errors.push('interface.healthcheck.method precisa ser HEAD');
      const timeout = value.interface.healthcheck.timeout_ms;
      if (!Number.isInteger(timeout) || timeout < 100 || timeout > 2000) {
        errors.push('interface.healthcheck.timeout_ms precisa estar entre 100 e 2000');
      }
    }
  }

  if (!['installed', 'missing', 'degraded'].includes(value.status)) errors.push('status inválido');
  if (!Number.isFinite(Date.parse(value.observed_at || ''))) errors.push('observed_at inválido');
  closed(errors, value.privacy, 'privacy', ['credential_stored', 'content_shared_with_inevita']);
  if (object(value.privacy)) {
    if (value.privacy.credential_stored !== false) errors.push('privacy.credential_stored precisa ser false');
    if (value.privacy.content_shared_with_inevita !== false) errors.push('privacy.content_shared_with_inevita precisa ser false');
  }
  return errors;
}

export function systemRuntimeBindingDirectory(root) {
  const brain = resolve(root);
  const directory = resolve(root, layout(root).systemRuntimeBindings || '.cerebro/runtime/system-bindings');
  const rel = relative(brain, directory);
  if (!rel || rel.startsWith('..') || rel.startsWith(sep)) throw new Error('systemRuntimeBindings aponta para fora do Cérebro');
  return directory;
}

export function saveSystemRuntimeBinding(root, value, { replace = false } = {}) {
  const errors = validateSystemRuntimeBinding(value);
  if (errors.length) throw new Error(`System Runtime Binding inválido: ${errors.join(' · ')}`);
  const directory = systemRuntimeBindingDirectory(root);
  const path = join(directory, `${value.binding_id}.json`);
  const existed = existsSync(path);
  if (existed && !replace) throw new Error('system-runtime-binding-exists');
  mkdirSync(directory, { recursive: true, mode: 0o700 });
  writeJsonAtomic(path, value, 0o600);
  return { status: existed ? 'updated' : 'created', binding: value, path };
}

export function listSystemRuntimeBindings(root, issues = []) {
  const directory = systemRuntimeBindingDirectory(root);
  if (!existsSync(directory)) return [];
  const bindings = [];
  for (const name of readdirSync(directory).filter((item) => item.endsWith('.json')).sort()) {
    const path = join(directory, name);
    try {
      if (!lstatSync(path).isFile()) throw new Error('not-file');
      const binding = JSON.parse(readFileSync(path, 'utf8'));
      const errors = validateSystemRuntimeBinding(binding);
      if (errors.length) throw new Error(errors.join(' · '));
      bindings.push({ binding, path });
    } catch {
      issues.push({ reason_code: 'system-runtime-binding-invalid', ref: relative(root, path).replaceAll('\\', '/') });
    }
  }
  return bindings;
}

export function indexSystemRuntimeBindings(root, issues = []) {
  const bySystem = new Map();
  const ambiguous = new Set();
  for (const entry of listSystemRuntimeBindings(root, issues)) {
    const systemRef = entry.binding.system_ref;
    if (bySystem.has(systemRef)) {
      ambiguous.add(systemRef);
      bySystem.set(systemRef, { binding: null, path: null, ambiguous: true });
      issues.push({ reason_code: 'system-runtime-binding-ambiguous', ref: systemRef });
      continue;
    }
    if (!ambiguous.has(systemRef)) bySystem.set(systemRef, entry);
  }
  return bySystem;
}
