#!/usr/bin/env node

import { resolve } from 'node:path';
import { createExecutorBinding, observeExecutor, SUPPORTED_EXECUTOR_ADAPTERS } from './lib/model-executors.mjs';
import {
  listRoutineContracts,
  listRoutineRunReceipts,
  loadExecutorBinding,
  loadRoutineContract,
  loadRoutineState,
  registerRoutineContract,
  saveExecutorBinding,
} from './lib/routine-protocol.mjs';
import {
  activateRoutine,
  dueSlots,
  pauseRoutine,
  resumeRoutine,
  runRoutine,
  tickRoutines,
} from './lib/routine-runtime.mjs';
import { ensureBrain, readJson } from './lib/system-protocol.mjs';

function fail(message, code = 1) {
  console.error(`✗ ${message}`);
  process.exit(code);
}

function option(name) {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length) || '';
}

function confirm(action) {
  if (!process.argv.includes('--confirm')) fail(`${action} exige --confirm`);
}

function present(value) {
  console.log(JSON.stringify(value, null, 2));
}

const root = resolve(process.env.CEREBRO_INSTALL_ROOT || process.cwd());
const positional = process.argv.slice(2).filter((arg) => !arg.startsWith('--'));
const [action = 'status', target = ''] = positional;

try {
  ensureBrain(root);
  if (action === 'install') {
    confirm('instalação');
    if (!target) fail('informe o caminho do Routine Contract');
    const result = registerRoutineContract(root, readJson(resolve(root, target), target));
    present({ status: result.status, routine_ref: result.ref });
    process.exit(0);
  }
  if (action === 'binding') {
    confirm('criação do binding');
    if (!target) fail('informe binding_id');
    const adapter = option('adapter');
    if (!SUPPORTED_EXECUTOR_ADAPTERS.includes(adapter)) fail(`adapter válido: ${SUPPORTED_EXECUTOR_ADAPTERS.join(' ou ')}`);
    const observation = observeExecutor(adapter);
    const value = createExecutorBinding({
      bindingId: target,
      adapter,
      hostRef: option('host'),
      workspaceRef: option('workspace-ref'),
      workspacePath: option('workspace') || '.',
      defaultModel: option('model'),
      allowedModels: option('allowed-models').split(',').filter(Boolean),
      permissionProfile: option('permission') || 'read-only',
    }, observation);
    const saved = saveExecutorBinding(root, value);
    present({ status: saved.status, binding_ref: saved.ref, auth_status: value.auth.status });
    process.exit(0);
  }
  if (action === 'binding-refresh') {
    confirm('refresh do binding');
    if (!target) fail('informe binding_id');
    const current = loadExecutorBinding(root, target).binding;
    const observation = observeExecutor(current.adapter);
    const saved = saveExecutorBinding(root, {
      ...current,
      auth: { type: 'provider-session', status: observation.status },
      observed_at: observation.observed_at,
    }, { replace: true });
    present({ status: saved.status, binding_ref: saved.ref, auth_status: observation.status });
    process.exit(0);
  }
  if (action === 'show') {
    if (!target) fail('informe routine_id');
    present({
      contract: loadRoutineContract(root, target).contract,
      state: loadRoutineState(root, target).state,
      receipts: listRoutineRunReceipts(root, target),
    });
    process.exit(0);
  }
  if (action === 'status') {
    const contracts = target ? [loadRoutineContract(root, target).contract] : listRoutineContracts(root);
    present(contracts.map((contract) => ({
      routine_id: contract.routine_id,
      lifecycle: contract.lifecycle,
      trigger: contract.trigger.type,
      binding_ref: contract.executor.binding_ref,
      runtime: loadRoutineState(root, contract.routine_id).state,
    })));
    process.exit(0);
  }
  if (action === 'run') {
    confirm('execução manual');
    if (!target) fail('informe routine_id');
    const result = await runRoutine(root, target, { trigger: 'manual' });
    present({ status: result.status, receipt_ref: result.receipt_ref, reason_code: result.receipt.reason_code });
    if (!['completed', 'no-change'].includes(result.status)) process.exitCode = 2;
    process.exit();
  }
  if (action === 'activate') {
    confirm('ativação');
    if (!target) fail('informe routine_id');
    const state = activateRoutine(root, target, option('evidence'), option('approved-by'));
    present(state);
    process.exit(0);
  }
  if (action === 'pause') {
    confirm('pausa');
    if (!target) fail('informe routine_id');
    present(pauseRoutine(root, target, option('approved-by')));
    process.exit(0);
  }
  if (action === 'resume') {
    confirm('retomada');
    if (!target) fail('informe routine_id');
    present(resumeRoutine(root, target, option('approved-by')));
    process.exit(0);
  }
  if (action === 'due') {
    const now = new Date();
    const contracts = target ? [loadRoutineContract(root, target).contract] : listRoutineContracts(root);
    present(contracts.map((contract) => ({
      routine_id: contract.routine_id,
      due_slots: dueSlots(contract, loadRoutineState(root, contract.routine_id).state, now),
    })));
    process.exit(0);
  }
  if (action === 'tick') {
    const results = await tickRoutines(root);
    present(results.map((result) => ({
      status: result.status,
      receipt_ref: result.receipt_ref,
      reason_code: result.receipt.reason_code,
    })));
    if (results.some((result) => !['completed', 'no-change'].includes(result.status))) process.exitCode = 2;
    process.exit();
  }
  fail('ação válida: install, binding, binding-refresh, show, status, run, activate, pause, resume, due ou tick');
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
}
