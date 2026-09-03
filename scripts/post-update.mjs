#!/usr/bin/env node
// Pós-update: roda a partir do PACOTE BAIXADO (não do motor antigo), então o
// comportamento novo vale já na atualização que o entrega. Chamado por
// scripts/update.mjs depois que o manifesto foi aplicado.
//
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { migrateLegacyRuntimeStorage } from './lib/runtime-storage.mjs';

const argRoot = process.argv.indexOf('--root');
const ROOT = argRoot >= 0 && process.argv[argRoot + 1]
  ? resolve(process.argv[argRoot + 1])
  : resolve(dirname(fileURLToPath(import.meta.url)), '..');

try {
  const migration = migrateLegacyRuntimeStorage(ROOT);
  if (migration.migrated) {
    console.log('✓ Runtime legado separado do armazenamento privado do Cérebro.');
  }
} catch (error) {
  console.error(`⚠ Não consegui preparar o armazenamento privado (${error.message}).`);
  console.error('  O motor foi atualizado; rode novamente o pós-update antes de salvar estado do cockpit.');
}

const temCredencial = existsSync(join(ROOT, '.cerebro', 'install-credential'));
const temEmail = existsSync(join(ROOT, '.cerebro', 'acesso-email'));
const dispensado = existsSync(join(ROOT, '.cerebro', 'acesso-dispensado'));

if (!temCredencial && !temEmail && !dispensado) {
  console.log('');
  console.log('VINCULO_DE_ACESSO_PENDENTE: esta instalação ainda não tem dono.');
  console.log('  Agente: entregue primeiro um output útil e então ofereça, uma única vez, o');
  console.log('  vínculo pelo e-mail de acesso; grave só o e-mail em .cerebro/acesso-email (uma linha,');
  console.log('  modo 0600) e rode `node .agents/scripts/ping.mjs sessao`. Se ela não quiser,');
  console.log('  grave .cerebro/acesso-dispensado e continue sem perguntar de novo.');
}
