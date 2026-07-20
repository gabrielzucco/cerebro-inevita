#!/usr/bin/env node
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';

const SOURCE = resolve(process.cwd());
const sandbox = mkdtempSync(join(tmpdir(), 'cerebro-update-'));
const old = join(sandbox, 'cerebro');
const sentinel = 'CONTEXTO-DO-DONO-NAO-TOCAR\n';
const protectedFiles = [
  'meu-negocio/mapa.md',
  'operacao/_HOJE.md',
  'sistemas/cerebro-base/feedback.md',
  'sistemas/calls/feedback.md',
  'conexoes/configuradas/minha-conexao.md',
  'conexoes/configuradas/fontes.json',
  'comunidade/minhas-contribuicoes/aprovadas/minha-contribuicao.md',
];

try {
  mkdirSync(join(old, '.claude', 'scripts'), { recursive: true });
  mkdirSync(join(old, '.cerebro'), { recursive: true });
  cpSync(join(SOURCE, '.claude', 'scripts', 'update.sh'), join(old, '.claude', 'scripts', 'update.sh'));
  writeFileSync(join(old, '.cerebro', 'source'), 'REPO=teste/teste\nBRANCH=main\n');
  writeFileSync(join(old, 'VERSION'), '1.8.0\n');
  for (const file of protectedFiles) {
    mkdirSync(join(old, file, '..'), { recursive: true });
    writeFileSync(join(old, file), sentinel);
  }

  execFileSync('bash', [join(old, '.claude', 'scripts', 'update.sh')], {
    env: { ...process.env, CEREBRO_UPDATE_SOURCE_DIR: SOURCE, CEREBRO_TELEMETRY: 'off' },
    stdio: 'pipe',
  });

  for (const file of protectedFiles) {
    if (readFileSync(join(old, file), 'utf8') !== sentinel) throw new Error(`sobrescreveu: ${file}`);
  }
  for (const seeded of ['operacao/execucoes/_LEIA.md', 'meu-negocio/fontes/_LEIA.md']) {
    if (!existsSync(join(old, seeded))) throw new Error(`seed não chegou: ${seeded}`);
  }
  for (const motorFile of [
    'sistemas/_CATALOGO.md',
    'sistemas/cerebro-base/manifest.md',
    'sistemas/cerebro-base/pipeline.md',
    'scripts/concierge-run.mjs',
    'scripts/discover-context.mjs',
    'scripts/register-source.mjs',
  ]) {
    if (!existsSync(join(old, motorFile))) throw new Error(`motor novo não chegou: ${motorFile}`);
  }
  console.log(`✓ update real preservou ${protectedFiles.length} sentinelas, instalou seeds ausentes e atualizou o motor`);
} finally {
  rmSync(sandbox, { recursive: true, force: true });
}
