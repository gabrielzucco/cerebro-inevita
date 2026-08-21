// Gates determinísticos do sistema Calls em Decisões.
//
// A regra que governa este arquivo: o gate cobra o que a skill `call` e o
// `sistemas/calls/evals.md` JÁ pedem — ele não inventa contrato novo. E cobra
// em CÓDIGO porque checklist em prosa é auditada por quem ela deveria auditar:
// o próprio agente. Código não bajula (lição SWE-bench Verified: verificação
// executável > nota de juiz).
//
// O que fica de FORA por desenho (v0): "número ambíguo confirmado" e "isso é
// acionável?" exigem julgamento — entram só com juiz calibrado contra rótulo
// humano (protocolo EXP-013-A2: concordância medida antes de delegar).

const RE_TIMESTAMP = /\b\d{1,2}:\d{2}(?::\d{2})?\b/;
const ESCAPE_SEM_FONTE = '(não consta na fonte)';

// PII que nunca deve aparecer no garimpo — participantes viram papel, não nome.
const RE_PII = [
  { nome: 'e-mail', re: /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i },
  { nome: 'telefone', re: /(?:\+?55\s?)?(?:\(?\d{2}\)?\s?)?9?\d{4}[-.\s]\d{4}\b/ },
  { nome: 'cpf', re: /\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/ },
];

function normalizar(texto) {
  return texto.replace(/\s+/g, ' ').trim();
}

function linhas(texto) {
  return texto.split('\n');
}

// Citações do garimpo: blockquotes (`> …`). É o formato que a skill produz
// quando prova um achado com a fala literal da pessoa.
function extrairCitacoes(garimpo) {
  const citacoes = [];
  for (const [i, linha] of linhas(garimpo).entries()) {
    const m = linha.match(/^\s*>\s*(.+)$/);
    if (!m) continue;
    const corpo = m[1].trim();
    if (!corpo || corpo.startsWith('>')) continue;
    citacoes.push({ linha: i + 1, texto: corpo });
  }
  return citacoes;
}

// G1 — toda citação é LITERAL: o texto citado existe verbatim na fonte
// (normalizado só por espaço em branco; paráfrase reprova). O escape honesto
// da skill — "(não consta na fonte)" — isenta a linha: afirmar sem prova é
// permitido DESDE que declarado.
export function gateCitacaoLiteral(fonte, garimpo) {
  const fonteNorm = normalizar(fonte);
  const problemas = [];
  for (const citacao of extrairCitacoes(garimpo)) {
    if (citacao.texto.includes(ESCAPE_SEM_FONTE)) continue;
    // separa o timestamp/atribuição do texto citado: `"fala" [12:34]` ou `fala — papel [12:34]`
    const semMarcadores = citacao.texto
      .replace(/\[[^\]]*\]/g, ' ')
      .replace(/[—–-]\s*[\p{L}\s]{2,30}$/u, ' ')
      .replace(/["“”]/g, ' ');
    const nucleo = normalizar(semMarcadores);
    if (nucleo.length < 12) continue; // fragmento curto demais pra provar distorção
    if (!fonteNorm.includes(nucleo)) {
      problemas.push(`linha ${citacao.linha}: citação não é literal — "${nucleo.slice(0, 60)}…"`);
    }
  }
  return { gate: 'g1_citacao_literal', ok: problemas.length === 0, problemas };
}

// G2 — quando a FONTE tem timestamps, toda citação carrega o dela. Sem
// minutagem a citação é inclipável e inverificável (regra da casa desde a
// ed02). Fonte sem timestamps → gate não se aplica.
export function gateTimestamp(fonte, garimpo) {
  if (!RE_TIMESTAMP.test(fonte)) {
    return { gate: 'g2_timestamp', ok: true, problemas: [], naoAplicavel: true };
  }
  const problemas = [];
  for (const citacao of extrairCitacoes(garimpo)) {
    if (citacao.texto.includes(ESCAPE_SEM_FONTE)) continue;
    if (!RE_TIMESTAMP.test(citacao.texto)) {
      problemas.push(`linha ${citacao.linha}: citação sem timestamp — "${citacao.texto.slice(0, 50)}…"`);
    }
  }
  return { gate: 'g2_timestamp', ok: problemas.length === 0, problemas };
}

// G3 — PII não atravessa o garimpo: participante é papel, nunca e-mail,
// telefone ou CPF. (A FONTE pode conter PII — sanitizar é justamente o
// trabalho; por isso o gate olha só o derivado.)
export function gatePii(_fonte, garimpo) {
  const problemas = [];
  for (const [i, linha] of linhas(garimpo).entries()) {
    for (const { nome, re } of RE_PII) {
      if (re.test(linha)) problemas.push(`linha ${i + 1}: ${nome} vazou no garimpo`);
    }
  }
  return { gate: 'g3_pii', ok: problemas.length === 0, problemas };
}

// G4 — compromisso tem dono; sem dono é pendência, não compromisso. O gate lê
// as seções que a skill produz: bullets sob "Compromissos"/"Ações" exigem
// `dono:`; bullets sob "Pendências" são o lugar honesto do que não tem.
export function gateDono(_fonte, garimpo) {
  const problemas = [];
  let secao = null;
  for (const [i, linha] of linhas(garimpo).entries()) {
    const titulo = linha.match(/^#{2,4}\s*(.+)$/);
    if (titulo) {
      const t = titulo[1].toLowerCase();
      secao = /compromisso|ações|acoes/.test(t) ? 'compromissos'
        : /pendência|pendencia/.test(t) ? 'pendencias'
        : null;
      continue;
    }
    if (secao !== 'compromissos') continue;
    if (/^\s*[-*]\s+/.test(linha) && !/dono:\s*\S/.test(linha)) {
      problemas.push(`linha ${i + 1}: compromisso sem dono — ou ganha dono, ou desce pra Pendências`);
    }
  }
  return { gate: 'g4_dono', ok: problemas.length === 0, problemas };
}

export function rodarGates(fonte, garimpo) {
  return [
    gateCitacaoLiteral(fonte, garimpo),
    gateTimestamp(fonte, garimpo),
    gatePii(fonte, garimpo),
    gateDono(fonte, garimpo),
  ];
}
