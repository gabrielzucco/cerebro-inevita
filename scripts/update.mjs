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
import { cpSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { gunzipSync } from 'node:zlib';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const ROOT = process.env.CEREBRO_UPDATE_TARGET_DIR
  ? resolve(process.env.CEREBRO_UPDATE_TARGET_DIR)
  : resolve(dirname(fileURLToPath(import.meta.url)), '..');

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

// A última release publicada. A CLI histórica ainda pode cair no branch, mas o
// Console gerenciado exige uma release imutável para nunca transformar `main`
// num update silencioso de produção.
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
  } catch { /* tratado abaixo conforme o canal solicitado */ }
  if (process.env.CEREBRO_UPDATE_REQUIRE_RELEASE === '1') {
    throw new Error('release publicada indisponível; atualização gerenciada cancelada');
  }
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

function itensDoManifesto(caminho) {
  if (!existsSync(caminho)) return [];
  return readFileSync(caminho, 'utf8').split(/\r?\n/)
    .map((linha) => linha.trim())
    .filter((item) => item && !item.startsWith('#') && !ehDoDono(item));
}

function arquivosGerenciados(base, item) {
  const inicio = join(base, item);
  if (!existsSync(inicio)) return [];
  const info = lstatSync(inicio);
  if (info.isSymbolicLink()) throw new Error(`pacote contém link simbólico gerenciado: ${item}`);
  if (info.isFile()) return [item];
  if (!info.isDirectory()) throw new Error(`tipo de arquivo não suportado no pacote: ${item}`);
  const encontrados = [];
  const visitar = (diretorio) => {
    for (const entrada of readdirSync(diretorio, { withFileTypes: true })) {
      const caminho = join(diretorio, entrada.name);
      const rel = relative(base, caminho).replaceAll('\\', '/');
      if (entrada.isSymbolicLink()) throw new Error(`pacote contém link simbólico gerenciado: ${rel}`);
      if (entrada.isDirectory()) visitar(caminho);
      else if (entrada.isFile()) encontrados.push(rel);
      else throw new Error(`tipo de arquivo não suportado no pacote: ${rel}`);
    }
  };
  visitar(inicio);
  return encontrados.sort();
}

function arquivoIgual(esquerda, direita) {
  return existsSync(esquerda) && existsSync(direita)
    && lstatSync(esquerda).isFile() && lstatSync(direita).isFile()
    && readFileSync(esquerda).equals(readFileSync(direita));
}

function caminhoLocalSeguro(rel) {
  let atual = ROOT;
  for (const parte of rel.split('/').slice(0, -1)) {
    atual = join(atual, parte);
    if (existsSync(atual) && lstatSync(atual).isSymbolicLink()) return false;
  }
  return true;
}

function planejarAtualizacao(origem, baseline) {
  const itens = new Set([
    ...itensDoManifesto(join(origem, '.cerebro', 'motor.manifest')),
    ...itensDoManifesto(join(baseline, '.cerebro', 'motor.manifest')),
  ]);
  const novos = new Set([...itens].flatMap((item) => arquivosGerenciados(origem, item)));
  const antigos = new Set([...itens].flatMap((item) => arquivosGerenciados(baseline, item)));
  const todos = [...new Set([...novos, ...antigos])].sort();
  const copiar = [];
  const remover = [];
  const conflitos = [];

  for (const rel of todos) {
    const local = join(ROOT, rel);
    const novo = join(origem, rel);
    const antigo = join(baseline, rel);
    if (!caminhoLocalSeguro(rel)) { conflitos.push(`${rel} (pai é link simbólico)`); continue; }
    if (existsSync(local) && lstatSync(local).isSymbolicLink()) { conflitos.push(`${rel} (link simbólico local)`); continue; }
    const temNovo = novos.has(rel);
    const temAntigo = antigos.has(rel);
    const temLocal = existsSync(local);

    if (temNovo) {
      if (!temLocal) { copiar.push(rel); continue; }
      if (!lstatSync(local).isFile()) { conflitos.push(`${rel} (tipo local divergente)`); continue; }
      if (arquivoIgual(local, novo)) continue;
      if (temAntigo && arquivoIgual(local, antigo)) { copiar.push(rel); continue; }
      conflitos.push(rel);
      continue;
    }
    if (temAntigo && temLocal) {
      if (arquivoIgual(local, antigo)) remover.push(rel);
      else conflitos.push(rel);
    }
  }
  return { copiar, remover, conflitos };
}

function aplicarPlano(plano, origem) {
  for (const rel of plano.copiar) {
    mkdirSync(dirname(join(ROOT, rel)), { recursive: true });
    cpSync(join(origem, rel), join(ROOT, rel));
  }
  for (const rel of plano.remover) rmSync(join(ROOT, rel), { force: true });
}

async function resolverBaseline(repo, versao, origem, temp) {
  if (process.env.CEREBRO_UPDATE_BASE_DIR) return resolve(process.env.CEREBRO_UPDATE_BASE_DIR);
  if (lerVersao(origem) === versao) return origem;
  if (!repo || !/^\d+\.\d+\.\d+(?:[-+].+)?$/.test(versao)) {
    throw new Error('baseline da versão instalada indisponível');
  }
  const destino = join(temp, 'baseline');
  mkdirSync(destino, { recursive: true });
  let pacote;
  try {
    pacote = await baixar(`https://github.com/${repo}/archive/refs/tags/v${versao}.tar.gz`);
  } catch {
    pacote = await baixar(`https://github.com/${repo}/archive/refs/tags/${versao}.tar.gz`);
  }
  extrairTarGz(pacote, destino);
  const [raiz] = readdirSync(destino);
  if (!raiz) throw new Error('baseline da versão instalada vazio');
  return join(destino, raiz);
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
    const baseline = await resolverBaseline(repo, antes, origem, temp);
    const plano = planejarAtualizacao(origem, baseline);
    if (plano.conflitos.length) {
      console.error('✗ Atualização cancelada: existem alterações locais em arquivos do motor.');
      for (const conflito of plano.conflitos.slice(0, 20)) console.error(`  conflito: ${conflito}`);
      if (plano.conflitos.length > 20) console.error(`  e mais ${plano.conflitos.length - 20} conflito(s)`);
      console.error('  Nenhum arquivo foi alterado. Preserve as mudanças e resolva o conflito antes de tentar novamente.');
      process.exitCode = 2;
      return;
    }
    aplicarPlano(plano, origem);
    console.log(`  ✓ ${plano.copiar.length} arquivo(s) do motor atualizados; ${plano.remover.length} obsoleto(s) removidos`);
    aplicarManifesto(join(origem, '.cerebro', 'seed.manifest'), origem, { somenteSeFaltar: true });

    rodarSilencioso(join(ROOT, '.claude', 'scripts', 'ensure-private-ignore.sh'));
    console.log(`✓ Motor atualizado para a versão ${depois}. Veja o que mudou em CHANGELOG.md.`);
    rodarPing();
    // O updater que EXECUTA é sempre o da versão ANTIGA — foi assim que o aviso
    // da v1.34.1 não apareceu para quem subiu 1.33.0 → 1.34.1 (o script rodando
    // não o tinha). A partir daqui, o pós-update roda do PACOTE BAIXADO: uma
    // versão nova pode entregar comportamento pós-update que vale já na subida.
    if (!rodarPosUpdateDoPacote(origem)) avisarVinculoSeFaltar();
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
// Instalação sem credencial nem e-mail é órfã: funciona local, mas ninguém consegue
// entregar atualização dirigida, recuperação de acesso ou comunidade pra ela. O aviso
// sai no stdout porque é o agente que conduz a atualização quem resolve — a skill
// `atualizar` trata o marcador. Nunca bloqueia nem interrompe a atualização em si.
// Executa o post-update.mjs do pacote recém-baixado, se existir. Falha nunca
// interrompe: a atualização em si já terminou com sucesso.
function rodarPosUpdateDoPacote(origem) {
  const script = join(origem, 'scripts', 'post-update.mjs');
  if (!existsSync(script)) return false;
  try {
    execFileSync(process.execPath, [script, '--root', ROOT], { stdio: 'inherit' });
    return true;
  } catch {
    return false;
  }
}

function avisarVinculoSeFaltar() {
  const temCredencial = existsSync(join(ROOT, '.cerebro', 'install-credential'));
  const temEmail = existsSync(join(ROOT, '.cerebro', 'acesso-email'));
  const dispensado = existsSync(join(ROOT, '.cerebro', 'acesso-dispensado'));
  if (temCredencial || temEmail || dispensado) return;
  console.log('');
  console.log('VINCULO_DE_ACESSO_PENDENTE: esta instalação ainda não tem dono.');
  console.log('  Agente: entregue primeiro um output útil e então ofereça, uma única vez, o');
  console.log('  vínculo pelo e-mail de acesso; grave só o e-mail em .cerebro/acesso-email (uma linha,');
  console.log('  modo 0600) e rode `node .agents/scripts/ping.mjs sessao`. O e-mail fica fora');
  console.log('  das notas e do Git. Se ela recusar, registre acesso-dispensado e continue.');
}

main().catch((erro) => {
  console.error(`✗ Falha inesperada: ${erro.message}`);
  console.error('  Teu contexto está intacto.');
  process.exit(1);
});
