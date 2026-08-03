#!/usr/bin/env node
import { copyFileSync, cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SOURCE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const TARGET_ROOT = resolve(process.env.CEREBRO_INSTALL_ROOT || SOURCE_ROOT);
const slug = String(process.argv[2] || '').trim().toLowerCase();
const confirmed = process.argv.includes('--confirm');
const dryRun = process.argv.includes('--dry-run');
const memberIdArg = (process.argv.find((arg) => arg.startsWith('--member-id='))?.slice('--member-id='.length) ?? '')
  .trim()
  .toLowerCase();
const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,63}$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PACKAGE_FILES = ['manifest.json', 'manifest.md', 'pipeline.md', 'rotinas.md', 'evals.md', 'changelog.md'];

function fail(message) {
  console.error(`✗ ${message}`);
  process.exit(1);
}

if (!SLUG_RE.test(slug)) fail('informe um system_id válido');
if (memberIdArg && !UUID_RE.test(memberIdArg)) fail('--member-id inválido: informe o UUID do participante');
const source = join(SOURCE_ROOT, 'comunidade', 'inevita', 'sistemas-disponiveis', slug);
if (!existsSync(source)) fail(`sistema não publicado neste Cérebro: ${slug}`);
for (const file of [...PACKAGE_FILES, 'feedback.template.md', 'configuracao.template.md']) {
  if (!existsSync(join(source, file))) fail(`pacote incompleto: ${file}`);
}
const packageManifest = JSON.parse(readFileSync(join(source, 'manifest.json'), 'utf8'));

// Compatibilidade compara só o núcleo x.y.z: um motor em -rc conta como a versão que antecipa.
function versionCore(value) {
  const match = String(value).trim().match(/^(\d+)\.(\d+)\.(\d+)/);
  return match ? match.slice(1, 4).map(Number) : null;
}
function atLeast(current, minimum) {
  const a = versionCore(current);
  const b = versionCore(minimum);
  if (!a || !b) return false;
  for (let i = 0; i < 3; i += 1) {
    if (a[i] !== b[i]) return a[i] > b[i];
  }
  return true;
}

if (!confirmed) {
  console.log(`Sistema: ${slug}`);
  console.log('O pacote será adicionado sem conectar fontes ou alterar o contexto.');
  console.log('Depois, o agente conduz a configuração privada e uma primeira execução real.');
  console.log(`Confirme com: node scripts/install-system.mjs ${slug} --confirm`);
  process.exit(2);
}
if (dryRun) {
  console.log(`✓ pacote válido: ${slug}`);
  process.exit(0);
}
if (!existsSync(join(TARGET_ROOT, 'COMECE-AQUI.md')) || !existsSync(join(TARGET_ROOT, 'VERSION'))) {
  fail('a pasta de destino não é um Cérebro INEVITA reconhecido');
}
const targetVersion = readFileSync(join(TARGET_ROOT, 'VERSION'), 'utf8').trim();
const minimumBrain = String(packageManifest.release?.minimum_brain_version || '').trim();
if (minimumBrain && !atLeast(targetVersion, minimumBrain)) {
  fail(`este pacote exige Cérebro >= ${minimumBrain}; o destino está em ${targetVersion}. Atualize antes de instalar.`);
}

// Costura de identidade: o comissionamento grava o member-id do participante no destino.
// Uma instalação já atribuída NUNCA é reatribuída — dado de um participante não pode
// nascer atribuído a outro (gate G1: zero dado de outro participante).
const memberIdPath = join(TARGET_ROOT, '.cerebro', 'member-id');
const existingMemberId = existsSync(memberIdPath)
  ? readFileSync(memberIdPath, 'utf8').trim().toLowerCase()
  : '';
if (memberIdArg && UUID_RE.test(existingMemberId) && existingMemberId !== memberIdArg) {
  fail('este Cérebro já pertence a outro member-id — não reatribua uma instalação; comissione a partir de base limpa');
}
const gated = packageManifest.validation?.access_mode === 'approved_participants';
if (gated && !UUID_RE.test(memberIdArg || existingMemberId)) {
  fail('pacote de acesso restrito exige a costura do participante: rode com --member-id=<uuid> (ou grave .cerebro/member-id antes)');
}
if (memberIdArg && existingMemberId !== memberIdArg) {
  mkdirSync(dirname(memberIdPath), { recursive: true });
  writeFileSync(memberIdPath, `${memberIdArg}\n`, { mode: 0o600 });
}

const target = join(TARGET_ROOT, 'sistemas', 'outros-instalados', slug);
mkdirSync(target, { recursive: true });
for (const file of PACKAGE_FILES) copyFileSync(join(source, file), join(target, file));
for (const [template, destination] of [
  ['feedback.template.md', 'feedback.md'],
  ['configuracao.template.md', 'configuracao.md'],
  ['experimento.template.md', 'experimento.md'],
]) {
  if (!existsSync(join(source, template))) continue;
  if (!existsSync(join(target, destination))) copyFileSync(join(source, template), join(target, destination));
}

// Recibo E0–E7 por run: se o pacote declara o template, a instalação o carrega e o
// system-run passa a exigir --receipt em eval=pass.
if (existsSync(join(source, 'recibo-evals.template.md'))) {
  copyFileSync(join(source, 'recibo-evals.template.md'), join(target, 'recibo-evals.template.md'));
}

// Pacote entregue fora do catálogo público pode carregar a própria skill.
// Ela é motor do sistema: instala nos dois runtimes e é sobrescrita em atualização do pacote.
if (existsSync(join(source, 'skill', 'SKILL.md'))) {
  for (const runtime of ['.claude', '.agents']) {
    const skillTarget = join(TARGET_ROOT, runtime, 'skills', slug);
    mkdirSync(skillTarget, { recursive: true });
    cpSync(join(source, 'skill'), skillTarget, { recursive: true });
  }
}

const catalogPath = join(TARGET_ROOT, 'sistemas', 'outros-instalados', '_CATALOGO.md');
mkdirSync(dirname(catalogPath), { recursive: true });
const start = `<!-- system:${slug}:start -->`;
const end = `<!-- system:${slug}:end -->`;
const entry = `${start}\n- [${packageManifest.name || slug}](${slug}/manifest.md) · pacote adicionado · \`operar ${slug}\`\n${end}`;
let catalog = existsSync(catalogPath)
  ? readFileSync(catalogPath, 'utf8')
  : '# Sistemas adicionados\n\nA configuração e o feedback continuam privados neste Cérebro.\n';
const pattern = new RegExp(`${start}[\\s\\S]*?${end}`);
catalog = pattern.test(catalog) ? catalog.replace(pattern, entry) : `${catalog.trim()}\n\n${entry}\n`;
writeFileSync(catalogPath, catalog.endsWith('\n') ? catalog : `${catalog}\n`);

const stateDir = join(TARGET_ROOT, '.cerebro', 'sistemas');
mkdirSync(stateDir, { recursive: true });
const statePath = join(stateDir, `${slug}.json`);
const hadState = existsSync(statePath);
const previous = hadState ? JSON.parse(readFileSync(statePath, 'utf8')) : {};
writeFileSync(statePath, `${JSON.stringify({
  ...previous,
  system_id: slug,
  package_version: packageManifest.release.version,
  release_channel: packageManifest.release.channel,
  validation_stage: packageManifest.validation.stage,
  status: previous.status || 'package_added',
  updated_at: new Date().toISOString(),
}, null, 2)}\n`, { mode: 0o600 });

const receiptDir = join(TARGET_ROOT, 'operacao', 'execucoes');
mkdirSync(receiptDir, { recursive: true });
const now = new Date();
const stamp = now.toISOString().replace(/[:.]/g, '-');
writeFileSync(join(receiptDir, `${stamp}-pacote-${slug}.md`), [
  `# Pacote adicionado — ${slug}`,
  '',
  `- quando: ${now.toISOString()}`,
  '- estado: pacote adicionado; ainda não ativo',
  '- fontes conectadas: nenhuma',
  '- contexto alterado: não',
  '- próximo passo: configuração guiada com uma reunião real',
  '',
].join('\n'));

if (!hadState) {
  spawnSync(process.execPath, [join(SOURCE_ROOT, '.agents', 'scripts', 'ping.mjs'), 'system_installed', slug], {
    cwd: TARGET_ROOT,
    env: process.env,
    stdio: 'ignore',
    timeout: 2500,
  });
}

console.log(`✓ pacote ${slug} adicionado; o sistema ainda não está ativo`);
console.log(`Próximo passo: peça ao agente para operar ${slug} com uma reunião real.`);
