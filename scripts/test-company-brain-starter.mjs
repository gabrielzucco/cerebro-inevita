#!/usr/bin/env node
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const temp = mkdtempSync(join(tmpdir(), 'company-brain-starter-en-'));
const output = join(temp, 'company-brain-starter-en');
const zip = join(temp, 'company-brain-starter-en.zip');
const errors = [];

try {
  const build = spawnSync(process.execPath, [join(ROOT, 'scripts', 'build-company-brain-starter.mjs'), '--output', output, '--zip', zip], { encoding: 'utf8' });
  if (build.status !== 0) errors.push(`build failed: ${build.stderr || build.stdout}`);

  const required = [
    'START-HERE.md', 'AGENTS.md', 'VERSION', '.gitignore', '.cerebro/layout.json',
    '.cerebro/manifest.json', 'company/map.md', 'sources/register.md',
    'systems/first-system/brief.md', 'skills/company-brain-sprint/SKILL.md',
    'skills/company-brain-sprint/references/output-contract.md', 'raw/.gitkeep',
  ];
  for (const file of required) if (!existsSync(join(output, file))) errors.push(`missing: ${file}`);
  if (!existsSync(zip)) errors.push('missing zip');

  if (existsSync(join(output, '.cerebro', 'layout.json'))) {
    const layout = JSON.parse(readFileSync(join(output, '.cerebro', 'layout.json'), 'utf8'));
    for (const key of ['companyMap', 'sourceRegister', 'firstSystemBrief', 'contextPack', 'firstOutput', 'activationReceipt', 'corrections']) {
      const value = layout[key];
      if (!value || value.startsWith('/') || value.includes('..')) errors.push(`unsafe layout path: ${key}`);
    }
  }

  const start = readFileSync(join(output, 'START-HERE.md'), 'utf8');
  for (const contract of ['folder is your Company Brain', 'My Computer', '.cerebro/layout.json', 'The raw files are evidence']) {
    if (!start.includes(contract)) errors.push(`START-HERE missing contract: ${contract}`);
  }
  const skill = readFileSync(join(output, 'skills', 'company-brain-sprint', 'SKILL.md'), 'utf8');
  for (const contract of ['evidence → current map', 'V0 declared', 'V3 outcome validated', 'Do not claim to map']) {
    if (!skill.includes(contract)) errors.push(`skill missing contract: ${contract}`);
  }
  const ignore = readFileSync(join(output, '.gitignore'), 'utf8');
  for (const contract of ['raw/*', 'private/*']) if (!ignore.includes(contract)) errors.push(`ignore missing: ${contract}`);

  for (const forbidden of ['conhecimento', 'comunidade', 'member-id', 'acesso-email', 'METODO-COMPLETO.md']) {
    if (existsSync(join(output, forbidden))) errors.push(`starter leaked full product path: ${forbidden}`);
  }
} finally {
  rmSync(temp, { recursive: true, force: true });
}

if (errors.length) {
  console.error(errors.map((error) => `✗ ${error}`).join('\n'));
  process.exit(1);
}
console.log('✓ English local starter contract validated');
