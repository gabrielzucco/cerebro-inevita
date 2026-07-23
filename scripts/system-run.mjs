#!/usr/bin/env node
import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = process.env.CEREBRO_INSTALL_ROOT
  ? resolve(process.env.CEREBRO_INSTALL_ROOT)
  : resolve(dirname(fileURLToPath(import.meta.url)), '..');
const slug = String(process.argv[2] || '').trim().toLowerCase();
const action = String(process.argv[3] || 'show').trim().toLowerCase();
const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,63}$/;
const DECISIONS = new Set(['approved', 'changes_requested', 'rejected']);
const EVAL_RESULTS = new Set(['pass', 'fail']);

function fail(message) {
  console.error(`✗ ${message}`);
  process.exit(1);
}

function option(name) {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length) ?? '';
}

function save(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
}

function ping(event, state, run, extra = []) {
  spawnSync(process.execPath, [
    join(ROOT, '.agents', 'scripts', 'ping.mjs'),
    event,
    slug,
    `--run-id=${run.id}`,
    `--release-version=${state.package_version || ''}`,
    `--eval-version=${run.eval_version || ''}`,
    ...extra,
  ], {
    cwd: ROOT,
    env: process.env,
    stdio: 'ignore',
    timeout: 2500,
  });
}

if (!SLUG_RE.test(slug)) fail('informe um system_id válido');
const statePath = join(ROOT, '.cerebro', 'sistemas', `${slug}.json`);
if (!existsSync(statePath)) fail('adicione e configure o pacote antes de iniciar um run');
const state = JSON.parse(readFileSync(statePath, 'utf8'));

if (action === 'show') {
  console.log(JSON.stringify(state, null, 2));
  process.exit(0);
}

if (action === 'start') {
  if (!['configuring', 'first_run', 'active'].includes(state.status)) {
    fail(`o sistema está em ${state.status}; configure ou resolva a atenção antes do run`);
  }
  if (state.current_run?.status === 'started') {
    console.log(`✓ run já iniciado: ${state.current_run.id}`);
    process.exit(0);
  }
  const now = new Date().toISOString();
  const run = {
    id: randomUUID(),
    status: 'started',
    started_at: now,
    eval_version: option('eval-version') || '0.1.0',
  };
  const next = {
    ...state,
    status: state.status === 'configuring' ? 'first_run' : state.status,
    current_run: run,
    updated_at: now,
  };
  save(statePath, next);
  ping('system_run_started', next, run);
  if (state.status === 'configuring') ping('system_first_run', next, run);
  console.log(`✓ run iniciado: ${run.id}`);
  process.exit(0);
}

if (action !== 'complete') fail('ação válida: show, start ou complete');
if (state.current_run?.status !== 'started') fail('não há run iniciado para concluir');

const evalResult = option('eval');
const decision = option('decision');
if (!EVAL_RESULTS.has(evalResult)) fail('informe --eval=pass ou --eval=fail');
if (!DECISIONS.has(decision)) {
  fail('informe --decision=approved, --decision=changes_requested ou --decision=rejected');
}
const durationValue = Number(option('duration-ms'));
const durationMs = Number.isInteger(durationValue) && durationValue >= 0
  ? Math.min(durationValue, 86_400_000)
  : Math.max(0, Date.now() - new Date(state.current_run.started_at).getTime());
const now = new Date().toISOString();
const passed = evalResult === 'pass';
const approved = decision === 'approved';
const run = {
  ...state.current_run,
  status: 'completed',
  completed_at: now,
  duration_ms: durationMs,
  eval_passed: passed,
  human_decision: decision,
};
const runCount = Number(state.run_count || 0) + 1;
const approvedRunCount = Number(state.approved_run_count || 0) + (passed && approved ? 1 : 0);
const firstValueConfirmed = Boolean(state.first_value_confirmed) || (passed && approved);
const nextStatus = passed && approved ? 'active' : 'needs_attention';
const next = {
  ...state,
  status: nextStatus,
  current_run: null,
  last_run: run,
  run_count: runCount,
  approved_run_count: approvedRunCount,
  first_value_confirmed: firstValueConfirmed,
  first_value_at: state.first_value_at || (passed && approved ? now : null),
  repeated_use_at: state.repeated_use_at || (passed && approved && runCount > 1 ? now : null),
  updated_at: now,
};
save(statePath, next);

const receiptDir = join(ROOT, 'operacao', 'execucoes');
mkdirSync(receiptDir, { recursive: true });
writeFileSync(join(receiptDir, `${run.id}-${slug}.md`), [
  `# Run de sistema — ${slug}`,
  '',
  `- run-id: ${run.id}`,
  `- versão: ${state.package_version || 'desconhecida'}`,
  `- começou: ${run.started_at}`,
  `- terminou: ${run.completed_at}`,
  `- duração-ms: ${run.duration_ms}`,
  `- eval: ${passed ? 'passou' : 'falhou'}`,
  `- decisão humana: ${decision}`,
  `- estado final: ${nextStatus}`,
  '- conteúdo enviado à INEVITA: não',
  '',
].join('\n'));

ping('system_run_completed', next, run, [
  `--eval-passed=${String(passed)}`,
  `--human-decision=${decision}`,
  `--duration-ms=${durationMs}`,
]);
if (passed && approved) {
  ping('system_value_confirmed', next, run, [
    '--eval-passed=true',
    '--human-decision=approved',
    `--duration-ms=${durationMs}`,
  ]);
  if (state.status !== 'active') ping('system_activated', next, run);
} else {
  ping('system_needs_attention', next, run, [
    `--reason-code=${passed ? 'human_changes_requested' : 'eval_failed'}`,
  ]);
}

console.log(`✓ run ${run.id} concluído · eval=${evalResult} · decisão=${decision}`);

