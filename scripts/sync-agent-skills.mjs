#!/usr/bin/env node
import { cpSync, existsSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = join(ROOT, '.claude', 'skills');
const TARGET = join(ROOT, '.agents', 'skills');
const checkOnly = process.argv.includes('--check');

function files(root, base = root) {
  if (!existsSync(root)) return [];
  return readdirSync(root).flatMap((name) => {
    const path = join(root, name);
    return statSync(path).isDirectory() ? files(path, base) : [path.slice(base.length + 1)];
  }).sort();
}
if (checkOnly) {
  const sourceFiles = files(SOURCE);
  const targetFiles = files(TARGET);
  const sameList = JSON.stringify(sourceFiles) === JSON.stringify(targetFiles);
  const sameContent = sameList && sourceFiles.every((file) =>
    readFileSync(join(SOURCE, file)).equals(readFileSync(join(TARGET, file))),
  );
  if (!sameContent) {
    console.error('Skills portáveis estão fora de sincronia. Rode: node scripts/sync-agent-skills.mjs');
    process.exit(1);
  }
  console.log(`✓ ${sourceFiles.length} arquivos de skills portáveis em sincronia`);
} else {
  rmSync(TARGET, { recursive: true, force: true });
  cpSync(SOURCE, TARGET, { recursive: true });
  console.log(`✓ .agents/skills gerado a partir de .claude/skills (${files(TARGET).length} arquivos)`);
}
