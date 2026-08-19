#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import {
  chmodSync,
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  readJson,
  validateCapabilityContract,
  validateSystemContract,
} from './lib/system-protocol.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const COMMISSION = join(ROOT, 'scripts', 'commission-system.mjs');
const SYSTEM_RUN = join(ROOT, 'scripts', 'system-run.mjs');
const EXAMPLE = join(
  ROOT,
  '.claude',
  'skills',
  'sistematizar',
  'references',
  'jornada-ponta-a-ponta.example.json',
);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function write(path, content, mode = 0o644) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content, { mode });
  chmodSync(path, mode);
}

function json(path, value, mode = 0o600) {
  write(path, `${JSON.stringify(value, null, 2)}\n`, mode);
}

function exec(script, args, brain) {
  return spawnSync(process.execPath, [script, ...args], {
    cwd: ROOT,
    env: {
      ...process.env,
      CEREBRO_INSTALL_ROOT: brain,
      CEREBRO_TELEMETRY: 'off',
    },
    encoding: 'utf8',
    timeout: 15_000,
  });
}

function output(result) {
  return `${result.stdout || ''}\n${result.stderr || ''}`;
}

function expectStatus(result, status, label) {
  assert(result.status === status, `${label}: esperado status ${status}; recebido ${result.status}\n${output(result)}`);
}

function makeBrain({ activated = true, suffix = 'brain' } = {}) {
  const brain = mkdtempSync(join(tmpdir(), `cerebro-${suffix}-`));
  write(join(brain, 'VERSION'), '0.0.0\n');
  mkdirSync(join(brain, '.cerebro'), { recursive: true });
  mkdirSync(join(brain, 'sistemas', 'outros-instalados'), { recursive: true });
  write(join(brain, 'capturas', 'caso-recente.md'), '# Caso recente\n\nRastro autorizado e anonimizado.\n');
  write(join(brain, 'operacao', 'saida-jornada.md'), '# Jornada operacional\n\nPróxima ação aprovada.\n');
  if (activated) {
    json(join(brain, '.cerebro', 'concierge-runs', 'ativacao-jornada.json'), {
      protocol_version: 1,
      run_id: 'ativacao-jornada',
      milestones: { T0: true, T1: true, T2: true, T3: true, T4: true },
    });
  }
  return brain;
}

function specFor(brain, mutate = (value) => value) {
  const spec = mutate(JSON.parse(readFileSync(EXAMPLE, 'utf8')));
  const relative = join('operacao', 'arquitetura', `${spec.system_id}.commissioning-spec.json`);
  json(join(brain, relative), spec);
  return { relative, spec };
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

const brain = makeBrain({ suffix: 'commission-e2e' });
const { relative, spec } = specFor(brain);
const packageRoot = join(brain, 'sistemas', 'outros-instalados', spec.system_id);

const preview = exec(COMMISSION, [relative, `--brain=${brain}`], brain);
expectStatus(preview, 2, 'preview deliberadamente não grava');
assert(output(preview).includes('Nenhum arquivo foi criado.'), 'preview precisa declarar zero escrita');
assert(!existsSync(packageRoot), 'preview criou pacote indevidamente');

const commissioned = exec(COMMISSION, [relative, '--confirm', `--brain=${brain}`], brain);
expectStatus(commissioned, 0, 'comissionamento');
assert(output(commissioned).includes('fontes conectadas=0'), 'recibo não distinguiu fonte registrada de conectada');

const packageFiles = [
  'manifest.md',
  'capability.json',
  'contract.json',
  'configuracao.md',
  'pipeline.md',
  'rotinas.md',
  'skill-contract.md',
  'evals.md',
  'feedback.md',
  'changelog.md',
];
for (const name of packageFiles) assert(existsSync(join(packageRoot, name)), `pacote sem ${name}`);
assert((statSync(join(packageRoot, 'configuracao.md')).mode & 0o777) === 0o600, 'configuração não está privada');
assert((statSync(join(packageRoot, 'feedback.md')).mode & 0o777) === 0o600, 'feedback não está privado');

const capability = readJson(join(packageRoot, 'capability.json'));
const contract = readJson(join(packageRoot, 'contract.json'));
assert(validateCapabilityContract(capability).length === 0, 'capability contract inválido');
assert(validateSystemContract(contract).length === 0, 'System Contract inválido');
assert(contract.sources.every((source) => source.source_id === null), 'comissionamento conectou fonte sem autorização');

const statePath = join(brain, '.cerebro', 'sistemas', `${spec.system_id}.json`);
const initialState = readJson(statePath);
assert(initialState.status === 'configuring', 'estado inicial deveria ser configuring');
assert(initialState.connected_sources === 0, 'estado inicial deveria registrar zero conexões');
assert(readFileSync(join(brain, 'sistemas', 'outros-instalados', '_CATALOGO.md'), 'utf8').includes(spec.name), 'catálogo local não foi atualizado');
const ignore = readFileSync(join(brain, '.gitignore'), 'utf8');
assert(ignore.includes('configuracao.md') && ignore.includes('feedback.md'), 'arquivos privados não foram protegidos');

const overwrite = exec(COMMISSION, [relative, '--confirm', `--brain=${brain}`], brain);
expectStatus(overwrite, 1, 'sobrescrita');
assert(output(overwrite).includes('nunca sobrescreve'), 'sobrescrita falhou sem explicar proteção');

const started = exec(SYSTEM_RUN, [
  spec.system_id,
  'start',
  '--entity=caso:case-001',
  '--source=caso-recente:source-001',
], brain);
expectStatus(started, 0, 'primeiro run');
const firstRunState = readJson(statePath);
assert(firstRunState.status === 'first_run', 'run inicial não avançou para first_run');
assert(firstRunState.current_run?.id, 'run inicial sem id');

const completed = exec(SYSTEM_RUN, [
  spec.system_id,
  'complete',
  '--eval=pass',
  '--decision=approved',
  '--output=operacao/saida-jornada.md',
  '--outcome=proxima-acao-com-contexto-confirmada:true',
], brain);
expectStatus(completed, 0, 'conclusão do primeiro run');
const activeState = readJson(statePath);
assert(activeState.status === 'active', 'run aprovado não ativou Sistema local');
assert(activeState.first_value_confirmed === false, 'run aprovado não pode fingir primeira vitória');
assert(activeState.last_run.outcomes[0].value === true, 'outcome do run não foi registrado');

const confirmedValue = exec(SYSTEM_RUN, [spec.system_id, 'confirm-value'], brain);
expectStatus(confirmedValue, 0, 'confirmação de valor');
assert(readJson(statePath).first_value_confirmed === true, 'valor humano não foi confirmado');
const ledger = readFileSync(join(brain, '.cerebro', 'ledger', 'runs.jsonl'), 'utf8');
assert(ledger.includes(spec.system_id), 'run ledger não recebeu o Sistema');

const noT4Brain = makeBrain({ activated: false, suffix: 'no-t4' });
const noT4 = specFor(noT4Brain);
const blocked = exec(COMMISSION, [noT4.relative, '--confirm', `--brain=${noT4Brain}`], noT4Brain);
expectStatus(blocked, 1, 'gate T4');
assert(output(blocked).includes('T4'), 'gate T4 falhou sem motivo claro');
assert(!existsSync(join(noT4Brain, 'sistemas', 'outros-instalados', noT4.spec.system_id)), 'gate T4 escreveu pacote');

const piiBrain = makeBrain({ suffix: 'pii' });
const pii = specFor(piiBrain, (original) => {
  const next = clone(original);
  next.result.owner = 'founder@example.com';
  return next;
});
const piiBlocked = exec(COMMISSION, [pii.relative, '--confirm', `--brain=${piiBrain}`], piiBrain);
expectStatus(piiBlocked, 1, 'gate PII');
assert(output(piiBlocked).includes('PII'), 'gate PII falhou sem motivo claro');
assert(!existsSync(join(piiBrain, 'sistemas', 'outros-instalados', pii.spec.system_id)), 'gate PII escreveu pacote');

const missingBrain = makeBrain({ suffix: 'missing-evidence' });
const missing = specFor(missingBrain, (original) => {
  const next = clone(original);
  next.evidence.refs[0].path = 'capturas/nao-existe.md';
  return next;
});
const missingBlocked = exec(COMMISSION, [missing.relative, '--confirm', `--brain=${missingBrain}`], missingBrain);
expectStatus(missingBlocked, 1, 'gate evidência');
assert(output(missingBlocked).includes('não encontrada'), 'gate evidência falhou sem motivo claro');
assert(!existsSync(join(missingBrain, 'sistemas', 'outros-instalados', missing.spec.system_id)), 'gate evidência escreveu pacote');

console.log('✓ commission-system E2E: preview, gates, scaffold, primeiro run e valor confirmados');
