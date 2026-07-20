#!/usr/bin/env node

import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import assert from 'node:assert/strict';

const repo = resolve(process.cwd());
const discover = join(repo, 'scripts', 'discover-context.mjs');
const register = join(repo, 'scripts', 'register-source.mjs');
const fixture = mkdtempSync(join(tmpdir(), 'cerebro-context-test-'));

function folder(...parts) {
  const path = join(fixture, ...parts);
  mkdirSync(path, { recursive: true });
  return path;
}

try {
  const brain = folder('meu-cerebro');
  folder('meu-cerebro', '.cerebro');
  writeFileSync(join(brain, 'COMECE-AQUI.md'), 'marcador\n');
  writeFileSync(join(brain, 'VERSION'), '9.9.9\n');
  folder('meu-cerebro', 'conexoes', 'configuradas');

  folder('empresa', '.obsidian');
  writeFileSync(join(fixture, 'empresa', 'segredo.md'), 'conteúdo que a descoberta não deve ler\n');
  folder('produto', '.git');
  folder('reunioes');
  folder('base-vendas', 'docs');
  writeFileSync(join(fixture, 'base-vendas', 'AGENTS.md'), 'instruções\n');
  folder('ignorado', 'node_modules', 'calls');
  symlinkSync(join(fixture, 'reunioes'), join(fixture, 'atalho-para-reunioes'));

  const before = readFileSync(join(fixture, 'empresa', 'segredo.md'), 'utf8');
  const output = execFileSync(process.execPath, [discover, '--root', fixture, '--max-depth', '3', '--json'], { encoding: 'utf8' });
  const result = JSON.parse(output);

  assert.equal(result.readOnly, true);
  assert.deepEqual(result.candidates.map((item) => item.kind).sort(), [
    'git-repository', 'inevita-brain', 'knowledge-workspace', 'meetings-folder', 'obsidian',
  ]);
  assert.equal(readFileSync(join(fixture, 'empresa', 'segredo.md'), 'utf8'), before);
  assert.equal(result.candidates.some((item) => item.path.includes('node_modules')), false);
  assert.equal(result.candidates.some((item) => item.path.includes('atalho-para-reunioes')), false);

  const denied = spawnSync(process.execPath, [register, '--brain', brain, '--path', join(fixture, 'empresa'), '--type', 'obsidian'], { encoding: 'utf8' });
  assert.notEqual(denied.status, 0);

  const internal = spawnSync(process.execPath, [
    register, '--brain', brain, '--path', join(brain, 'conexoes'), '--type', 'local-folder', '--confirm',
  ], { encoding: 'utf8' });
  assert.notEqual(internal.status, 0);

  const registered = JSON.parse(execFileSync(process.execPath, [
    register, '--brain', brain, '--path', join(fixture, 'empresa'), '--type', 'obsidian',
    '--label', 'Base da empresa', '--scope', 'conteúdo', '--confirm',
  ], { encoding: 'utf8' }));
  assert.equal(registered.registered, true);
  assert.equal(registered.copied, false);
  assert.equal(registered.modifiedSource, false);

  execFileSync(process.execPath, [
    register, '--brain', brain, '--path', join(fixture, 'empresa'), '--type', 'obsidian',
    '--label', 'Base principal', '--scope', 'conteúdo', '--confirm',
  ]);
  const registry = JSON.parse(readFileSync(join(brain, 'conexoes', 'configuradas', 'fontes.json'), 'utf8'));
  assert.equal(registry.sources.length, 1);
  assert.equal(registry.sources[0].label, 'Base principal');
  assert.equal(registry.sources[0].access, 'read-only');
  assert.equal(registry.sources[0].refresh, 'manual');
  assert.equal(registry.sources[0].sourceOfTruth, true);
  assert.equal(JSON.stringify(registry).includes('conteúdo que a descoberta não deve ler'), false);

  console.log('✓ descoberta somente leitura e registro consentido passaram');
} finally {
  rmSync(fixture, { recursive: true, force: true });
}
