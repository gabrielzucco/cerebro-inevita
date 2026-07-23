#!/usr/bin/env node
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SOURCE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const TARGET_ROOT = resolve(process.env.CEREBRO_INSTALL_ROOT || SOURCE_ROOT);
const slug = String(process.argv[2] || '').trim().toLowerCase();
const confirmed = process.argv.includes('--confirm');
const dryRun = process.argv.includes('--dry-run');
const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,63}$/;
const PACKAGE_FILES = ['manifest.md', 'pipeline.md', 'rotinas.md', 'evals.md', 'changelog.md'];

function fail(message) {
  console.error(`✗ ${message}`);
  process.exit(1);
}

if (!SLUG_RE.test(slug)) fail('informe um system_id válido');
const source = join(SOURCE_ROOT, 'comunidade', 'inevita', 'sistemas-disponiveis', slug);
if (!existsSync(source)) fail(`sistema não publicado neste Cérebro: ${slug}`);
for (const file of [...PACKAGE_FILES, 'feedback.template.md', 'configuracao.template.md']) {
  if (!existsSync(join(source, file))) fail(`pacote incompleto: ${file}`);
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

const target = join(TARGET_ROOT, 'sistemas', 'outros-instalados', slug);
mkdirSync(target, { recursive: true });
for (const file of PACKAGE_FILES) copyFileSync(join(source, file), join(target, file));
for (const [template, destination] of [
  ['feedback.template.md', 'feedback.md'],
  ['configuracao.template.md', 'configuracao.md'],
]) {
  if (!existsSync(join(target, destination))) copyFileSync(join(source, template), join(target, destination));
}

const catalogPath = join(TARGET_ROOT, 'sistemas', 'outros-instalados', '_CATALOGO.md');
mkdirSync(dirname(catalogPath), { recursive: true });
const start = `<!-- system:${slug}:start -->`;
const end = `<!-- system:${slug}:end -->`;
const entry = `${start}\n- [Briefing Comercial Inteligente](${slug}/manifest.md) · pacote adicionado · \`operar ${slug}\`\n${end}`;
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
  package_version: '0.1.0',
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
