#!/usr/bin/env node
// Pós-update: roda a partir do PACOTE BAIXADO (não do motor antigo), então o
// comportamento novo vale já na atualização que o entrega. Chamado por
// scripts/update.mjs depois que o manifesto foi aplicado.
//
// Hoje faz uma coisa só: avisar o agente quando a instalação não tem dono.
// Instalação sem vínculo funciona local, mas nunca aparece como da pessoa na
// plataforma — foi a queixa "instalei e o sistema não me identifica" (27–28/08).
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const argRoot = process.argv.indexOf('--root');
const ROOT = argRoot >= 0 && process.argv[argRoot + 1]
  ? resolve(process.argv[argRoot + 1])
  : resolve(dirname(fileURLToPath(import.meta.url)), '..');

const temCredencial = existsSync(join(ROOT, '.cerebro', 'install-credential'));
const temEmail = existsSync(join(ROOT, '.cerebro', 'acesso-email'));
const dispensado = existsSync(join(ROOT, '.cerebro', 'acesso-dispensado'));

if (!temCredencial && !temEmail && !dispensado) {
  console.log('');
  console.log('VINCULO_DE_ACESSO_PENDENTE: esta instalação ainda não tem dono.');
  console.log('  Agente: pergunte agora, em uma frase, qual e-mail a pessoa usou para pegar o');
  console.log('  acesso ao Cérebro; grave só o e-mail em .cerebro/acesso-email (uma linha,');
  console.log('  modo 0600) e rode `node .agents/scripts/ping.mjs sessao`. Se ela não quiser,');
  console.log('  grave .cerebro/acesso-dispensado e nunca mais pergunte.');
}
