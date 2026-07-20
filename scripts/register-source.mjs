#!/usr/bin/env node

import {
  existsSync, mkdirSync, readFileSync, realpathSync, renameSync, statSync, writeFileSync,
} from 'node:fs';
import { createHash } from 'node:crypto';
import { basename, dirname, isAbsolute, join, relative, resolve } from 'node:path';

const args = process.argv.slice(2);
const options = {};
for (let index = 0; index < args.length; index += 1) {
  const arg = args[index];
  if (arg === '--confirm') options.confirm = true;
  else if (arg === '--help') {
    console.log('uso: node scripts/register-source.mjs --path <caminho> --type <tipo> [--label <nome>] [--scope <uso>] --confirm');
    process.exit(0);
  } else if (arg.startsWith('--')) options[arg.slice(2)] = args[++index];
  else {
    console.error(`argumento desconhecido: ${arg}`);
    process.exit(2);
  }
}

const allowedTypes = new Set([
  'local-folder', 'local-file', 'obsidian', 'git-repository', 'meetings-folder', 'knowledge-workspace',
]);
const requestedBrainRoot = resolve(options.brain || process.cwd());

function fail(message) {
  console.error(message);
  process.exit(2);
}

if (!existsSync(join(requestedBrainRoot, 'COMECE-AQUI.md')) || !existsSync(join(requestedBrainRoot, '.cerebro'))) {
  fail('execute dentro de um Cérebro INEVITA ou informe --brain');
}
const brainRoot = realpathSync(requestedBrainRoot);
if (!options.path) fail('--path é obrigatório');
if (!options.type || !allowedTypes.has(options.type)) {
  fail(`--type precisa ser um destes: ${[...allowedTypes].join(', ')}`);
}
if (!options.confirm) fail('fonte não registrada: falta aprovação explícita (--confirm)');

const requested = isAbsolute(options.path) ? options.path : resolve(options.path);
if (!existsSync(requested)) fail(`fonte não encontrada: ${requested}`);
const location = realpathSync(requested);
const sourceStat = statSync(location);
if (options.type === 'local-file' && !sourceStat.isFile()) fail('local-file precisa apontar para um arquivo');
if (options.type !== 'local-file' && !sourceStat.isDirectory()) fail(`${options.type} precisa apontar para uma pasta`);

const insideBrain = relative(brainRoot, location);
if (insideBrain === '' || (!insideBrain.startsWith('..') && !isAbsolute(insideBrain))) {
  fail('a fonte já está dentro deste Cérebro; não precisa ser registrada como externa');
}

const registryPath = join(brainRoot, 'conexoes', 'configuradas', 'fontes.json');
let registry = { version: 1, sources: [] };
if (existsSync(registryPath)) {
  try {
    registry = JSON.parse(readFileSync(registryPath, 'utf8'));
  } catch {
    fail(`registro inválido: ${registryPath}`);
  }
}
if (registry.version !== 1 || !Array.isArray(registry.sources)) fail('schema de fontes incompatível');

const now = new Date().toISOString();
const id = createHash('sha256').update(location).digest('hex').slice(0, 12);
const existing = registry.sources.find((source) => source.location === location);
const source = {
  id,
  label: String(options.label || basename(location)).trim(),
  type: options.type,
  location,
  access: 'read-only',
  sourceOfTruth: true,
  sensitivity: options.sensitivity || 'private',
  scope: String(options.scope || 'primeiro-caso').trim(),
  refresh: 'manual',
  status: 'active',
  createdAt: existing?.createdAt || now,
  updatedAt: now,
};

if (!['private', 'team', 'public'].includes(source.sensitivity)) {
  fail('--sensitivity precisa ser private, team ou public');
}
if (!source.label || !source.scope) fail('label e scope não podem ficar vazios');

registry.sources = registry.sources.filter((item) => item.location !== location);
registry.sources.push(source);
registry.sources.sort((left, right) => left.label.localeCompare(right.label));

mkdirSync(dirname(registryPath), { recursive: true });
const temporary = `${registryPath}.tmp`;
writeFileSync(temporary, `${JSON.stringify(registry, null, 2)}\n`, { mode: 0o600 });
renameSync(temporary, registryPath);
console.log(JSON.stringify({ registered: true, copied: false, moved: false, modifiedSource: false, source }, null, 2));
