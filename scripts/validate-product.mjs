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
  'sistemas/cerebro-base/manifest.md', 'sistemas/cerebro-base/pipeline.md',
  'sistemas/cerebro-base/rotinas.md', 'sistemas/cerebro-base/evals.md',
  'sistemas/cerebro-base/feedback.md', 'sistemas/cerebro-base/changelog.md',
  '.claude/skills/operar/SKILL.md',
  'scripts/discover-context.mjs', 'scripts/register-source.mjs',
  'scripts/concierge-run.mjs', 'scripts/test-concierge-run.mjs',
  'scripts/test-context-discovery.mjs',
  'scripts/install-system.mjs', 'scripts/system-state.mjs', 'scripts/test-install-system.mjs',
  'scripts/system-run.mjs', 'scripts/generate-operating-brief.mjs',
  'scripts/test-operating-brief.mjs',
  '.cerebro/private-ignore.manifest',
  'comunidade/inevita/sistemas-disponiveis/briefing-comercial-inteligente/manifest.json',
  'comunidade/inevita/sistemas-disponiveis/briefing-comercial-inteligente/manifest.md',
  'comunidade/inevita/sistemas-disponiveis/briefing-comercial-inteligente/pipeline.md',
  'comunidade/inevita/sistemas-disponiveis/briefing-comercial-inteligente/rotinas.md',
  'comunidade/inevita/sistemas-disponiveis/briefing-comercial-inteligente/evals.md',
  'comunidade/inevita/sistemas-disponiveis/briefing-comercial-inteligente/changelog.md',
  'comunidade/inevita/sistemas-disponiveis/briefing-comercial-inteligente/feedback.template.md',
  'comunidade/inevita/sistemas-disponiveis/briefing-comercial-inteligente/configuracao.template.md',
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
for (const forbidden of [
  'meu-negocio/',
  'operacao/',
  'sistemas/cerebro-base/feedback.md',
  'sistemas/calls/feedback.md',
  'comunidade/minhas-contribuicoes/',
]) {
  if (motor.split('\n').some((line) => line.trim().startsWith(forbidden))) {
    errors.push(`motor tenta sobrescrever caminho do dono: ${forbidden}`);
  }
}

const update = readFileSync(join(ROOT, '.claude', 'scripts', 'update.sh'), 'utf8');
for (const guard of ['operacao*', 'sistemas/*/feedback.md', 'comunidade/minhas-contribuicoes*', 'SEED_MANIFEST']) {
  if (!update.includes(guard)) errors.push(`update sem guarda: ${guard}`);
}

const ping = readFileSync(join(ROOT, '.agents', 'scripts', 'ping.mjs'), 'utf8');
for (const event of [
  'proof_delivered', 'first_value_confirmed', 'contribution_prepared', 'contribution_approved',
  'system_installed', 'system_commissioning', 'system_first_run', 'system_activated',
  'system_needs_attention',
  'system_run_started', 'system_run_completed', 'system_value_confirmed',
]) {
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
  'concierge-run.mjs start',
  '--milestone T1',
  '--milestone T2',
  '--milestone T3',
  '--milestone T4',
  'Não releia a fonte bruta',
  'Isso aproveitou o que acabamos de organizar',
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

const brainContract = readFileSync(join(ROOT, 'CLAUDE.md'), 'utf8');
for (const contract of [
  'brief vivo em `_HOJE.md`',
  'recupere até três caminhos aprovados comparáveis',
  'um run aprovado pode virar procedimento candidato',
  'diff e replay antes da decisão humana',
]) {
  if (!brainContract.includes(contract)) errors.push(`CLAUDE sem contrato vivo/procedural: ${contract}`);
}

const motorManifest = readFileSync(join(ROOT, '.cerebro', 'motor.manifest'), 'utf8');
for (const contract of [
  '.cerebro/private-ignore.manifest',
  '.claude/skills/briefing-comercial',
]) {
  if (!motorManifest.includes(contract)) errors.push(`manifesto do motor sem upgrade: ${contract}`);
}
const updater = readFileSync(join(ROOT, '.claude', 'scripts', 'update.sh'), 'utf8');
for (const contract of [
  'PRIVATE_IGNORE_MANIFEST',
  'preserva integralmente o .gitignore do dono',
]) {
  if (!updater.includes(contract)) errors.push(`atualizador sem proteção incremental: ${contract}`);
}

const operate = readFileSync(join(ROOT, '.claude', 'skills', 'operar', 'SKILL.md'), 'utf8');
for (const contract of [
  'Recuperar caminhos que já funcionaram',
  'três recibos aprovados',
  'Falha não vira procedimento',
  'procedimento candidato',
  'replay nos casos anteriores',
  'generate-operating-brief.mjs',
]) {
  if (!operate.includes(contract)) errors.push(`operar sem memória procedural: ${contract}`);
}

const reindex = readFileSync(join(ROOT, '.claude', 'skills', 'reindex', 'SKILL.md'), 'utf8');
for (const contract of [
  'Memória procedural',
  'três runs comparáveis',
  'Candidato isolado continua candidato',
  'generate-operating-brief.mjs',
]) {
  if (!reindex.includes(contract)) errors.push(`reindex sem revisão procedural: ${contract}`);
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
if (!ignore.includes('.cerebro/concierge-runs/')) {
  errors.push('relógios privados do concierge não estão protegidos pelo .gitignore');
}
if (!ignore.includes('.cerebro/sistemas/')) {
  errors.push('estado privado dos sistemas não está protegido pelo .gitignore');
}

const baseManifest = readFileSync(join(ROOT, 'sistemas', 'cerebro-base', 'manifest.md'), 'utf8');
for (const contract of ['fonte real', 'artefato aprovado', 'T0', 'T4', 'segunda utilização']) {
  if (!baseManifest.includes(contract)) errors.push(`cerebro-base sem contrato: ${contract}`);
}

const clock = readFileSync(join(ROOT, 'scripts', 'concierge-run.mjs'), 'utf8');
for (const contract of [
  "const MILESTONES = ['T0', 'T1', 'T2', 'T3', 'T4']",
  'registre ${previous} antes',
  "join(root, '.cerebro', 'concierge-runs'",
  'withinContract',
]) {
  if (!clock.includes(contract)) errors.push(`relógio do concierge sem guarda: ${contract}`);
}

const brief = readFileSync(join(ROOT, 'scripts', 'generate-operating-brief.mjs'), 'utf8');
for (const contract of [
  "'operacao', '_HOJE.md'",
  'Nenhum conteúdo foi enviado à INEVITA',
  'Disponível” confirma somente',
  'Caminho bem-sucedido só vira pipeline ou skill',
]) {
  if (!brief.includes(contract)) errors.push(`brief operacional sem contrato: ${contract}`);
}
for (const script of [
  'concierge-run.mjs',
  'register-source.mjs',
  'system-run.mjs',
  'system-state.mjs',
]) {
  const content = readFileSync(join(ROOT, 'scripts', script), 'utf8');
  if (!content.includes('generate-operating-brief.mjs')) {
    errors.push(`${script} não atualiza o brief operacional`);
  }
}

if (errors.length) {
  console.error(errors.map((e) => `✗ ${e}`).join('\n'));
  process.exit(1);
}
console.log(`✓ protocolo válido · 6 superfícies · 3 sistemas · ${claudeFiles.length} arquivos de skills sincronizados`);
