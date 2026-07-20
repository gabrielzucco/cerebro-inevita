#!/usr/bin/env node

import { existsSync, lstatSync, readdirSync, realpathSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';

const args = process.argv.slice(2);
const roots = [];
let maxDepth = 2;
let json = false;

for (let index = 0; index < args.length; index += 1) {
  const arg = args[index];
  if (arg === '--root') roots.push(args[++index]);
  else if (arg === '--max-depth') maxDepth = Number(args[++index]);
  else if (arg === '--json') json = true;
  else if (arg === '--help') {
    console.log('uso: node scripts/discover-context.mjs [--root <pasta>] [--max-depth 0-4] [--json]');
    process.exit(0);
  } else {
    console.error(`argumento desconhecido: ${arg}`);
    process.exit(2);
  }
}

if (!roots.length) roots.push(process.cwd());
if (!Number.isInteger(maxDepth) || maxDepth < 0 || maxDepth > 4) {
  console.error('--max-depth precisa ser um inteiro entre 0 e 4');
  process.exit(2);
}

const excluded = new Set([
  '.git', '.cache', '.next', '.turbo', '.venv', 'venv', 'node_modules', 'vendor', 'dist', 'build',
  'Library', 'Applications', '.Trash', 'Pods', 'DerivedData',
]);

function normalizedName(path) {
  return basename(path).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function directory(path) {
  try {
    return lstatSync(path).isDirectory();
  } catch {
    return false;
  }
}

function marker(path, name, type = 'file') {
  const target = join(path, name);
  if (!existsSync(target)) return false;
  return type === 'directory' ? directory(target) : !directory(target);
}

function inspect(path) {
  const signals = [];
  const hasStart = marker(path, 'COMECE-AQUI.md');
  const hasVersion = marker(path, 'VERSION');
  const hasBrain = marker(path, '.cerebro', 'directory');
  const hasObsidian = marker(path, '.obsidian', 'directory');
  const hasGit = marker(path, '.git', 'directory');
  const hasClaude = marker(path, 'CLAUDE.md');
  const hasAgents = marker(path, 'AGENTS.md');
  const hasDocs = marker(path, 'docs', 'directory')
    || marker(path, 'conhecimento', 'directory')
    || marker(path, 'knowledge', 'directory');

  if (hasStart) signals.push('COMECE-AQUI.md');
  if (hasVersion) signals.push('VERSION');
  if (hasBrain) signals.push('.cerebro/');
  if (hasObsidian) signals.push('.obsidian/');
  if (hasGit) signals.push('.git/');
  if (hasClaude) signals.push('CLAUDE.md');
  if (hasAgents) signals.push('AGENTS.md');

  if (hasStart && hasVersion && hasBrain) {
    return { kind: 'inevita-brain', label: `Cérebro INEVITA em ${basename(path)}`, signals };
  }
  if (hasObsidian) return { kind: 'obsidian', label: `Notas do Obsidian em ${basename(path)}`, signals };
  if (hasGit) return { kind: 'git-repository', label: `Repositório em ${basename(path)}`, signals };

  const name = normalizedName(path);
  if (/^(call|calls|reuniao|reunioes|meeting|meetings|transcricao|transcricoes)$/.test(name)) {
    return { kind: 'meetings-folder', label: `Pasta de reuniões em ${basename(path)}`, signals };
  }
  if ((hasClaude || hasAgents) && hasDocs) {
    return { kind: 'knowledge-workspace', label: `Workspace com contexto em ${basename(path)}`, signals };
  }
  return null;
}

const scannedRoots = [];
const visited = new Set();
const candidates = [];

for (const rawRoot of roots) {
  if (!rawRoot) continue;
  const absolute = resolve(rawRoot);
  if (!directory(absolute)) {
    console.error(`raiz inexistente ou não é pasta: ${absolute}`);
    process.exit(2);
  }
  const root = realpathSync(absolute);
  if (!scannedRoots.includes(root)) scannedRoots.push(root);
  const queue = [{ path: root, depth: 0 }];

  while (queue.length) {
    const current = queue.shift();
    let real;
    try {
      real = realpathSync(current.path);
    } catch {
      continue;
    }
    if (visited.has(real)) continue;
    visited.add(real);

    const found = inspect(real);
    if (found) candidates.push({ path: real, ...found });
    if (current.depth >= maxDepth) continue;

    let entries = [];
    try {
      entries = readdirSync(real, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      if (!entry.isDirectory() || entry.isSymbolicLink() || excluded.has(entry.name)) continue;
      queue.push({ path: join(real, entry.name), depth: current.depth + 1 });
    }
  }
}

const priority = {
  'inevita-brain': 0,
  obsidian: 1,
  'knowledge-workspace': 2,
  'git-repository': 3,
  'meetings-folder': 4,
};

candidates.sort((left, right) =>
  priority[left.kind] - priority[right.kind] || left.path.localeCompare(right.path));

const result = {
  version: 1,
  readOnly: true,
  inspected: 'nomes de pastas e marcadores técnicos; nenhum conteúdo de arquivo',
  scannedRoots,
  candidates,
};

if (json) {
  console.log(JSON.stringify(result, null, 2));
} else {
  console.log('Descoberta concluída sem alterar ou ler o conteúdo dos arquivos.');
  if (!candidates.length) console.log('Nenhuma instalação ou fonte local reconhecível foi encontrada.');
  for (const candidate of candidates) console.log(`- ${candidate.label}: ${candidate.path}`);
}
