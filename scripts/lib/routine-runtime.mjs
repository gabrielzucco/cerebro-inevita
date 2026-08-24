import { randomUUID } from 'node:crypto';
import { spawnSync as nodeSpawnSync } from 'node:child_process';
import {
  closeSync,
  existsSync,
  mkdirSync,
  openSync,
  readFileSync,
  renameSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { dirname, relative, resolve, sep } from 'node:path';
import { checkAccess } from './access-runtime.mjs';
import { appendCompletedRunRecord, prepareContextSnapshot } from './context-snapshot-runtime.mjs';
import { runModelExecutor } from './model-executors.mjs';
import {
  createSlotKey,
  completeRoutineMigration,
  executorBindingPath,
  listRoutineContracts,
  listRoutineRunReceipts,
  loadExecutorBinding,
  loadCollectorBinding,
  loadRoutineContract,
  loadRoutineState,
  readRoutineRunReceipt,
  routineMigrationBlocker,
  routineOutputDirectory,
  routineStatePath,
  safeRoutineDestination,
  saveRoutineState,
  scheduledSlotsBetween,
  writeRoutineRunReceipt,
} from './routine-protocol.mjs';
import { safeRelativePath } from './system-protocol.mjs';

const UNAVAILABLE_SECRET_PROVIDER = Object.freeze({
  available: false,
  status: () => ({ reason_code: 'secret-provider-unavailable' }),
});
const LOCAL_REF_RE = /^(?!\.?\.?$)(?!\.?\.?\/)(?!.*\/\.\.(?:\/|$))[A-Za-z0-9.][A-Za-z0-9_./:-]{0,255}$/;
const MAX_SUPPLEMENTAL_PROMPT_CHARS = 8 * 1024;

function clockValue(clock) {
  const value = typeof clock === 'function' ? clock() : clock;
  const date = value instanceof Date ? new Date(value) : new Date(value || Date.now());
  if (!Number.isFinite(date.getTime())) throw new Error('relógio inválido');
  return date;
}

function referencePath(root, absolute) {
  return relative(resolve(root), absolute).replaceAll('\\', '/');
}

function permissionAllows(profile, requested) {
  return profile === 'workspace-write' || requested === 'read-only';
}

function buildReceipt(contract, binding, {
  runId,
  receiptId,
  trigger,
  slotKey,
  scheduledFor,
  attempts,
  status,
  reasonCode,
  startedAt,
  completedAt,
  outputRef = null,
  accessReceiptRefs = [],
  preparationInputRefs = [],
  supplementalInputRefs = [],
}) {
  return {
    protocol_version: 1,
    receipt_id: receiptId,
    run_id: runId,
    routine_ref: `routine:${contract.routine_id}:${contract.version}`,
    routine_id: contract.routine_id,
    routine_version: contract.version,
    system_ref: contract.system_ref,
    binding_ref: binding.binding_id,
    adapter: binding.adapter,
    requested_model: contract.executor.requested_model,
    model_observation: 'requested-not-verified',
    trigger,
    slot_key: slotKey,
    scheduled_for: scheduledFor,
    attempts,
    status,
    reason_code: reasonCode,
    started_at: startedAt.toISOString(),
    completed_at: completedAt.toISOString(),
    input_refs: [
      contract.context.prompt_ref,
      ...preparationInputRefs,
      ...supplementalInputRefs,
      ...contract.context.access_requests.map((request) => `source:${request.source_ref}`),
    ],
    output_ref: outputRef,
    access_receipt_refs: accessReceiptRefs,
    content_shared_with_provider: attempts > 0,
    privacy: {
      content_shared_with_inevita: false,
      prompt_recorded: false,
      output_recorded: false,
      raw_error_recorded: false,
    },
  };
}

function recordTerminal(root, contract, binding, context) {
  return writeRoutineRunReceipt(root, buildReceipt(contract, binding, context));
}

function acquireRoutineLock(root, routineId, timeoutSeconds, now) {
  const lockPath = `${routineStatePath(root, routineId)}.lock`;
  mkdirSync(dirname(lockPath), { recursive: true });
  try {
    const descriptor = openSync(lockPath, 'wx', 0o600);
    writeFileSync(descriptor, `${now.toISOString()}\n`);
    closeSync(descriptor);
    return { acquired: true, path: lockPath };
  } catch (error) {
    if (error?.code !== 'EEXIST') throw error;
    const staleAfter = (timeoutSeconds + 60) * 1000;
    try {
      if (now.getTime() - statSync(lockPath).mtimeMs > staleAfter) {
        unlinkSync(lockPath);
        return acquireRoutineLock(root, routineId, timeoutSeconds, now);
      }
    } catch (statError) {
      if (statError?.code === 'ENOENT') return acquireRoutineLock(root, routineId, timeoutSeconds, now);
      throw statError;
    }
    return { acquired: false, path: lockPath };
  }
}

function releaseRoutineLock(lock) {
  if (!lock?.acquired) return;
  try { unlinkSync(lock.path); } catch { /* Another failure cannot make content less private. */ }
}

function assertPlacement(contract, binding) {
  if (binding.host_ref !== contract.placement.host_ref) throw new Error('executor-host-mismatch');
  if (binding.workspace_ref !== contract.placement.workspace_ref) throw new Error('executor-workspace-mismatch');
  if (!permissionAllows(binding.permission_profile, contract.permission_mode)) throw new Error('executor-permission-insufficient');
  const allowed = binding.model_policy.allowed_models;
  if (allowed.length > 0 && !allowed.includes(contract.executor.requested_model)) throw new Error('executor-model-not-allowed');
}

function resolveExecutorWorkspace(root, binding) {
  const brainRoot = resolve(root);
  const absolute = resolve(root, binding.workspace_path);
  const rel = relative(brainRoot, absolute);
  if (absolute !== brainRoot && (rel.startsWith('..') || rel.startsWith(sep))) {
    throw new Error('executor-workspace-outside-brain');
  }
  try {
    if (!statSync(absolute).isDirectory()) throw new Error('executor-workspace-missing');
  } catch {
    throw new Error('executor-workspace-missing');
  }
  return absolute;
}

function prepareRoutineInput(root, contract, workspacePath, startedAt, {
  spawnCollector = nodeSpawnSync,
  env = process.env,
} = {}) {
  const preparation = contract.extensions?.preparation;
  if (!preparation) return { ok: true, input_refs: [] };
  let binding;
  try {
    binding = loadCollectorBinding(root, preparation.binding_ref).binding;
  } catch {
    return { ok: false, reason_code: 'collector-binding-missing', input_refs: [] };
  }
  if (binding.status !== 'ready') return { ok: false, reason_code: `collector-${binding.status}`, input_refs: [] };
  if (binding.workspace_ref !== contract.placement.workspace_ref) {
    return { ok: false, reason_code: 'collector-workspace-mismatch', input_refs: [] };
  }
  const collectorWorkspace = resolve(root, binding.workspace_path);
  if (collectorWorkspace !== workspacePath) return { ok: false, reason_code: 'collector-workspace-mismatch', input_refs: [] };
  if (binding.output_ref !== preparation.output_ref) return { ok: false, reason_code: 'collector-output-mismatch', input_refs: [] };
  let outputRef;
  try {
    outputRef = safeRelativePath(root, binding.output_ref);
  } catch {
    return { ok: false, reason_code: 'collector-output-invalid', input_refs: [] };
  }
  let result;
  try {
    result = spawnCollector(binding.executable, binding.args, {
      cwd: collectorWorkspace,
      encoding: 'utf8',
      env,
      timeout: binding.timeout_seconds * 1000,
      maxBuffer: 2 * 1024 * 1024,
      windowsHide: true,
    });
  } catch {
    return { ok: false, reason_code: 'collector-failed', input_refs: [] };
  }
  if (result?.error?.code === 'ETIMEDOUT' || result?.signal === 'SIGTERM') {
    return { ok: false, reason_code: 'collector-timeout', input_refs: [] };
  }
  if (result?.status !== 0 || result?.error) return { ok: false, reason_code: 'collector-failed', input_refs: [] };
  try {
    const output = statSync(resolve(root, outputRef));
    if (!output.isFile() || output.mtimeMs + 1000 < startedAt.getTime()) {
      return { ok: false, reason_code: 'collector-output-stale', input_refs: [] };
    }
  } catch {
    return { ok: false, reason_code: 'collector-output-missing', input_refs: [] };
  }
  return { ok: true, input_refs: [`collector-output:${outputRef}`] };
}

function runDestination(root, contract, runId) {
  if (contract.destination.kind === 'runtime-output') {
    const absolute = resolve(routineOutputDirectory(root), `${runId}.md`);
    return { absolute, ref: referencePath(root, absolute) };
  }
  const ref = safeRoutineDestination(root, contract.destination.ref);
  return { absolute: resolve(root, ref), ref };
}

function writePrivateOutput(path, content) {
  mkdirSync(dirname(path), { recursive: true });
  const temporary = `${path}.tmp`;
  writeFileSync(temporary, content, { encoding: 'utf8', mode: 0o600 });
  renameSync(temporary, path);
}

function existingScheduledReceipt(root, routineId, slotKey) {
  return listRoutineRunReceipts(root, routineId)
    .find((receipt) => receipt.slot_key === slotKey && receipt.status === 'completed') || null;
}

function grantId(grantRef) {
  return grantRef.startsWith('access-grant:') ? grantRef.slice('access-grant:'.length) : grantRef;
}

function evaluateRoutineAccess(root, contract, now, provider) {
  const refs = [];
  const results = [];
  for (const request of contract.context.access_requests) {
    let result;
    try {
      result = checkAccess(root, grantId(request.grant_ref), {
        subject_ref: contract.system_ref,
        system_ref: contract.system_ref,
        source_ref: request.source_ref,
        action: request.action,
        mode: request.mode,
      }, provider, { now });
    } catch {
      return { ok: false, reason_code: 'access-check-failed', receipt_refs: refs, results };
    }
    refs.push(result.receipt_ref);
    results.push({
      source_ref: request.source_ref,
      assurance: result.assurance,
      decision: result.decision,
      receipt_ref: result.receipt_ref,
    });
    if (!['allowed', 'file-only'].includes(result.decision)) {
      return { ok: false, reason_code: result.reason_code, receipt_refs: refs, results };
    }
    if (result.assurance === 'runtime-enforced') {
      return { ok: false, reason_code: 'runtime-connector-not-bound', receipt_refs: refs, results };
    }
  }
  return { ok: true, receipt_refs: refs, results };
}

export async function runRoutine(root, routineId, {
  trigger = 'manual',
  scheduledFor = null,
  spawn,
  spawnCollector,
  env = process.env,
  clock = () => new Date(),
  wait = (milliseconds) => new Promise((resolveWait) => setTimeout(resolveWait, milliseconds)),
  secretProvider = UNAVAILABLE_SECRET_PROVIDER,
  supplementalPrompt = '',
  supplementalInputRefs = [],
} = {}) {
  const { contract } = loadRoutineContract(root, routineId);
  const startedAt = clockValue(clock);
  const scheduledDate = trigger === 'schedule' ? new Date(scheduledFor) : null;
  if (trigger === 'schedule' && !Number.isFinite(scheduledDate.getTime())) throw new Error('scheduled_for inválido');
  const scheduledIso = trigger === 'schedule' ? scheduledDate.toISOString() : null;
  const slotKey = createSlotKey(routineId, trigger, scheduledIso);
  const runId = `routine-run-${randomUUID()}`;
  const receiptId = `routine-receipt-${randomUUID()}`;
  if (typeof supplementalPrompt !== 'string' || supplementalPrompt.length > MAX_SUPPLEMENTAL_PROMPT_CHARS
    || /\u0000|\r/.test(supplementalPrompt)) throw new Error('supplemental-prompt-invalid');
  if (!Array.isArray(supplementalInputRefs)
    || supplementalInputRefs.some((ref) => !LOCAL_REF_RE.test(ref || ''))) {
    throw new Error('supplemental-input-refs-invalid');
  }
  if (Boolean(supplementalPrompt) !== Boolean(supplementalInputRefs.length)) {
    throw new Error('supplemental-context-incomplete');
  }
  if (supplementalPrompt && trigger !== 'manual') throw new Error('supplemental-context-manual-only');
  const base = {
    runId, receiptId, trigger, slotKey, scheduledFor: scheduledIso, startedAt, supplementalInputRefs,
  };

  if (trigger === 'schedule') {
    const existing = existingScheduledReceipt(root, routineId, slotKey);
    if (existing) return { status: 'no-change', receipt: existing, receipt_ref: `routine-receipt:${existing.receipt_id}` };
  }

  let binding;
  try {
    binding = loadExecutorBinding(root, contract.executor.binding_ref).binding;
  } catch {
    const unresolved = { binding_id: contract.executor.binding_ref, adapter: 'unresolved' };
    const recorded = recordTerminal(root, contract, unresolved, {
      ...base, attempts: 0, status: 'denied', reasonCode: 'executor-binding-missing',
      completedAt: clockValue(clock),
    });
    return { status: 'denied', receipt: recorded.value, receipt_ref: recorded.ref };
  }

  const deny = (reasonCode, accessReceiptRefs = []) => {
    const recorded = recordTerminal(root, contract, binding, {
      ...base, attempts: 0, status: 'denied', reasonCode,
      completedAt: clockValue(clock), accessReceiptRefs,
    });
    return { status: 'denied', receipt: recorded.value, receipt_ref: recorded.ref };
  };

  if (contract.lifecycle !== 'approved') return deny('routine-not-approved');
  if (Date.parse(contract.approval.approved_at) > startedAt.getTime()) return deny('routine-approval-not-active');
  if (binding.auth.status !== 'ready') return deny(`executor-${binding.auth.status}`);
  let workspacePath;
  try {
    assertPlacement(contract, binding);
    workspacePath = resolveExecutorWorkspace(root, binding);
  } catch (error) {
    return deny(error instanceof Error ? error.message : 'executor-binding-invalid');
  }
  if (trigger === 'schedule') {
    const { state } = loadRoutineState(root, routineId);
    if (state.status !== 'active') return deny(state.status === 'paused' ? 'routine-paused' : 'routine-not-active');
  }

  const lock = acquireRoutineLock(root, routineId, contract.operations.timeout_seconds, startedAt);
  if (!lock.acquired) {
    const recorded = recordTerminal(root, contract, binding, {
      ...base, attempts: 0, status: 'skipped', reasonCode: 'routine-already-running',
      completedAt: clockValue(clock),
    });
    return { status: 'skipped', receipt: recorded.value, receipt_ref: recorded.ref };
  }

  try {
    const access = evaluateRoutineAccess(root, contract, startedAt, secretProvider);
    if (!access.ok) return deny(access.reason_code, access.receipt_refs);

    let destination;
    try {
      destination = runDestination(root, contract, runId);
    } catch {
      return deny('destination-not-private', access.receipt_refs);
    }

    const preparation = prepareRoutineInput(root, contract, workspacePath, startedAt, {
      spawnCollector, env,
    });
    if (!preparation.ok) {
      const recorded = recordTerminal(root, contract, binding, {
        ...base,
        attempts: 0,
        status: 'failed',
        reasonCode: preparation.reason_code,
        completedAt: clockValue(clock),
        accessReceiptRefs: access.receipt_refs,
      });
      return { status: 'failed', receipt: recorded.value, receipt_ref: recorded.ref };
    }

    let runContext = { status: 'not-declared', input_refs: [] };
    if (contract.extensions?.preparation?.source_selections) {
      try {
        runContext = prepareContextSnapshot(root, contract, access.results);
      } catch (error) {
        const recorded = recordTerminal(root, contract, binding, {
          ...base,
          attempts: 0,
          status: 'failed',
          reasonCode: error instanceof Error ? error.message : 'context-snapshot-failed',
          completedAt: clockValue(clock),
          accessReceiptRefs: access.receipt_refs,
          preparationInputRefs: preparation.input_refs,
        });
        return { status: 'failed', receipt: recorded.value, receipt_ref: recorded.ref };
      }
    }
    const governedInputRefs = [...preparation.input_refs, ...runContext.input_refs];

    let prompt;
    try {
      const promptRef = safeRelativePath(root, contract.context.prompt_ref, { mustExist: true });
      prompt = readFileSync(resolve(root, promptRef), 'utf8');
      if (!prompt.trim()) return deny('prompt-empty', access.receipt_refs);
      prompt += supplementalPrompt;
    } catch {
      return deny('prompt-read-failed', access.receipt_refs);
    }

    const executorBinding = { ...binding, workspace_path: workspacePath };
    mkdirSync(routineOutputDirectory(root), { recursive: true });
    const outputTempPath = resolve(routineOutputDirectory(root), `.provider-${runId}.tmp`);
    let execution = { ok: false, reason_code: 'executor-failed' };
    let attempts = 0;
    let lastFailure = null;
    for (let attempt = 1; attempt <= contract.operations.retry.max_attempts; attempt += 1) {
      attempts = attempt;
      execution = runModelExecutor(executorBinding, contract, prompt, {
        spawn, env, outputTempPath,
      });
      if (execution.ok) break;
      lastFailure = recordTerminal(root, contract, binding, {
        ...base,
        receiptId: `routine-receipt-${randomUUID()}`,
        attempts: attempt,
        status: 'failed',
        reasonCode: execution.reason_code,
        completedAt: clockValue(clock),
        accessReceiptRefs: access.receipt_refs,
        preparationInputRefs: governedInputRefs,
      });
      if (attempt < contract.operations.retry.max_attempts) {
        await wait(contract.operations.retry.backoff_seconds * 1000);
      }
    }

    if (!execution.ok) {
      return { status: 'failed', receipt: lastFailure.value, receipt_ref: lastFailure.ref };
    }

    try {
      writePrivateOutput(destination.absolute, execution.output);
    } catch {
      const recorded = recordTerminal(root, contract, binding, {
        ...base, attempts, status: 'failed', reasonCode: 'destination-write-failed',
        completedAt: clockValue(clock), accessReceiptRefs: access.receipt_refs,
        preparationInputRefs: governedInputRefs,
      });
      return { status: 'failed', receipt: recorded.value, receipt_ref: recorded.ref };
    }

    const completedAt = clockValue(clock);
    try {
      appendCompletedRunRecord(root, contract, runContext, {
        runId,
        receiptId,
        startedAt,
        completedAt,
        outputRef: destination.ref,
        accessReceiptRefs: access.receipt_refs,
        correctionRef: supplementalInputRefs.find((ref) => ref.startsWith('judgment-receipt:')) || null,
      });
    } catch {
      const recorded = recordTerminal(root, contract, binding, {
        ...base, attempts, status: 'failed', reasonCode: 'context-record-failed',
        completedAt, outputRef: destination.ref,
        accessReceiptRefs: access.receipt_refs,
        preparationInputRefs: governedInputRefs,
      });
      return { status: 'failed', receipt: recorded.value, receipt_ref: recorded.ref };
    }

    const recorded = recordTerminal(root, contract, binding, {
      ...base, attempts, status: 'completed', reasonCode: 'executor-completed',
      completedAt, outputRef: destination.ref,
      accessReceiptRefs: access.receipt_refs,
      preparationInputRefs: governedInputRefs,
    });
    return { status: 'completed', receipt: recorded.value, receipt_ref: recorded.ref };
  } finally {
    releaseRoutineLock(lock);
  }
}

export function activateRoutine(root, routineId, evidenceReceiptRef, approvedBy, {
  clock = () => new Date(),
} = {}) {
  const { contract } = loadRoutineContract(root, routineId);
  if (contract.lifecycle !== 'approved') throw new Error('routine-not-approved');
  if (contract.trigger.type !== 'schedule') throw new Error('routine-manual-does-not-activate');
  if (Date.parse(contract.approval.approved_at) > clockValue(clock).getTime()) throw new Error('routine-approval-not-active');
  const evidence = readRoutineRunReceipt(root, evidenceReceiptRef);
  if (evidence.routine_id !== routineId || evidence.routine_version !== contract.version
    || evidence.trigger !== 'manual' || evidence.status !== 'completed') {
    throw new Error('activation-evidence-invalid');
  }
  const migrationBlocker = routineMigrationBlocker(root, routineId);
  if (migrationBlocker) throw new Error(migrationBlocker);
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(approvedBy || '')) throw new Error('approved_by inválido');
  const now = clockValue(clock).toISOString();
  const state = {
    ...loadRoutineState(root, routineId).state,
    status: 'active',
    activated_at: now,
    activated_by: approvedBy,
    activation_evidence_ref: evidenceReceiptRef,
    paused_at: null,
    paused_by: null,
    last_checked_at: now,
  };
  saveRoutineState(root, state);
  completeRoutineMigration(root, routineId, evidenceReceiptRef, { clock });
  return state;
}

export function pauseRoutine(root, routineId, approvedBy, { clock = () => new Date() } = {}) {
  loadRoutineContract(root, routineId);
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(approvedBy || '')) throw new Error('approved_by inválido');
  const current = loadRoutineState(root, routineId).state;
  if (current.status === 'disabled') throw new Error('routine-not-active');
  if (current.status === 'paused') return current;
  const state = {
    ...current,
    status: 'paused',
    paused_at: clockValue(clock).toISOString(),
    paused_by: approvedBy,
  };
  saveRoutineState(root, state);
  return state;
}

export function resumeRoutine(root, routineId, approvedBy, { clock = () => new Date() } = {}) {
  loadRoutineContract(root, routineId);
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(approvedBy || '')) throw new Error('approved_by inválido');
  const current = loadRoutineState(root, routineId).state;
  if (current.status !== 'paused') throw new Error('routine-not-paused');
  const migrationBlocker = routineMigrationBlocker(root, routineId);
  if (migrationBlocker) throw new Error(migrationBlocker);
  const now = clockValue(clock).toISOString();
  const state = {
    ...current,
    status: 'active',
    paused_at: null,
    paused_by: null,
    last_checked_at: now,
  };
  saveRoutineState(root, state);
  return state;
}

export function dueSlots(contract, state, now = new Date()) {
  if (contract.trigger.type !== 'schedule' || state.status !== 'active') return [];
  const until = clockValue(now);
  const after = new Date(state.last_checked_at || state.activated_at || until);
  const slots = scheduledSlotsBetween(contract.trigger.schedule, after, until);
  if (slots.length === 0) return [];
  if (contract.trigger.schedule.missed_run_policy === 'run-on-wake') return [slots.at(-1)];
  return until.getTime() - Date.parse(slots.at(-1)) < 60_000 ? [slots.at(-1)] : [];
}

export async function tickRoutines(root, options = {}) {
  const now = clockValue(options.clock || (() => new Date()));
  const results = [];
  for (const contract of listRoutineContracts(root)) {
    const loaded = loadRoutineState(root, contract.routine_id);
    const slots = dueSlots(contract, loaded.state, now);
    const routineResults = [];
    for (const scheduledFor of slots) {
      const result = await runRoutine(root, contract.routine_id, {
        ...options, trigger: 'schedule', scheduledFor,
      });
      routineResults.push(result);
      results.push(result);
    }
    if (loaded.state.status === 'active') {
      const latestReceipt = routineResults.at(-1)?.receipt;
      saveRoutineState(root, {
        ...loadRoutineState(root, contract.routine_id).state,
        last_checked_at: now.toISOString(),
        last_scheduled_for: slots.at(-1) || loaded.state.last_scheduled_for,
        last_receipt_ref: latestReceipt?.routine_id === contract.routine_id
          ? `routine-receipt:${latestReceipt.receipt_id}`
          : loaded.state.last_receipt_ref,
      });
    }
  }
  return results;
}

export function executorBindingExists(root, bindingId) {
  return existsSync(executorBindingPath(root, bindingId));
}
