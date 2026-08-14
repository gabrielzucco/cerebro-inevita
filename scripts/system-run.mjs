#!/usr/bin/env node
import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = process.env.CEREBRO_INSTALL_ROOT
  ? resolve(process.env.CEREBRO_INSTALL_ROOT)
  : resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BRIEF_SCRIPT = join(dirname(fileURLToPath(import.meta.url)), 'generate-operating-brief.mjs');
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
    state.system_id || slug,
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

function refreshBrief() {
  spawnSync(process.execPath, [BRIEF_SCRIPT], {
    cwd: ROOT,
    env: { ...process.env, CEREBRO_INSTALL_ROOT: ROOT },
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
  refreshBrief();
  console.log(`✓ run iniciado: ${run.id}`);
  process.exit(0);
}

// First value NÃO deriva de run aprovado: exige confirmação explícita de que o responsável
// usaria/usou o artefato na operação real. Run de configuração aprovado nunca conta como valor.
if (action === 'confirm-value') {
  if (state.status !== 'active') fail(`confirme valor depois de um run aprovado (estado atual: ${state.status})`);
  if (state.first_value_confirmed) {
    console.log('✓ first value já estava confirmado');
    process.exit(0);
  }
  const now = new Date().toISOString();
  const run = state.last_run || { id: '', eval_version: '' };
  const next = {
    ...state,
    first_value_confirmed: true,
    first_value_at: now,
    updated_at: now,
  };
  save(statePath, next);
  ping('system_value_confirmed', next, run, ['--eval-passed=true', '--human-decision=approved']);
  refreshBrief();
  console.log('✓ first value confirmado pelo responsável');
  process.exit(0);
}

if (action !== 'complete') fail('ação válida: show, start, complete ou confirm-value');
if (state.current_run?.status !== 'started') fail('não há run iniciado para concluir');

const evalResult = option('eval');
const decision = option('decision');
if (!EVAL_RESULTS.has(evalResult)) fail('informe --eval=pass ou --eval=fail');
if (!DECISIONS.has(decision)) {
  fail('informe --decision=approved, --decision=changes_requested ou --decision=rejected');
}
// Sistema que declara recibo E0–E7 só fecha eval=pass com recibo PREENCHIDO — existir não basta:
// caminho em operacao/execucoes, run atual referenciado, E0–E7 presentes, zero placeholders,
// E5 aprovado e decisão coerente com o comando.
const receiptOption = option('receipt');
if (evalResult === 'pass'
  && existsSync(join(ROOT, 'sistemas', 'outros-instalados', slug, 'recibo-evals.template.md'))) {
  if (!receiptOption) fail('este sistema exige recibo E0–E7: informe --receipt=<recibo preenchido>');
  const receiptPath = resolve(ROOT, receiptOption);
  if (!receiptPath.startsWith(join(ROOT, 'operacao', 'execucoes') + '/')) {
    fail('o recibo preenchido mora em operacao/execucoes/ — o template do pacote não é recibo');
  }
  if (!existsSync(receiptPath)) fail(`recibo não encontrado: ${receiptOption}`);
  // Linhas de citação ("> ...") são instrução herdada do template, não conteúdo do recibo —
  // sem isso, seguir "copie este template" ao pé da letra produz um recibo inválido.
  const receipt = readFileSync(receiptPath, 'utf8')
    .split('\n')
    .filter((line) => !line.trimStart().startsWith('>'))
    .join('\n');
  const problems = [];
  if (!receipt.includes(state.current_run.id)) problems.push(`não referencia o run atual ${state.current_run.id}`);
  for (const dim of ['E0', 'E1', 'E2', 'E3', 'E4', 'E5', 'E6', 'E7']) {
    if (!receipt.includes(dim)) problems.push(`dimensão ausente: ${dim}`);
  }
  if (receipt.includes('<run-id>') || receipt.includes('·')) {
    problems.push('contém placeholders do template (escolha "·" não resolvida)');
  }
  const e5Line = receipt.split('\n').find((line) => line.includes('E5'));
  if (!e5Line || !e5Line.includes('passou') || e5Line.includes('falhou')) {
    problems.push('E5 (segurança e fronteira) precisa estar explicitamente aprovado');
  }
  if (!receipt.includes(decision)) problems.push(`decisão do recibo não bate com --decision=${decision}`);
  if (problems.length > 0) fail(`recibo E0–E7 inválido: ${problems.join(' · ')}`);
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
const firstValueConfirmed = Boolean(state.first_value_confirmed);
const nextStatus = passed && approved ? 'active' : 'needs_attention';
const next = {
  ...state,
  status: nextStatus,
  current_run: null,
  last_run: run,
  run_count: runCount,
  approved_run_count: approvedRunCount,
  first_value_confirmed: firstValueConfirmed,
  first_value_at: state.first_value_at || null,
  repeated_use_at: state.repeated_use_at
    || (firstValueConfirmed && passed && approved && runCount > 1 ? now : null),
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
  if (state.status !== 'active') ping('system_activated', next, run);
} else {
  ping('system_needs_attention', next, run, [
    `--reason-code=${passed ? 'human_changes_requested' : 'eval_failed'}`,
  ]);
}

refreshBrief();
console.log(`✓ run ${run.id} concluído · eval=${evalResult} · decisão=${decision}`);
