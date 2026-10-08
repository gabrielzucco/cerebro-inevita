#!/usr/bin/env node
import { cpSync, existsSync, lstatSync, mkdirSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const IGNORAR = new Set(['__pycache__', '.DS_Store', '.pytest_cache']);
function directories(path) {
  if (!existsSync(path)) return [];
  return readdirSync(path, { withFileTypes: true }).filter(item => !IGNORAR.has(item.name));
}
function files(path, base = path) {
  if (!existsSync(path)) return [];
  return directories(path).flatMap(item => {
    const child = join(path, item.name);
    if (item.isSymbolicLink() || (!item.isDirectory() && !item.isFile())) throw new Error('skill-parity-unsafe-path');
    if (item.isDirectory()) return files(child, base);
    return item.name.endsWith('.pyc') ? [] : [child.slice(base.length + 1)];
  }).sort();
}
function communitySkill(path) {
  const marker = join(path, '.inevita-skill-origin.json');
  return existsSync(marker) && lstatSync(marker).isFile() && !lstatSync(marker).isSymbolicLink();
}
export function syncAgentSkills(root = ROOT, { checkOnly = false } = {}) {
  const source = join(root, '.claude', 'skills'), target = join(root, '.agents', 'skills');
  if (!lstatSync(source).isDirectory() || lstatSync(source).isSymbolicLink()) throw new Error('skill-source-unsafe');
  if (existsSync(join(root, '.agents')) && lstatSync(join(root, '.agents')).isSymbolicLink()) throw new Error('skill-target-unsafe');
  if (existsSync(target) && (!lstatSync(target).isDirectory() || lstatSync(target).isSymbolicLink())) throw new Error('skill-target-unsafe');
  const official = directories(source);
  if (official.some(item => !item.isDirectory() || item.isSymbolicLink())) throw new Error('skill-source-unsafe');
  official.forEach(item => files(join(source, item.name)));
  const names = new Set(official.map(item => item.name));
  for (const item of directories(target)) {
    const path = join(target, item.name);
    if (!item.isDirectory() || item.isSymbolicLink()) throw new Error('skill-target-unsafe');
    if (names.has(item.name)) {
      if (communitySkill(path)) throw new Error(`skill-official-overwrite-conflict:${item.name}`);
    } else if (!communitySkill(path)) throw new Error(`skill-untracked-extra:${item.name}`);
  }
  if (checkOnly) {
    for (const item of official) {
      const a = join(source, item.name), b = join(target, item.name);
      if (!existsSync(b)) throw new Error(`skill-runtime-missing:${item.name}`);
      const left = files(a), right = files(b);
      if (JSON.stringify(left) !== JSON.stringify(right) || left.some(file => !readFileSync(join(a, file)).equals(readFileSync(join(b, file))))) {
        throw new Error(`skill-runtime-diverged:${item.name}`);
      }
    }
  } else {
    mkdirSync(target, { recursive: true });
    for (const item of official) {
      const a = join(source, item.name), b = join(target, item.name);
      rmSync(b, { recursive: true, force: true });
      cpSync(a, b, { recursive: true });
    }
  }
  return { official_skills: official.length, official_files: official.reduce((count, item) => count + files(join(source, item.name)).length, 0) };
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const { official_files } = syncAgentSkills(ROOT, { checkOnly: process.argv.includes('--check') });
    console.log(`✓ ${official_files} arquivos de skills portáveis em sincronia`);
  } catch (error) {
    console.error(`Skills portáveis precisam de revisão: ${error.message}. Confira o conflito antes de sincronizar.`);
    process.exitCode = 1;
  }
}
