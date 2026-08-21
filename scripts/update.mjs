#!/usr/bin/env node
// Atualiza o MOTOR do cérebro (skills, gabaritos, Vale) para a última versão.
// NUNCA toca contexto, operação, feedback, conexões locais ou contribuições do dono.
//
// Por que em Node e não em bash: os agentes rodam em Windows sem WSL, onde
// curl/tar/bash não são garantidos. Node já é requisito do motor, então portar
// custa nada e devolve multiplataforma. Continua zero-dependência: o leitor de
// tar abaixo é stdlib pura.
//
// Por que RELEASE e não `main`: um commit ruim no main chegaria instantaneamente
// em todo Cérebro instalado. A casa versiona com disciplina (releases nomeadas);
// o updater passa a respeitar isso. `main` só entra como último recurso.
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { gunzipSync } from 'node:zlib';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// Caminhos que pertencem ao dono e nunca são sobrescritos — mesma trava do
// contrato anterior, agora expressa como predicado testável.
const DO_DONO = [
  /^meu-negocio/, /^capturas/, /^privado/, /^operacao/,
  /^sistemas\/[^/]+\/feedback\.md$/, /^sistemas\/outros-instalados/,
  /^conexoes\/configuradas/, /^comunidade\/minhas-contribuicoes/,
];
const ehDoDono = (item) => DO_DONO.some((re) => re.test(item));

function lerFonte() {
  const texto = existsSync(join(ROOT, '.cerebro', 'source'))
    ? readFileSync(join(ROOT, '.cerebro', 'source'), 'utf8')
    : '';
  const campo = (chave) => (texto.match(new RegExp(`^${chave}=(.+)$`, 'm')) || [])[1]?.trim();
  return { repo: campo('REPO'), branch: campo('BRANCH') || 'main' };
}

// ── leitor de tar (ustar/pax), stdlib pura ────────────────────────────────
function extrairTarGz(buffer, destino) {
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
    if (!alvo.startsWith(resolve(destino) + sep)) continue;

    if (tipo === '5') {
      mkdirSync(alvo, { recursive: true });
    } else if (tipo === '0' || tipo === '\0' || header[156] === 0) {
      mkdirSync(dirname(alvo), { recursive: true });
      writeFileSync(alvo, dados);
    }
  }
}

async function baixar(url) {
  const resposta = await fetch(url, {
    headers: { 'User-Agent': 'cerebro-inevita-updater' },
    signal: AbortSignal.timeout(60_000),
  });
  if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
  return Buffer.from(await resposta.arrayBuffer());
}

// A última release publicada; sem release (ou sem rede), cai no branch.
async function resolverOrigem(repo, branch) {
  try {
    const resposta = await fetch(`https://api.github.com/repos/${repo}/releases/latest`, {
      headers: { 'User-Agent': 'cerebro-inevita-updater', Accept: 'application/vnd.github+json' },
      signal: AbortSignal.timeout(15_000),
    });
    if (resposta.ok) {
      const tag = (await resposta.json())?.tag_name;
      if (tag) return { url: `https://github.com/${repo}/archive/refs/tags/${tag}.tar.gz`, rotulo: tag };
    }
  } catch { /* offline ou repo sem release: usa o branch */ }
  return { url: `https://github.com/${repo}/archive/refs/heads/${branch}.tar.gz`, rotulo: branch };
}

function aplicarManifesto(caminho, origem, { somenteSeFaltar }) {
  if (!existsSync(caminho)) return 0;
  let aplicados = 0;
  for (const linha of readFileSync(caminho, 'utf8').split('\n')) {
    const item = linha.trim();
    if (!item || item.startsWith('#')) continue;
    if (!existsSync(join(origem, item))) continue;

    if (somenteSeFaltar) {
      if (existsSync(join(ROOT, item))) continue;
      mkdirSync(dirname(join(ROOT, item)), { recursive: true });
      cpSync(join(origem, item), join(ROOT, item), { recursive: true });
      console.log(`  + ${item} (estrutura inicial; agora é teu)`);
      aplicados++;
      continue;
    }

    if (ehDoDono(item)) { console.log(`  (ignorando ${item} — é teu)`); continue; }
    rmSync(join(ROOT, item), { recursive: true, force: true });
    mkdirSync(dirname(join(ROOT, item)), { recursive: true });
    cpSync(join(origem, item), join(ROOT, item), { recursive: true });
    console.log(`  ✓ ${item}`);
    aplicados++;
  }
  return aplicados;
}

async function main() {
  const { repo, branch } = lerFonte();
  const temp = mkdtempSync(join(tmpdir(), 'cerebro-update-'));
  let origem;

  try {
    if (process.env.CEREBRO_UPDATE_SOURCE_DIR) {
      origem = resolve(process.env.CEREBRO_UPDATE_SOURCE_DIR); // QA local
      console.log(`→ Validando atualização local (${origem})…`);
    } else {
      if (!repo) {
        console.error('✗ Fonte de atualização não configurada em .cerebro/source');
        process.exit(1);
      }
      const { url, rotulo } = await resolverOrigem(repo, branch);
      console.log(`→ Baixando a última versão do motor (${repo}@${rotulo})…`);
      try {
        extrairTarGz(await baixar(url), temp);
      } catch {
        console.error('✗ Não consegui baixar. Confere a conexão (e o repo em .cerebro/source).');
        console.error('  Teu contexto está intacto — nada foi alterado.');
        process.exit(1);
      }
      const [raiz] = readdirSync(temp);
      origem = raiz ? join(temp, raiz) : '';
    }

    if (!origem || !existsSync(origem)) {
      console.error('✗ Pacote vazio. Nada alterado.');
      process.exit(1);
    }
    if (!existsSync(join(origem, '.cerebro', 'motor.manifest'))) {
      console.error('✗ Manifesto do motor não veio no pacote. Nada alterado.');
      process.exit(1);
    }

    const antes = lerVersao(ROOT);
    const depois = lerVersao(origem);
    console.log(`→ Atualizando ${antes} → ${depois}. Teu contexto, operação e contribuições NÃO serão tocados.`);

    aplicarManifesto(join(origem, '.cerebro', 'motor.manifest'), origem, { somenteSeFaltar: false });
    aplicarManifesto(join(origem, '.cerebro', 'seed.manifest'), origem, { somenteSeFaltar: true });

    rodarSilencioso(join(ROOT, '.claude', 'scripts', 'ensure-private-ignore.sh'));
    console.log(`✓ Motor atualizado para a versão ${depois}. Veja o que mudou em CHANGELOG.md.`);
    rodarPing();
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
}

function lerVersao(base) {
  try { return readFileSync(join(base, 'VERSION'), 'utf8').trim() || '?'; } catch { return '?'; }
}
function rodarSilencioso(script) {
  if (!existsSync(script)) return;
  try { execFileSync('bash', [script], { stdio: 'ignore' }); } catch { /* opcional */ }
}
function rodarPing() {
  try {
    execFileSync(process.execPath, [join(ROOT, '.agents', 'scripts', 'ping.mjs'), 'atualizou'], { stdio: 'ignore' });
  } catch { /* telemetria nunca bloqueia */ }
}

main().catch((erro) => {
  console.error(`✗ Falha inesperada: ${erro.message}`);
  console.error('  Teu contexto está intacto.');
  process.exit(1);
});
