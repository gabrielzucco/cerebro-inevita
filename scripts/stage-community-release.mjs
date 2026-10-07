#!/usr/bin/env node
import { existsSync, realpathSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { prepareReleaseContribution } from './lib/community-contribution.mjs';

export const STAGE_RELEASE_HELP = `stage-release — preparar um pacote original para revisão

node scripts/stage-community-release.mjs --package=<envelope-relativo.json>
  --summary=<resumo-da-proposta> [--confirm]

Sem --confirm: mostra versão, hash e arquivos; não grava nem envia.
Com --confirm: salva um candidato privado, sem aprovação ou autorização de envio.
O envelope V2 precisa estar em piloto, sem publicação ou evidência herdada.
Depois use community.mjs review, approve e send, com decisões separadas.
Raiz: CEREBRO_INSTALL_ROOT (padrão: o Cérebro que contém este script).
O comando não lê credenciais, usa rede ou publica sistemas.
`;

export function runStageReleaseCommand({ args, root }) {
  if (!args.length || (args.length === 1 && ['--help', 'help'].includes(args[0]))) return { help: STAGE_RELEASE_HELP };
  const options = { confirm: false };
  const seen = new Set();
  for (const arg of args) {
    const key = arg === '--confirm' ? 'confirm' : arg.startsWith('--package=') ? 'packageRef' : arg.startsWith('--summary=') ? 'summary' : null;
    if (!key || seen.has(key)) throw new Error('invalid_stage_release_arguments');
    seen.add(key);
    options[key] = key === 'confirm' ? true : arg.slice(arg.indexOf('=') + 1);
  }
  return prepareReleaseContribution({ root, ...options });
}

if (process.argv[1] && existsSync(process.argv[1]) && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const root = resolve(process.env.CEREBRO_INSTALL_ROOT || resolve(dirname(fileURLToPath(import.meta.url)), '..'));
    const result = runStageReleaseCommand({ args: process.argv.slice(2), root });
    console.log(result.help || JSON.stringify(result, null, 2));
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
