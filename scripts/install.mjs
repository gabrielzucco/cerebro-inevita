#!/usr/bin/env node
// Instala somente em pasta inexistente. Instalação encontrada exige escolha humana.
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { applyPlan, downloadPackage, planUpdate, safePath, TAG_RE } from './update.mjs';

export function installationChoices(destination) {
  if (!existsSync(destination)) return { status: 'new-folder', destination };
  const brain = ['COMECE-AQUI.md', 'VERSION', '.cerebro'].every(item => existsSync(join(destination, item)));
  return {
    status: brain ? 'existing-brain' : 'existing-folder', destination,
    choices: [
      { action: 'use-existing', label: 'Usar o existente', next: 'auditar-cerebro, depois comecar se necessário' },
      { action: 'new-folder', label: 'Instalar novo em pasta nova', next: 'Escolha outro destino inexistente' },
      { action: 'migrate', label: 'Migrar', next: 'migrar-cerebro: primeiro planejar e pedir aprovação' },
    ],
    written: false,
  };
}

export function installPackage(destination, source, tag, { apply = false } = {}) {
  const target = resolve(destination);
  const choice = installationChoices(target);
  if (choice.status !== 'new-folder') return choice;
  // Verificar ancestrais; não seguir symlinks de destino nem copiar credenciais.
  const base = resolve(target, '..');
  if (!existsSync(base)) throw new Error('destination-parent-missing');
  safePath(base, target.slice(base.length + 1));
  if (!TAG_RE.test(tag || '')) throw new Error('explicit-tag-required');
  for (const required of ['COMECE-AQUI.md', 'CLAUDE.md', '.cerebro/motor.manifest']) {
    if (!existsSync(safePath(source, required))) throw new Error('installation-package-incomplete');
  }
  const plan = planUpdate(target, source, tag);
  if (!apply) return { status: 'preview', tag, destination: target, written: false, files: plan.summary };
  mkdirSync(target); // exclusiva: não reutiliza pasta criada entre prévia e aplicação
  try {
    applyPlan(target, plan);
    return { status: 'installed', tag, version: readFileSync(join(target, 'VERSION'), 'utf8').trim(), destination: target, written: true };
  } catch (error) {
    // applyPlan restaura arquivos; mantenha a pasta e o backup para diagnóstico.
    throw new Error(`installation-failed: ${error.message}`);
  }
}

async function main() {
  const options = { apply: false };
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--apply') options.apply = true;
    else if (['--tag', '--destination'].includes(argv[i]) && argv[i + 1] && !argv[i + 1].startsWith('--')) options[argv[i].slice(2)] = argv[++i];
    else throw new Error('usage: install.mjs --tag vX.Y.Z --destination path [--apply]');
  }
  if (!options.destination || !TAG_RE.test(options.tag || '')) throw new Error('explicit-tag-and-destination-required');
  const choice = installationChoices(resolve(options.destination));
  if (choice.status !== 'new-folder') { console.log(JSON.stringify(choice, null, 2)); return; }
  const temp = mkdtempSync(join(tmpdir(), 'cerebro-install-'));
  try {
    const source = process.env.CEREBRO_INSTALL_SOURCE_DIR
      ? resolve(process.env.CEREBRO_INSTALL_SOURCE_DIR)
      : await downloadPackage('gabrielzucco/cerebro-inevita', options.tag, temp);
    console.log(JSON.stringify(installPackage(options.destination, source, options.tag, { apply: options.apply }), null, 2));
  } finally { rmSync(temp, { recursive: true, force: true }); }
}
if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(`✗ ${error.message}`); process.exitCode = 1; });
}
