import { buildConsoleReadModel } from './console-read-model.mjs';

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

export function localInterfaceUrl(value) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' && LOCAL_HOSTS.has(url.hostname.toLowerCase()) ? url : null;
  } catch {
    return null;
  }
}

function result(status, reasonCode, clock, extra = {}) {
  return {
    status,
    reason_code: reasonCode,
    checked_at: clock().toISOString(),
    ...extra,
  };
}

export async function probeSystemInterface(interfaceRef, {
  fetchImpl = globalThis.fetch,
  timeoutMs = 800,
  clock = () => new Date(),
} = {}) {
  if (!interfaceRef) return result('not-declared', 'interface-ref-missing', clock, { checkable: false });

  let parsed;
  try { parsed = new URL(interfaceRef); } catch {
    return result('unavailable', 'interface-url-invalid', clock, { checkable: false });
  }
  if (!localInterfaceUrl(interfaceRef)) {
    return result('not-checkable', 'interface-healthcheck-restricted', clock, { checkable: false });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(parsed.href, {
      method: 'HEAD',
      redirect: 'manual',
      cache: 'no-store',
      signal: controller.signal,
    });
    if (response.status >= 500) {
      return result('unavailable', 'interface-http-error', clock, { checkable: true, http_status: response.status });
    }
    return result('available', 'interface-available', clock, { checkable: true, http_status: response.status });
  } catch (error) {
    const timedOut = controller.signal.aborted || error?.name === 'AbortError';
    return result('unavailable', timedOut ? 'interface-timeout' : 'interface-unreachable', clock, { checkable: true });
  } finally {
    clearTimeout(timeout);
  }
}

export async function systemInterfaceHealth(root, ref, options = {}) {
  const system = buildConsoleReadModel(root).systems.find((item) => item.system_id === ref || item.contract_id === ref);
  if (!system) throw new Error('not-found');
  const clock = options.clock || (() => new Date());
  if (['missing', 'degraded'].includes(system.runtime_binding_status)) {
    return result('not-installed', `system-runtime-binding-${system.runtime_binding_status}`, clock, { checkable: false });
  }
  if (system.interface_expected && !system.interface_ref) {
    return result('not-installed', 'system-runtime-binding-missing', clock, { checkable: false });
  }
  const timeoutCeilingMs = options.timeoutCeilingMs || 2000;
  const timeoutMs = Math.min(system.interface_health_timeout_ms || 800, timeoutCeilingMs);
  return probeSystemInterface(system.interface_ref, { ...options, timeoutMs, clock });
}
