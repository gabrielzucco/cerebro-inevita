#!/usr/bin/env node
// Congela e verifica o pré-registro de UM experimento de um sistema.
// "Append-only" deixa de ser só regra escrita: o freeze sela por hash a REGIÃO IMUTÁVEL
// (do marcador "### Pré-registro" até "### Emendas"); estado operacional, emendas, execução e
// leitura ficam fora e continuam livres. Um lock por experiment-id — EXP-002 congela sem
// conflitar com EXP-001.
//
// Uso: node scripts/system-experiment.mjs <system_id> <freeze|verify> [--file=experimentos/EXP-002.md]
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = process.env.CEREBRO_INSTALL_ROOT
  ? resolve(process.env.CEREBRO_INSTALL_ROOT)
  : resolve(dirname(fileURLToPath(import.meta.url)), '..');
const slug = String(process.argv[2] || '').trim().toLowerCase();
const action = String(process.argv[3] || '').trim().toLowerCase();
const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,63}$/;
const PRE_MARKER = '### Pré-registro';
const AMEND_MARKER = '### Emendas';
const EXP_ID_RE = /^##\s+(EXP-[A-Za-z0-9_-]+)\s*$/m;
const REQUIRED_FIELDS = [
  'dono da leitura', 'baseline', 'hipótese', 'mudança única',
  'métrica primária', 'guardrail', 'janela de leitura', 'regra de decisão',
];

function fail(message) {
  console.error(`✗ ${message}`);
  process.exit(1);
}

function option(name) {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length) ?? '';
}

if (!SLUG_RE.test(slug)) fail('informe um system_id válido');
if (!['freeze', 'verify'].includes(action)) fail('ação válida: freeze ou verify');

const relativeFile = option('file') || 'experimento.md';
const experimentPath = join(ROOT, 'sistemas', 'outros-instalados', slug, relativeFile);
if (!existsSync(experimentPath)) fail(`experimento não encontrado: ${experimentPath}`);
const content = readFileSync(experimentPath, 'utf8');

const idMatch = content.match(EXP_ID_RE);
if (!idMatch) fail('o arquivo não declara um experimento (`## EXP-<numero>`)');
const expId = idMatch[1];

const preIndex = content.indexOf(PRE_MARKER);
if (preIndex === -1) fail(`região selada não encontrada: falta o marcador "${PRE_MARKER}"`);
const amendIndex = content.indexOf(AMEND_MARKER, preIndex);
if (amendIndex === -1) fail(`região selada sem fim: falta o marcador "${AMEND_MARKER}"`);
const preRegistration = content.slice(preIndex, amendIndex);
const hash = createHash('sha256').update(preRegistration, 'utf8').digest('hex');

const lockPath = join(ROOT, '.cerebro', 'sistemas', `${slug}-${expId}.lock.json`);

if (action === 'freeze') {
  // Template vazio não é pré-registro: cada campo obrigatório precisa de conteúdo real.
  const lines = preRegistration.split('\n');
  const empty = REQUIRED_FIELDS.filter((field) => {
    const line = lines.find((l) => l.trim().toLowerCase().startsWith(`- ${field}`));
    if (!line) return true;
    const colon = line.indexOf(':');
    return colon === -1 || line.slice(colon + 1).trim().length === 0;
  });
  if (empty.length > 0) {
    fail(`pré-registro incompleto — preencha antes de congelar: ${empty.join(' · ')}`);
  }
  if (existsSync(lockPath)) {
    const lock = JSON.parse(readFileSync(lockPath, 'utf8'));
    fail(`${expId} já congelado em ${lock.frozen_at}; correção é emenda, nunca recongelamento`);
  }
  const frozenAt = new Date().toISOString();
  mkdirSync(dirname(lockPath), { recursive: true });
  writeFileSync(lockPath, `${JSON.stringify({
    system_id: slug,
    experiment_id: expId,
    file: relativeFile,
    frozen_at: frozenAt,
    sha256: hash,
    pre_registration_bytes: Buffer.byteLength(preRegistration, 'utf8'),
  }, null, 2)}\n`, { mode: 0o600 });

  const receiptDir = join(ROOT, 'operacao', 'execucoes');
  mkdirSync(receiptDir, { recursive: true });
  const stamp = frozenAt.replace(/[:.]/g, '-');
  writeFileSync(join(receiptDir, `${stamp}-freeze-${expId}-${slug}.md`), [
    `# Pré-registro congelado — ${expId} (${slug})`,
    '',
    `- quando: ${frozenAt}`,
    `- arquivo: ${relativeFile}`,
    `- sha256 da região selada: ${hash}`,
    '- regra: a partir daqui, correção é emenda numerada; critério não se edita depois do dado',
    `- verificação: node scripts/system-experiment.mjs ${slug} verify --file=${relativeFile}`,
    '',
  ].join('\n'));
  console.log(`✓ ${expId}: pré-registro congelado (${hash.slice(0, 12)}…); estado e emendas continuam livres`);
  process.exit(0);
}

if (!existsSync(lockPath)) fail(`${expId} nunca foi congelado; rode freeze antes de lançar a mudança`);
const lock = JSON.parse(readFileSync(lockPath, 'utf8'));
if (lock.sha256 === hash) {
  console.log(`✓ ${expId}: pré-registro íntegro desde ${lock.frozen_at}`);
  process.exit(0);
}
console.error(`✗ ${expId}: PRÉ-REGISTRO ALTERADO APÓS O CONGELAMENTO (${lock.frozen_at}).`);
console.error('  A leitura deste experimento está comprometida: trate como inconclusivo,');
console.error('  registre o ocorrido como emenda e leve o sistema a needs_attention.');
process.exit(1);
