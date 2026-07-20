#!/usr/bin/env node
import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';

const MILESTONES = ['T0', 'T1', 'T2', 'T3', 'T4'];
const INTERVENTIONS = [
  'locate-access',
  'locate-file',
  'local-permission',
  'transcription',
  'explain-question',
  'confirm-fact',
  'manual-step',
  'record-event',
];

function fail(message) {
  console.error(`Erro: ${message}`);
  process.exit(1);
}

function argsOf(argv) {
  const options = { command: argv[0] };
  for (let index = 1; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) fail(`argumento inesperado: ${token}`);
    const key = token.slice(2);
    if (key === 'json' || key === 'outside-contract') {
      options[key] = true;
      continue;
    }
    const value = argv[index + 1];
    if (!value || value.startsWith('--')) fail(`valor ausente para --${key}`);
    options[key] = value;
    index += 1;
  }
  return options;
}

function safeId(value) {
  if (!value || !/^[a-zA-Z0-9][a-zA-Z0-9._-]{2,79}$/.test(value)) {
    fail('use --run-id com 3–80 caracteres seguros');
  }
  return value;
}

function isoNow() {
  return process.env.CEREBRO_CLOCK_NOW || new Date().toISOString();
}

function rootFrom(options) {
  return resolve(options.brain || process.cwd());
}

function versionOf(root) {
  const path = join(root, 'VERSION');
  return existsSync(path) ? readFileSync(path, 'utf8').trim() : 'desconhecida';
}

function pathOf(root, runId) {
  return join(root, '.cerebro', 'concierge-runs', `${runId}.json`);
}

function readRun(path) {
  if (!existsSync(path)) fail(`execução não encontrada: ${basename(path, '.json')}`);
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    fail('recibo local inválido');
  }
}

function writeRun(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  const temp = `${path}.tmp`;
  writeFileSync(temp, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
  renameSync(temp, path);
}

function deltaMs(from, to) {
  if (!from || !to) return null;
  const value = new Date(to).getTime() - new Date(from).getTime();
  return Number.isFinite(value) ? value : null;
}

function publicStatus(run) {
  const milestones = Object.fromEntries(MILESTONES.map((key) => [key, run.milestones[key] || null]));
  return {
    runId: run.runId,
    systemId: run.systemId,
    productVersion: run.productVersion,
    milestones,
    deltasMs: {
      T0_T3: deltaMs(milestones.T0, milestones.T3),
      T1_T2: deltaMs(milestones.T1, milestones.T2),
      T3_T4: deltaMs(milestones.T3, milestones.T4),
    },
    interventions: run.interventions,
    complete: Boolean(milestones.T4),
  };
}

const options = argsOf(process.argv.slice(2));
if (!['start', 'mark', 'intervention', 'status'].includes(options.command)) {
  fail('use start, mark, intervention ou status');
}

const root = rootFrom(options);
const runId = safeId(options['run-id']);
const path = pathOf(root, runId);

if (options.command === 'start') {
  if (existsSync(path)) fail(`execução já existe: ${runId}`);
  const run = {
    schemaVersion: 1,
    runId,
    systemId: options.system || 'cerebro-base',
    productVersion: versionOf(root),
    milestones: { T0: isoNow() },
    interventions: [],
  };
  writeRun(path, run);
  const output = publicStatus(run);
  console.log(options.json ? JSON.stringify(output) : `✓ ${runId} · T0 registrado`);
  process.exit(0);
}

const run = readRun(path);

if (options.command === 'mark') {
  const milestone = options.milestone;
  if (!MILESTONES.includes(milestone)) fail(`marco inválido; use ${MILESTONES.join(', ')}`);
  if (run.milestones[milestone]) fail(`${milestone} já foi registrado`);
  const previous = MILESTONES[MILESTONES.indexOf(milestone) - 1];
  if (previous && !run.milestones[previous]) fail(`registre ${previous} antes de ${milestone}`);
  run.milestones[milestone] = isoNow();
  writeRun(path, run);
  const output = publicStatus(run);
  console.log(options.json ? JSON.stringify(output) : `✓ ${runId} · ${milestone} registrado`);
  process.exit(0);
}

if (options.command === 'intervention') {
  const kind = options.kind;
  const outside = Boolean(options['outside-contract']);
  if (!outside && !INTERVENTIONS.includes(kind)) {
    fail(`intervenção fora do contrato; use --outside-contract para registrá-la visivelmente`);
  }
  if (!kind || !/^[a-z0-9-]{3,60}$/.test(kind)) fail('use --kind com uma categoria segura');
  run.interventions.push({ at: isoNow(), kind, withinContract: !outside });
  writeRun(path, run);
  const output = publicStatus(run);
  console.log(options.json ? JSON.stringify(output) : `✓ intervenção registrada: ${kind}`);
  process.exit(0);
}

const output = publicStatus(run);
console.log(options.json ? JSON.stringify(output, null, 2) : [
  `${output.runId} · ${output.productVersion} · ${output.systemId}`,
  ...MILESTONES.map((key) => `${key}: ${output.milestones[key] || '—'}`),
  `intervenções: ${output.interventions.length}`,
].join('\n'));
