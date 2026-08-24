import { accessSync, constants, existsSync, readFileSync, unlinkSync } from 'node:fs';
import { delimiter, join } from 'node:path';
import { spawnSync as nodeSpawnSync } from 'node:child_process';

const COMMANDS = Object.freeze({
  'codex-cli': 'codex',
  'claude-code': 'claude',
});

const AUTH_COMMANDS = Object.freeze({
  'codex-cli': ['login', 'status'],
  'claude-code': ['auth', 'status'],
});

const CLAUDE_EFFORT = new Set(['low', 'medium', 'high', 'xhigh', 'max']);

function executableOnPath(command, env = process.env) {
  const suffixes = process.platform === 'win32'
    ? String(env.PATHEXT || '.EXE;.CMD;.BAT').split(';')
    : [''];
  for (const directory of String(env.PATH || '').split(delimiter).filter(Boolean)) {
    for (const suffix of suffixes) {
      const candidate = join(directory, `${command}${suffix}`);
      try {
        accessSync(candidate, constants.X_OK);
        return candidate;
      } catch {
        // Continue until a usable official client is found.
      }
    }
  }
  return null;
}

function processReason(result) {
  if (result?.error?.code === 'ETIMEDOUT' || result?.signal === 'SIGTERM') return 'executor-timeout';
  if (result?.error?.code === 'ENOENT') return 'executor-missing';
  return 'executor-failed';
}

export function observeExecutor(adapter, {
  spawn = nodeSpawnSync,
  env = process.env,
  now = new Date(),
  resolveCommand = executableOnPath,
} = {}) {
  const command = COMMANDS[adapter];
  if (!command) throw new Error('adapter não suportado');
  const executable = resolveCommand(command, env);
  if (!executable) return { status: 'missing', observed_at: now.toISOString() };

  const version = spawn(executable, ['--version'], {
    encoding: 'utf8', env, timeout: 10_000, windowsHide: true,
  });
  if (version.error?.code === 'ENOENT') return { status: 'missing', observed_at: now.toISOString() };
  if (version.status !== 0) return { status: 'degraded', observed_at: now.toISOString() };

  const auth = spawn(executable, AUTH_COMMANDS[adapter], {
    encoding: 'utf8', env, timeout: 15_000, windowsHide: true,
  });
  if (auth.error?.code === 'ENOENT') return { status: 'missing', observed_at: now.toISOString() };
  if (auth.status === 0) return { status: 'ready', observed_at: now.toISOString() };
  if (auth.status === 1) return { status: 'authentication-required', observed_at: now.toISOString() };
  return { status: 'degraded', observed_at: now.toISOString() };
}

export function createExecutorBinding({
  bindingId,
  adapter,
  hostRef,
  workspaceRef,
  workspacePath = '.',
  defaultModel,
  allowedModels = [],
  permissionProfile = 'read-only',
}, observation) {
  return {
    protocol_version: 1,
    binding_id: bindingId,
    adapter,
    host_ref: hostRef,
    workspace_ref: workspaceRef,
    workspace_path: workspacePath,
    auth: { type: 'provider-session', status: observation.status },
    model_policy: { default_model: defaultModel, allowed_models: allowedModels },
    permission_profile: permissionProfile,
    observed_at: observation.observed_at,
    privacy: { credential_stored: false, content_shared_with_inevita: false },
  };
}

function codexArgs(binding, routine, outputTempPath) {
  return [
    'exec', '--ephemeral', '--json',
    '-C', binding.workspace_path,
    '-s', routine.permission_mode,
    '-m', routine.executor.requested_model,
    '-c', `model_reasoning_effort="${routine.executor.reasoning_effort}"`,
    '-o', outputTempPath,
    '-',
  ];
}

function claudeArgs(binding, routine) {
  if (!CLAUDE_EFFORT.has(routine.executor.reasoning_effort)) return null;
  const permissionMode = routine.permission_mode === 'workspace-write' ? 'acceptEdits' : 'plan';
  const allowedTools = routine.permission_mode === 'workspace-write'
    ? 'Read,Glob,Grep,Edit,Write'
    : 'Read,Glob,Grep';
  return [
    '-p',
    '--input-format', 'text',
    '--output-format', 'json',
    '--no-session-persistence',
    '--model', routine.executor.requested_model,
    '--effort', routine.executor.reasoning_effort,
    '--permission-mode', permissionMode,
    '--allowedTools', allowedTools,
  ];
}

export function runModelExecutor(binding, routine, prompt, {
  spawn = nodeSpawnSync,
  env = process.env,
  outputTempPath,
} = {}) {
  const command = COMMANDS[binding.adapter];
  if (!command) return { ok: false, reason_code: 'executor-adapter-unsupported' };
  if (binding.auth.status !== 'ready') return { ok: false, reason_code: `executor-${binding.auth.status}` };
  if (typeof prompt !== 'string' || prompt.length === 0) return { ok: false, reason_code: 'prompt-empty' };

  let args;
  if (binding.adapter === 'codex-cli') {
    if (!outputTempPath) return { ok: false, reason_code: 'executor-output-path-missing' };
    args = codexArgs(binding, routine, outputTempPath);
  } else {
    args = claudeArgs(binding, routine);
    if (args === null) return { ok: false, reason_code: 'reasoning-effort-unsupported' };
  }

  let result;
  try {
    result = spawn(command, args, {
      cwd: binding.workspace_path,
      input: prompt,
      encoding: 'utf8',
      env,
      timeout: routine.operations.timeout_seconds * 1000,
      maxBuffer: 4 * 1024 * 1024,
      windowsHide: true,
    });
  } catch {
    return { ok: false, reason_code: 'executor-failed' };
  }
  if (result.status !== 0 || result.error) {
    if (binding.adapter === 'codex-cli') {
      try { unlinkSync(outputTempPath); } catch { /* No persisted provider scratch. */ }
    }
    return { ok: false, reason_code: processReason(result) };
  }

  if (binding.adapter === 'codex-cli') {
    try {
      if (!existsSync(outputTempPath)) return { ok: false, reason_code: 'executor-output-invalid' };
      const output = readFileSync(outputTempPath, 'utf8');
      if (!output.trim()) return { ok: false, reason_code: 'executor-output-invalid' };
      return { ok: true, reason_code: 'executor-completed', output };
    } catch {
      return { ok: false, reason_code: 'executor-output-invalid' };
    } finally {
      try { unlinkSync(outputTempPath); } catch { /* No persisted provider scratch. */ }
    }
  }

  try {
    const parsed = JSON.parse(String(result.stdout || ''));
    if (typeof parsed.result !== 'string' || !parsed.result.trim()) {
      return { ok: false, reason_code: 'executor-output-invalid' };
    }
    return { ok: true, reason_code: 'executor-completed', output: parsed.result };
  } catch {
    return { ok: false, reason_code: 'executor-output-invalid' };
  }
}

export const SUPPORTED_EXECUTOR_ADAPTERS = Object.freeze(Object.keys(COMMANDS));
