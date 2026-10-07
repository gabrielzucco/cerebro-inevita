#!/usr/bin/env node
// Prévia por padrão. Aplicação limitada aos arquivos concretos do pacote, sem remoções.
import {
  existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync,
  renameSync, rmSync, writeFileSync, chmodSync, realpathSync,
} from 'node:fs';
import { createHash, randomUUID } from 'node:crypto';
import { gunzipSync } from 'node:zlib';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const BEGIN = '<!-- INEVITA:MANAGED:BEGIN -->';
export const END = '<!-- INEVITA:MANAGED:END -->';
export const TAG_RE = /^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z]+(?:[.-][0-9A-Za-z]+)*)?$/;
const REPO_RE = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
const STATE = '.cerebro/update-state.json';
const BACKUPS = '.cerebro/update-backups';
const LOCK = '.cerebro/update.lock';
const DO_DONO = [
  /^(?:meu-negocio|capturas|privado|operacao)(?:\/|$)/,
  /^sistemas\/[^/]+\/feedback\.md$/, /^sistemas\/outros-instalados(?:\/|$)/,
  /^conexoes\/configuradas(?:\/|$)/, /^comunidade\/minhas-contribuicoes(?:\/|$)/,
  /^\.cerebro\/(?:contracts|ledger|learning|sistemas|runtime|concierge-runs|update-backups)(?:\/|$)/,
  /^\.cerebro\/(?:id|member-id|install-credential|install-activation-outbox\.json|acesso-email|acesso-dispensado|sem-telemetria|operator-runtime|update-state\.json|update\.lock)$/,
];
const ehDoDono = item => DO_DONO.some(re => re.test(item));
export const hash = bytes => createHash('sha256').update(bytes).digest('hex');

function stat(path) {
  try { return lstatSync(path); } catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}

export function safePath(root, item) {
  if (typeof item !== 'string' || !item || /[\\:\x00-\x1f]/.test(item)
      || item.startsWith('/') || item.split('/').some(part => !part || part === '..' || part === '.' || part.toLowerCase() === '.git')) {
    throw new Error('unsafe-package-path');
  }
  let path = resolve(root);
  if (stat(path)?.isSymbolicLink()) throw new Error('symlink-root');
  const parts = item.split('/');
  for (const [index, part] of parts.entries()) {
    path = join(path, part);
    const info = stat(path);
    if (info?.isSymbolicLink()) throw new Error(`symlink-blocked: ${item}`);
    if (info && index < parts.length - 1 && !info.isDirectory()) throw new Error(`parent-not-directory: ${item}`);
  }
  return path;
}

function bytesAt(root, item) {
  const path = safePath(root, item);
  const info = stat(path);
  if (!info) return null;
  if (!info.isFile()) throw new Error(`not-regular-file: ${item}`);
  return readFileSync(path);
}

function manifestFiles(source, name, required = false) {
  const bytes = bytesAt(source, `.cerebro/${name}`);
  if (!bytes && required) throw new Error('motor-manifest-missing');
  const files = new Set();
  function visit(item) {
    const path = safePath(source, item);
    const info = stat(path);
    if (!info) return; // manifests antigos podem conter entradas retiradas do pacote
    if (info.isDirectory()) for (const child of readdirSync(path).sort()) visit(`${item}/${child}`);
    else if (info.isFile()) files.add(item);
    else throw new Error('package-entry-unsupported');
  }
  for (const line of (bytes?.toString('utf8') || '').split('\n')) {
    const item = line.trim().replace(/\/$/, '');
    if (item && !item.startsWith('#')) visit(item);
  }
  return [...files].sort();
}

function managedBlock(text) {
  const starts = text.split(BEGIN).length - 1;
  const ends = text.split(END).length - 1;
  if (!starts && !ends) return null;
  const start = text.indexOf(BEGIN), end = text.indexOf(END) + END.length;
  if (starts !== 1 || ends !== 1 || end <= start) throw new Error('claude-markers-invalid');
  return { start, end, text: text.slice(start, end) };
}

export function mergeClaude(local, incoming) {
  const incomingText = incoming.toString('utf8');
  const supplied = managedBlock(incomingText);
  const block = supplied?.text || `${BEGIN}\n${incomingText.trimEnd()}\n${END}`;
  const text = local?.toString('utf8') || '';
  const current = managedBlock(text);
  // Sem marcador, TODO o arquivo legado pertence ao membro, incluindo regras antigas.
  return Buffer.from(current
    ? text.slice(0, current.start) + block + text.slice(current.end)
    : text + (text && !text.endsWith('\n') ? '\n' : '') + (text ? '\n' : '') + block + '\n');
}

export function planUpdate(root, source, tag, { baseline = null } = {}) {
  if (!TAG_RE.test(tag || '')) throw new Error('explicit-tag-required: use --tag vX.Y.Z');
  if (resolve(root) === resolve(source)) throw new Error('source-is-destination');
  if (bytesAt(source, 'VERSION')?.toString('utf8').trim() !== tag.slice(1)) throw new Error('package-version-mismatch');
  const stateBytes = bytesAt(root, STATE);
  const state = stateBytes ? JSON.parse(stateBytes) : { files: {} };
  if (stateBytes && (state.schema !== 1 || !state.files || typeof state.files !== 'object')) throw new Error('update-state-invalid');
  if (baseline && bytesAt(baseline, 'VERSION')?.toString('utf8').trim()
      !== bytesAt(root, 'VERSION')?.toString('utf8').trim()) throw new Error('baseline-version-mismatch');
  const changes = new Map();
  const owned = {};
  function add(item, incoming, kind) {
    const before = bytesAt(root, item);
    const after = item === 'CLAUDE.md' ? mergeClaude(before, incoming) : incoming;
    const beforeHash = before === null ? null : hash(before);
    const afterHash = hash(after);
    const baselineBytes = baseline ? bytesAt(baseline, item) : null;
    const previousHash = state.files[item] ?? (baselineBytes === null ? null : hash(baselineBytes));
    const action = beforeHash === afterHash ? 'unchanged' : before === null ? 'create' : 'replace';
    const conflict = action === 'replace' && kind === 'motor' && item !== 'CLAUDE.md'
      && previousHash !== beforeHash;
    changes.set(item, { path: item, kind, action, conflict, beforeHash, afterHash, before, after,
      mode: stat(safePath(root, item))?.mode & 0o777 || 0o644 });
    if (kind === 'motor') owned[item] = afterHash;
  }
  const motor = manifestFiles(source, 'motor.manifest', true).filter(item => !ehDoDono(item));
  if (!motor.includes('VERSION')) throw new Error('version-not-in-manifest');
  for (const item of motor) add(item, bytesAt(source, item), 'motor');
  for (const item of manifestFiles(source, 'seed.manifest')) {
    // Seeds nunca sobrescrevem nem adotam arquivo existente, mesmo dentro de diretório.
    if (!changes.has(item) && bytesAt(root, item) === null) add(item, bytesAt(source, item), 'seed');
  }
  // Regras locais preservadas; backups privados não podem entrar no Git.
  const ignore = bytesAt(root, '.gitignore')?.toString('utf8') || '';
  const rules = ['.gitignore', '.cerebro/private-ignore.manifest']
    .flatMap(item => (bytesAt(source, item)?.toString('utf8') || '').split(/\r?\n/))
    .filter(line => line && !line.startsWith('#'));
  rules.push(`${BACKUPS}/`, STATE, LOCK);
  const missing = [...new Set(rules)].filter(rule => !ignore.split(/\r?\n/).includes(rule));
  if (missing.length) add('.gitignore', Buffer.from(ignore + (ignore && !ignore.endsWith('\n') ? '\n' : '') + missing.join('\n') + '\n'), 'privacy');
  add(STATE, Buffer.from(JSON.stringify({ schema: 1, tag, files: owned }, null, 2) + '\n'), 'receipt');
  safePath(root, LOCK);
  safePath(root, BACKUPS);
  const entries = [...changes.values()].sort((a, b) => a.path.localeCompare(b.path));
  const summary = entries.map(({ before, after, ...entry }) => entry);
  const digest = hash(JSON.stringify({ root: resolve(root), tag, entries: summary }));
  return { tag, digest, conflicts: summary.filter(entry => entry.conflict).map(entry => entry.path), entries, summary };
}

export function applyPlan(root, plan, { approvePlan, write = atomicWrite } = {}) {
  if (plan.conflicts.length) throw new Error(`update-conflicts: ${plan.conflicts.join(', ')}`);
  if (approvePlan && approvePlan !== plan.digest) throw new Error('plan-changed: preview again');
  const mutations = plan.entries.filter(entry => entry.action !== 'unchanged');
  if (mutations.length && bytesAt(root, 'VERSION') !== null && approvePlan !== plan.digest) {
    throw new Error('preview-approval-required: use --approve-plan <plan-hash>');
  }
  const lock = safePath(root, LOCK);
  mkdirSync(dirname(lock), { recursive: true });
  writeFileSync(lock, String(process.pid), { flag: 'wx', mode: 0o600 });
  let backup;
  const applied = [];
  try {
    for (const entry of plan.entries) {
      const current = bytesAt(root, entry.path);
      if ((current === null ? null : hash(current)) !== entry.beforeHash) throw new Error('destination-changed: preview again');
    }
    if (!mutations.length) return null;
    backup = safePath(root, `${BACKUPS}/${randomUUID()}`);
    mkdirSync(backup, { recursive: true, mode: 0o700 });
    for (const entry of mutations) {
      if (entry.before !== null) {
        const path = join(backup, 'files', entry.path);
        mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
        writeFileSync(path, entry.before, { mode: 0o600 });
      }
    }
    writeFileSync(join(backup, 'receipt.json'), JSON.stringify({ tag: plan.tag, digest: plan.digest, files: plan.summary }, null, 2), { mode: 0o600 });
    // VERSION é a última escrita: uma instalação parcial não anuncia versão nova.
    mutations.sort((a, b) => Number(a.path === 'VERSION') - Number(b.path === 'VERSION'));
    for (const entry of mutations) {
      applied.push(entry);
      write(safePath(root, entry.path), entry.after, entry.mode);
    }
    return backup;
  } catch (error) {
    for (const entry of applied.reverse()) {
      const path = safePath(root, entry.path);
      if (entry.before === null) rmSync(path, { force: true });
      else atomicWrite(path, entry.before, entry.mode);
    }
    throw error;
  } finally {
    rmSync(lock, { force: true });
  }
}

function atomicWrite(path, bytes, mode) {
  mkdirSync(dirname(path), { recursive: true });
  const temporary = `${path}.update-${randomUUID()}`;
  try {
    writeFileSync(temporary, bytes, { flag: 'wx', mode });
    chmodSync(temporary, mode);
    renameSync(temporary, path);
  } finally { rmSync(temporary, { force: true }); }
}

// ── leitor de tar (ustar/pax), stdlib pura ────────────────────────────────
export function extrairTarGz(buffer, destino) {
  const tar = gunzipSync(buffer);
  let offset = 0;
  let nomeLongoPendente = null;

  while (offset + 512 <= tar.length) {
    const header = tar.subarray(offset, offset + 512);
    if (header.every((b) => b === 0)) break; // fim do arquivo

    const bruto = header.subarray(0, 100).toString('utf8').replace(/\0.*$/, '');
    const prefixo = header.subarray(345, 500).toString('utf8').replace(/\0.*$/, '');
    const tipo = String.fromCharCode(header[156] || 48);
    const tamanho = parseInt(header.subarray(124, 136).toString('utf8').replace(/\0.*$/, '').trim() || '0', 8) || 0;
    if (offset + 512 + tamanho > tar.length) throw new Error('archive-truncated');
    const dados = tar.subarray(offset + 512, offset + 512 + tamanho);
    offset += 512 + Math.ceil(tamanho / 512) * 512;

    if (tipo === 'L') { // GNU long name
      nomeLongoPendente = dados.toString('utf8').replace(/\0.*$/, '');
      continue;
    }
    if (tipo === 'x' || tipo === 'g') continue; // headers pax: ignorados

    const nome = nomeLongoPendente ?? (prefixo ? `${prefixo}/${bruto}` : bruto);
    nomeLongoPendente = null;
    if (!nome) continue;

    // trava anti path traversal: nada sai do destino
    const alvo = resolve(destino, nome);
    if (!alvo.startsWith(resolve(destino) + sep) || nome.includes('\\')) throw new Error('archive-path-invalid');

    if (tipo === '5') {
      mkdirSync(alvo, { recursive: true });
    } else if (tipo === '0' || tipo === '\0' || header[156] === 0) {
      mkdirSync(dirname(alvo), { recursive: true });
      writeFileSync(alvo, dados);
    } else {
      throw new Error('archive-entry-unsupported');
    }
  }
}


export function releaseUrl(repo, tag) {
  if (!REPO_RE.test(repo || '')) throw new Error('update-source-invalid');
  if (!TAG_RE.test(tag || '')) throw new Error('explicit-tag-required: use --tag vX.Y.Z');
  return `https://github.com/${repo}/archive/refs/tags/${tag}.tar.gz`;
}

export async function downloadPackage(repo, tag, destination) {
  const response = await fetch(releaseUrl(repo, tag), {
    headers: { 'User-Agent': 'cerebro-inevita-updater' }, signal: AbortSignal.timeout(60_000),
  });
  if (!response.ok) throw new Error(`package-download-failed: HTTP ${response.status}`);
  extrairTarGz(Buffer.from(await response.arrayBuffer()), destination);
  const roots = readdirSync(destination);
  if (roots.length !== 1) throw new Error('package-root-invalid');
  return join(destination, roots[0]);
}

function args(argv) {
  const options = { root: ROOT, apply: false };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--apply') options.apply = true;
    else if (['--tag', '--root', '--approve-plan', '--baseline-dir'].includes(argv[i]) && argv[i + 1] && !argv[i + 1].startsWith('--')) {
      options[argv[i].slice(2)] = argv[++i];
    } else throw new Error('usage: update.mjs --tag vX.Y.Z [--root path] [--baseline-dir path] [--apply] [--approve-plan hash]');
  }
  if (!TAG_RE.test(options.tag || '')) throw new Error('explicit-tag-required: use --tag vX.Y.Z');
  return options;
}

async function main() {
  const options = args(process.argv.slice(2));
  const root = resolve(options.root);
  const temp = mkdtempSync(join(tmpdir(), 'cerebro-update-'));
  try {
    const config = bytesAt(root, '.cerebro/source')?.toString('utf8') || '';
    const repo = config.match(/^REPO=(.+)$/m)?.[1]?.trim();
    const source = process.env.CEREBRO_UPDATE_SOURCE_DIR
      ? resolve(process.env.CEREBRO_UPDATE_SOURCE_DIR)
      : await downloadPackage(repo, options.tag, temp);
    const plan = planUpdate(root, source, options.tag, { baseline: options['baseline-dir'] && resolve(options['baseline-dir']) });
    console.log(JSON.stringify({ mode: 'preview', tag: plan.tag, plan_hash: plan.digest,
      conflicts: plan.conflicts, files: plan.summary }, null, 2));
    if (!options.apply) return;
    const backup = applyPlan(root, plan, { approvePlan: options['approve-plan'] });
    console.log(`✓ Motor atualizado para ${options.tag}. Backup local: ${backup || 'sem alterações'}`);
    // O pós-update legado migra armazenamento privado; é uma ação separada e visível.
    // Não executar código baixado fora do plano de arquivos nem telemetria durante update.
    if (stat(safePath(root, '.cerebro/runtime'))?.isFile()) {
      console.log('RUNTIME_LEGADO: revise scripts/post-update.mjs e aprove a migração de armazenamento separadamente.');
    }
  } finally { rmSync(temp, { recursive: true, force: true }); }
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(`✗ ${error.message}`); process.exitCode = 1; });
}
