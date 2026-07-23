#!/usr/bin/env node
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';

const source = resolve(process.cwd());
const sandbox = mkdtempSync(join(tmpdir(), 'cerebro-system-install-'));
const slug = 'briefing-comercial-inteligente';

try {
  writeFileSync(join(sandbox, 'COMECE-AQUI.md'), '# teste\n');
  writeFileSync(join(sandbox, 'VERSION'), '0.0.0\n');
  mkdirSync(join(sandbox, 'sistemas', 'outros-instalados', slug), { recursive: true });
  const feedback = join(sandbox, 'sistemas', 'outros-instalados', slug, 'feedback.md');
  writeFileSync(feedback, 'FEEDBACK-PRIVADO\n');
  execFileSync(process.execPath, [join(source, 'scripts', 'install-system.mjs'), slug, '--confirm'], {
    cwd: source,
    env: { ...process.env, CEREBRO_INSTALL_ROOT: sandbox, CEREBRO_TELEMETRY: 'off' },
    stdio: 'pipe',
  });
  if (readFileSync(feedback, 'utf8') !== 'FEEDBACK-PRIVADO\n') throw new Error('feedback foi sobrescrito');
  for (const file of ['manifest.md', 'pipeline.md', 'rotinas.md', 'evals.md', 'changelog.md', 'configuracao.md']) {
    if (!existsSync(join(sandbox, 'sistemas', 'outros-instalados', slug, file))) throw new Error(`faltando ${file}`);
  }
  const statePath = join(sandbox, '.cerebro', 'sistemas', `${slug}.json`);
  if (JSON.parse(readFileSync(statePath, 'utf8')).status !== 'package_added') throw new Error('estado inicial incorreto');
  execFileSync(process.execPath, [join(source, 'scripts', 'system-state.mjs'), slug, 'configuring'], {
    env: { ...process.env, CEREBRO_INSTALL_ROOT: sandbox, CEREBRO_TELEMETRY: 'off' },
    stdio: 'pipe',
  });
  if (JSON.parse(readFileSync(statePath, 'utf8')).status !== 'configuring') throw new Error('transição não persistiu');
  const configuration = join(sandbox, 'sistemas', 'outros-instalados', slug, 'configuracao.md');
  writeFileSync(configuration, 'CONFIGURACAO-PRIVADA\n');
  execFileSync(process.execPath, [join(source, 'scripts', 'install-system.mjs'), slug, '--confirm'], {
    cwd: source,
    env: { ...process.env, CEREBRO_INSTALL_ROOT: sandbox, CEREBRO_TELEMETRY: 'off' },
    stdio: 'pipe',
  });
  if (readFileSync(configuration, 'utf8') !== 'CONFIGURACAO-PRIVADA\n') throw new Error('configuração foi sobrescrita');
  if (JSON.parse(readFileSync(statePath, 'utf8')).status !== 'configuring') throw new Error('reinstalação regrediu o estado');
  const catalog = readFileSync(join(sandbox, 'sistemas', 'outros-instalados', '_CATALOGO.md'), 'utf8');
  if ((catalog.match(/system:briefing-comercial-inteligente:start/g) ?? []).length !== 1) throw new Error('catálogo duplicou a entrada');
  console.log('✓ bootstrap preservou dados privados e iniciou o comissionamento sem fingir ativação');
} finally {
  rmSync(sandbox, { recursive: true, force: true });
}
