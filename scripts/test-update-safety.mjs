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
  'operacao/arquitetura/mapa-do-dono.architect-spec.json',
  'sistemas/cerebro-base/feedback.md',
  'sistemas/calls/feedback.md',
  'sistemas/outros-instalados/briefing-comercial-inteligente/configuracao.md',
  'sistemas/outros-instalados/briefing-comercial-inteligente/feedback.md',
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
  writeFileSync(join(old, '.gitignore'), '# regra do dono\n*.local-only\n');
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
  for (const seeded of ['operacao/execucoes/_LEIA.md', 'operacao/arquitetura/_LEIA.md', 'meu-negocio/fontes/_LEIA.md']) {
    if (!existsSync(join(old, seeded))) throw new Error(`seed não chegou: ${seeded}`);
  }
  for (const motorFile of [
    'sistemas/_CATALOGO.md',
    'sistemas/cerebro-base/manifest.md',
    'sistemas/cerebro-base/pipeline.md',
    'scripts/concierge-run.mjs',
    'scripts/discover-context.mjs',
    'scripts/register-source.mjs',
    'scripts/install-system.mjs',
    'scripts/system-state.mjs',
    'scripts/system-run.mjs',
    'scripts/generate-operating-brief.mjs',
    'scripts/test-operating-brief.mjs',
    '.claude/skills/briefing-comercial/SKILL.md',
    '.claude/skills/arquiteto/SKILL.md',
    '.claude/skills/arquiteto/scripts/render-map.mjs',
    '.claude/skills/society/SKILL.md',
    '.cerebro/private-ignore.manifest',
    'comunidade/inevita/sistemas-disponiveis/briefing-comercial-inteligente/manifest.md',
  ]) {
    if (!existsSync(join(old, motorFile))) throw new Error(`motor novo não chegou: ${motorFile}`);
  }
  const gitignore = readFileSync(join(old, '.gitignore'), 'utf8');
  for (const rule of [
    '# regra do dono',
    '*.local-only',
    '.cerebro/sistemas/',
    'sistemas/outros-instalados/*/configuracao.md',
    'sistemas/outros-instalados/*/feedback.md',
    'operacao/arquitetura/*',
  ]) {
    if (!gitignore.includes(rule)) throw new Error(`proteção local ausente: ${rule}`);
  }

  // Compatibilidade de primeira passagem: um atualizador antigo copia os scripts
  // novos, mas só executa o código novo quando chama ping.sh no final.
  const legacy = join(sandbox, 'legacy-first-pass');
  mkdirSync(join(legacy, '.claude'), { recursive: true });
  mkdirSync(join(legacy, '.cerebro'), { recursive: true });
  cpSync(join(SOURCE, '.claude', 'scripts'), join(legacy, '.claude', 'scripts'), { recursive: true });
  cpSync(
    join(SOURCE, '.cerebro', 'private-ignore.manifest'),
    join(legacy, '.cerebro', 'private-ignore.manifest'),
  );
  writeFileSync(join(legacy, '.gitignore'), '# regra legada do dono\n*.nao-enviar');
  execFileSync('bash', [join(legacy, '.claude', 'scripts', 'ping.sh'), 'atualizou'], {
    env: { ...process.env, CEREBRO_TELEMETRY: 'off' },
    stdio: 'pipe',
  });
  const legacyIgnore = readFileSync(join(legacy, '.gitignore'), 'utf8');
  for (const rule of ['# regra legada do dono', '*.nao-enviar', '.cerebro/sistemas/']) {
    if (!legacyIgnore.includes(rule)) throw new Error(`migração na primeira passagem ausente: ${rule}`);
  }
  execFileSync('bash', [join(legacy, '.claude', 'scripts', 'ping.sh'), 'atualizou'], {
    env: { ...process.env, CEREBRO_TELEMETRY: 'off' },
    stdio: 'pipe',
  });
  if (readFileSync(join(legacy, '.gitignore'), 'utf8') !== legacyIgnore) {
    throw new Error('migração de privacidade não é idempotente');
  }
  console.log(`✓ update real preservou ${protectedFiles.length} sentinelas, instalou seeds ausentes e atualizou o motor`);
} finally {
  rmSync(sandbox, { recursive: true, force: true });
}
