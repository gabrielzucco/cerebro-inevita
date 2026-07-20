#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(process.cwd());
const errors = [];
const required = [
  'meu-negocio', 'sistemas/_CATALOGO.md', 'skills/_CATALOGO.md', 'conexoes/_CATALOGO.md',
  'operacao/_LEIA.md', 'comunidade/inevita/_CATALOGO.md',
  'comunidade/minhas-contribuicoes/_LEIA.md', '.cerebro/seed.manifest',
  'sistemas/calls/manifest.md', 'sistemas/calls/pipeline.md', 'sistemas/calls/rotinas.md',
  'sistemas/calls/evals.md', 'sistemas/calls/feedback.md', 'sistemas/calls/changelog.md',
  '.claude/skills/operar/SKILL.md',
  'scripts/discover-context.mjs', 'scripts/register-source.mjs',
  'scripts/test-context-discovery.mjs',
];

for (const item of required) {
  if (!existsSync(join(ROOT, item))) errors.push(`faltando: ${item}`);
}
function files(root, base = root) {
  if (!existsSync(root)) return [];
  return readdirSync(root).flatMap((name) => {
    const path = join(root, name);
    return statSync(path).isDirectory() ? files(path, base) : [path.slice(base.length + 1)];
  }).sort();
}

const claudeFiles = files(join(ROOT, '.claude', 'skills'));
const agentFiles = files(join(ROOT, '.agents', 'skills'));
if (JSON.stringify(claudeFiles) !== JSON.stringify(agentFiles)) {
  errors.push('listas de skills .claude e .agents divergem');
} else {
  for (const file of claudeFiles) {
    const a = readFileSync(join(ROOT, '.claude', 'skills', file));
    const b = readFileSync(join(ROOT, '.agents', 'skills', file));
    if (!a.equals(b)) errors.push(`skill fora de sincronia: ${file}`);
  }
}

for (const file of claudeFiles.filter((name) => name.endsWith('SKILL.md'))) {
  const content = readFileSync(join(ROOT, '.claude', 'skills', file), 'utf8');
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) {
    errors.push(`skill sem frontmatter: ${file}`);
    continue;
  }
  const lines = match[1].split('\n').filter(Boolean);
  const keys = lines.map((line) => line.split(':', 1)[0].trim());
  if (keys.join(',') !== 'name,description') errors.push(`frontmatter inválido em ${file}`);
  const name = lines.find((line) => line.startsWith('name:'))?.slice(5).trim() ?? '';
  if (!/^[a-z0-9-]+$/.test(name)) errors.push(`nome de skill inválido em ${file}`);
  const description = lines.find((line) => line.startsWith('description:'))?.slice(12).trim() ?? '';
  if (!description) errors.push(`descrição vazia em ${file}`);
}

const motor = readFileSync(join(ROOT, '.cerebro', 'motor.manifest'), 'utf8');
for (const forbidden of ['meu-negocio/', 'operacao/', 'sistemas/calls/feedback.md', 'comunidade/minhas-contribuicoes/']) {
  if (motor.split('\n').some((line) => line.trim().startsWith(forbidden))) {
    errors.push(`motor tenta sobrescrever caminho do dono: ${forbidden}`);
  }
}

const update = readFileSync(join(ROOT, '.claude', 'scripts', 'update.sh'), 'utf8');
for (const guard of ['operacao*', 'sistemas/*/feedback.md', 'comunidade/minhas-contribuicoes*', 'SEED_MANIFEST']) {
  if (!update.includes(guard)) errors.push(`update sem guarda: ${guard}`);
}

const ping = readFileSync(join(ROOT, '.agents', 'scripts', 'ping.mjs'), 'utf8');
for (const event of ['proof_delivered', 'first_value_confirmed', 'contribution_prepared', 'contribution_approved']) {
  if (!ping.includes(event)) errors.push(`ping sem evento: ${event}`);
}

const comecar = readFileSync(join(ROOT, '.claude', 'skills', 'comecar', 'SKILL.md'), 'utf8');
for (const contract of [
  'Retomar antes de perguntar',
  'Use sempre `você`, `seu` e `sua`',
  'Reutilize as palavras da pessoa',
  'Pergunte por comportamentos observáveis',
  'Começar por uma amostra',
  'Nome humano da palestra — minuto 11:53',
  'Você usaria isso do jeito que está ou mudaria alguma coisa antes?',
  'operacao/decisoes-pendentes/onboarding.md',
  'Nunca peça reinício',
  'proof_delivered',
  'Descobrir sem invadir',
  'discover-context.mjs',
  'register-source.mjs',
  'não é uma conexão automática',
]) {
  if (!comecar.includes(contract)) errors.push(`comecar sem contrato de retomada: ${contract}`);
}
for (const regression of [
  'Fale como operador, em `tu/teu`',
  'Isso te ajuda a decidir ou agir agora?',
  'Duas notas de honestidade',
]) {
  if (comecar.includes(regression)) errors.push(`comecar regrediu para linguagem antiga: ${regression}`);
}

const start = readFileSync(join(ROOT, 'COMECE-AQUI.md'), 'utf8');
for (const contract of [
  'Não troque de ferramenta nem de sessão',
  'atalho, não um requisito',
  'nunca decide sozinho',
  'Cérebro existente não é a mesma coisa que contexto existente',
  'sem cópia, mudança ou sync automático',
]) {
  if (!start.includes(contract)) errors.push(`COMECE-AQUI sem ativação na mesma sessão: ${contract}`);
}

const discovery = readFileSync(join(ROOT, 'scripts', 'discover-context.mjs'), 'utf8');
for (const contract of ['readOnly: true', 'nenhum conteúdo de arquivo', 'lstatSync', 'realpathSync']) {
  if (!discovery.includes(contract)) errors.push(`descoberta sem guarda: ${contract}`);
}

const register = readFileSync(join(ROOT, 'scripts', 'register-source.mjs'), 'utf8');
for (const contract of [
  "access: 'read-only'",
  'sourceOfTruth: true',
  "refresh: 'manual'",
  'copied: false',
  '!options.confirm',
]) {
  if (!register.includes(contract)) errors.push(`registro de fonte sem guarda: ${contract}`);
}

const ignore = readFileSync(join(ROOT, '.gitignore'), 'utf8');
if (!ignore.includes('conexoes/configuradas/*')) {
  errors.push('registro local de fontes não está protegido pelo .gitignore');
}

if (errors.length) {
  console.error(errors.map((e) => `✗ ${e}`).join('\n'));
  process.exit(1);
}
console.log(`✓ protocolo válido · 6 superfícies · 1 sistema · ${claudeFiles.length} arquivos de skills sincronizados`);
