#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const LEVELS = ['V0', 'V1', 'V2', 'V3'];
const CURRENT_DIR = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(CURRENT_DIR, '..', '..', '..', '..');
const VISUAL_ENGINE = join(ROOT, '.claude', 'skills', 'frameworks-visuais', 'gerar_excalidraw.py');
const args = process.argv.slice(2);
const inputArg = args.find((arg) => !arg.startsWith('--'));
const positional = args.filter((arg) => !arg.startsWith('--'));
const outputArg = positional[1];
const validateOnly = args.includes('--validate-only');

function fail(message) {
  console.error(`ERRO: ${message}`);
  process.exit(1);
}

function nonEmpty(value, path) {
  if (typeof value !== 'string' || !value.trim()) fail(`${path} precisa ser texto não vazio`);
  return value.trim();
}

function array(value, path, { min = 0, max = Infinity } = {}) {
  if (!Array.isArray(value) || value.length < min || value.length > max) {
    fail(`${path} precisa ter entre ${min} e ${max === Infinity ? '∞' : max} itens`);
  }
  return value;
}

function hasKind(spec, kind) {
  return spec.state.basis.some((item) => item.kind === kind);
}

function references(value, path) {
  for (const [index, ref] of array(value, path, { min: 1 }).entries()) {
    nonEmpty(ref, `${path}[${index}]`);
    if (isAbsolute(ref) || ref.startsWith('~/') || /^[A-Za-z]:[\\/]/.test(ref)) {
      fail(`${path}[${index}] expõe caminho absoluto; use referência relativa ou id local`);
    }
  }
}

function scanPii(spec) {
  const text = JSON.stringify(spec);
  const patterns = [
    [/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i, 'e-mail'],
    [/\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/, 'CPF'],
    [/\b\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}\b/, 'CNPJ'],
    [/(?:\+55\s*)?\(?\d{2}\)?\s*9?\d{4}[-\s]?\d{4}/, 'telefone'],
  ];
  for (const [pattern, label] of patterns) {
    if (pattern.test(text)) fail(`spec contém ${label}; use papel, alias ou mantenha em privado`);
  }
}

function validate(spec) {
  if (!spec || typeof spec !== 'object' || Array.isArray(spec)) fail('spec precisa ser objeto JSON');
  if (spec.schema_version !== 1) fail('schema_version suportado: 1');
  if (!/^[a-z0-9][a-z0-9-]{2,79}$/.test(nonEmpty(spec.map_id, 'map_id'))) {
    fail('map_id precisa estar em kebab-case e ter de 3 a 80 caracteres');
  }
  if (Number.isNaN(Date.parse(nonEmpty(spec.generated_at, 'generated_at')))) {
    fail('generated_at precisa ser data ISO válida');
  }
  if (!spec.state || !LEVELS.includes(spec.state.level)) fail('state.level precisa ser V0, V1, V2 ou V3');
  array(spec.state.basis, 'state.basis', { min: 1 });
  for (const [index, basis] of spec.state.basis.entries()) {
    if (!['declared', 'observed', 'human-confirmation', 'run-result'].includes(basis.kind)) {
      fail(`state.basis[${index}].kind inválido`);
    }
    references([basis.ref], `state.basis[${index}].ref`);
    nonEmpty(basis.summary, `state.basis[${index}].summary`);
  }
  array(spec.state.limitations, 'state.limitations');
  if (['V0', 'V1'].includes(spec.state.level) && spec.state.limitations.length === 0) {
    fail(`${spec.state.level} precisa declarar ao menos uma limitação`);
  }
  if (!hasKind(spec, 'declared')) fail('todo mapa precisa de base declarada');

  const operation = spec.operation || {};
  nonEmpty(operation.name, 'operation.name');
  if (!['decision', 'sale', 'delivery'].includes(operation.front)) fail('operation.front inválido');
  for (const key of ['objective', 'recurring_work', 'metric']) nonEmpty(operation[key], `operation.${key}`);
  array(operation.current_flow, 'operation.current_flow', { min: 1, max: 6 });

  const sources = array(spec.sources, 'sources');
  const sourceIds = new Set();
  for (const [index, source] of sources.entries()) {
    const id = nonEmpty(source.id, `sources[${index}].id`);
    if (sourceIds.has(id)) fail(`source id duplicado: ${id}`);
    sourceIds.add(id);
    for (const key of ['label', 'type', 'freshness', 'work_role']) nonEmpty(source[key], `sources[${index}].${key}`);
    if (!['declared', 'observed'].includes(source.status)) fail(`sources[${index}].status inválido`);
    if (!['manual', 'read-only', 'connector'].includes(source.access)) fail(`sources[${index}].access inválido`);
    if (!['private', 'team', 'public'].includes(source.sensitivity)) fail(`sources[${index}].sensitivity inválido`);
    references(source.evidence_refs, `sources[${index}].evidence_refs`);
  }

  for (const [index, step] of operation.current_flow.entries()) {
    for (const key of ['id', 'label', 'owner_role']) nonEmpty(step[key], `operation.current_flow[${index}].${key}`);
    array(step.source_ids, `operation.current_flow[${index}].source_ids`);
    for (const id of step.source_ids) if (!sourceIds.has(id)) fail(`flow referencia source inexistente: ${id}`);
    references(step.evidence_refs, `operation.current_flow[${index}].evidence_refs`);
  }

  const judgment = spec.judgment || {};
  for (const key of ['owner_role', 'approval_question']) nonEmpty(judgment[key], `judgment.${key}`);
  array(judgment.criteria, 'judgment.criteria', { min: 1 });
  judgment.criteria.forEach((item, index) => nonEmpty(item, `judgment.criteria[${index}]`));
  if (!['declared', 'observed', 'confirmed'].includes(judgment.status)) fail('judgment.status inválido');

  for (const [index, gap] of array(spec.gaps, 'gaps').entries()) {
    for (const key of ['id', 'label', 'consequence']) nonEmpty(gap[key], `gaps[${index}].${key}`);
    if (!['data', 'context', 'judgment', 'measurement', 'execution', 'permission'].includes(gap.kind)) {
      fail(`gaps[${index}].kind inválido`);
    }
    references(gap.evidence_refs, `gaps[${index}].evidence_refs`);
  }

  const ranking = spec.ranking || {};
  if (!['proposed', 'confirmed', 'corrected'].includes(ranking.status)) fail('ranking.status inválido');
  if (ranking.method !== 'human-proposed-v0') fail('ranking.method precisa ser human-proposed-v0');
  const opportunities = array(ranking.opportunities, 'ranking.opportunities', { min: 1, max: 3 });
  const opportunityIds = new Set();
  for (const [index, opportunity] of opportunities.entries()) {
    if (opportunity.rank !== index + 1) fail('ranking precisa ser ordinal e sequencial: 1, 2, 3');
    const id = nonEmpty(opportunity.id, `ranking.opportunities[${index}].id`);
    if (opportunityIds.has(id)) fail(`opportunity id duplicado: ${id}`);
    opportunityIds.add(id);
    for (const key of ['title', 'result', 'expected_gain', 'reasoning']) {
      nonEmpty(opportunity[key], `ranking.opportunities[${index}].${key}`);
    }
    if (!['low', 'medium', 'high', 'unknown'].includes(opportunity.effort)) fail(`effort inválido em ${id}`);
    if (!['ready-with-current-source', 'needs-source', 'needs-rule', 'needs-system'].includes(opportunity.readiness)) {
      fail(`readiness inválido em ${id}`);
    }
    const reasonCodes = array(opportunity.reason_codes, `${id}.reason_codes`, { min: 1, max: 4 });
    for (const code of reasonCodes) if (!/^[a-z0-9][a-z0-9-]*$/.test(code)) fail(`reason_code inválido: ${code}`);
    array(opportunity.source_ids, `${id}.source_ids`);
    for (const sourceId of opportunity.source_ids) if (!sourceIds.has(sourceId)) fail(`${id} referencia source inexistente: ${sourceId}`);
    references(opportunity.evidence_refs, `${id}.evidence_refs`);
    if (opportunity.installed_system_id != null) nonEmpty(opportunity.installed_system_id, `${id}.installed_system_id`);
  }

  const recommendation = spec.recommendation || {};
  if (!opportunityIds.has(recommendation.opportunity_id)) fail('recommendation.opportunity_id não existe no ranking');
  if (!['pending', 'approved', 'changes-requested', 'rejected'].includes(recommendation.human_decision)) {
    fail('recommendation.human_decision inválida');
  }
  const brief = recommendation.system_brief || {};
  for (const key of ['result', 'input', 'output', 'human_gate', 'metric']) nonEmpty(brief[key], `system_brief.${key}`);
  array(brief.pipeline, 'system_brief.pipeline', { min: 2, max: 7 });
  brief.pipeline.forEach((step, index) => nonEmpty(step, `system_brief.pipeline[${index}]`));
  array(brief.source_ids, 'system_brief.source_ids');
  for (const id of brief.source_ids) if (!sourceIds.has(id)) fail(`system brief referencia source inexistente: ${id}`);
  if (brief.installed_system_id != null) {
    const id = nonEmpty(brief.installed_system_id, 'system_brief.installed_system_id');
    const known = existsSync(join(ROOT, 'sistemas', id, 'manifest.md'))
      || existsSync(join(ROOT, 'sistemas', 'outros-instalados', id, 'manifest.md'));
    if (!known) fail(`installed_system_id não está instalado: ${id}`);
  }

  const validation = spec.validation || {};
  const confirmation = validation.human_confirmation;
  const run = validation.run;
  const levelIndex = LEVELS.indexOf(spec.state.level);
  if (levelIndex >= 1) {
    if (!hasKind(spec, 'observed') || !sources.some((source) => source.status === 'observed')) {
      fail(`${spec.state.level} exige ao menos uma fonte observada e base kind=observed`);
    }
  }
  if (levelIndex < 2) {
    if (ranking.status !== 'proposed' || recommendation.human_decision !== 'pending') {
      fail(`${spec.state.level} mantém ranking proposto e decisão pendente`);
    }
  } else {
    if (!confirmation) fail(`${spec.state.level} exige validation.human_confirmation`);
    if (!hasKind(spec, 'human-confirmation')) fail(`${spec.state.level} exige base kind=human-confirmation`);
    if (!['confirmed', 'corrected'].includes(confirmation.map_status)
      || !['confirmed', 'corrected'].includes(confirmation.ranking_status)) {
      fail('confirmação humana precisa validar mapa e ranking');
    }
    if (!['confirmed', 'corrected'].includes(ranking.status)) fail(`${spec.state.level} não aceita ranking ainda proposto`);
    if (recommendation.human_decision === 'pending') fail(`${spec.state.level} exige decisão sobre a recomendação`);
    nonEmpty(confirmation.confirmed_by_role, 'human_confirmation.confirmed_by_role');
    if (Number.isNaN(Date.parse(nonEmpty(confirmation.confirmed_at, 'human_confirmation.confirmed_at')))) {
      fail('human_confirmation.confirmed_at inválido');
    }
    array(confirmation.corrections, 'human_confirmation.corrections');
  }
  if (levelIndex >= 3) {
    if (!run) fail('V3 exige validation.run');
    if (!hasKind(spec, 'run-result')) fail('V3 exige base kind=run-result');
    for (const key of ['run_id', 'system_id', 'baseline', 'observed', 'delta']) nonEmpty(run[key], `run.${key}`);
    if (run.eval_passed !== true || run.human_decision !== 'approved') fail('V3 exige eval passado e decisão humana aprovada');
    if (Number.isNaN(Date.parse(nonEmpty(run.measured_at, 'run.measured_at')))) fail('run.measured_at inválido');
  }

  const next = spec.next_step || {};
  if (!['observe-source', 'confirm-map', 'operate-system', 'measure-result', 'revise-map'].includes(next.kind)) {
    fail('next_step.kind inválido');
  }
  nonEmpty(next.text, 'next_step.text');
  scanPii(spec);
  return spec;
}

function clip(value, max = 150) {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  return text.length <= max ? text : `${text.slice(0, max - 1).trim()}…`;
}

function colorForLevel(level, current) {
  const i = LEVELS.indexOf(level);
  const c = LEVELS.indexOf(current);
  if (i === c) return 'dourado';
  return i < c ? 'azul' : 'cinza';
}

function toFrameworkSpec(spec) {
  const brief = spec.recommendation.system_brief;
  const currentIndex = LEVELS.indexOf(spec.state.level);
  const stateLabels = {
    V0: 'declarado',
    V1: 'evidência parcial',
    V2: 'verificado pelo responsável',
    V3: 'validado por resultado',
  };
  const flow = spec.operation.current_flow.slice(0, 4).map((step) => ({
    titulo: clip(step.label, 42),
    definicao: `quem conduz: ${clip(step.owner_role, 54)}`,
    texto: clip(step.source_ids.length ? `usa ${step.source_ids.join(', ')}` : 'fonte ainda não identificada', 100),
    cor: 'azul',
    pict: { tipo: 'rua' },
  }));
  const gaps = (spec.gaps.length ? spec.gaps : [{
    label: 'Nenhuma lacuna comprovada ainda',
    consequence: 'O mapa precisa de mais uma fonte antes de concluir.',
    kind: 'context',
  }]).slice(0, 3).map((gap) => ({
    titulo: clip(gap.label, 44),
    definicao: `lacuna de ${gap.kind}`,
    texto: clip(gap.consequence, 120),
    cor: 'vermelho',
    pict: { tipo: 'onda-mini', rasgo: true },
  }));
  const opportunities = spec.ranking.opportunities.map((opportunity) => ({
    titulo: `${opportunity.rank} · ${clip(opportunity.title, 40)}`,
    definicao: clip(opportunity.result, 92),
    texto: clip(`${opportunity.reason_codes.join(' · ')} — ${opportunity.reasoning}`, 145),
    cor: opportunity.rank === 1 ? 'dourado' : 'cinza',
    pict: { tipo: 'botao', label: opportunity.readiness },
  }));
  const ladder = LEVELS.map((level) => ({
    titulo: `${level} · ${stateLabels[level]}`,
    definicao: level === spec.state.level ? 'VOCÊ ESTÁ AQUI' : (LEVELS.indexOf(level) < currentIndex ? 'já atravessado' : 'próximo estado'),
    texto: {
      V0: 'o responsável descreveu a operação',
      V1: 'uma fonte confrontou o relato',
      V2: 'mapa e ranking foram confirmados',
      V3: 'o sistema rodou e o delta voltou',
    }[level],
    cor: colorForLevel(level, spec.state.level),
    pict: { tipo: 'onda-mini', rasgo: LEVELS.indexOf(level) > currentIndex },
  }));
  return {
    arquetipo: 'historia',
    titulo: `MAPA DA CAPACIDADE · ${clip(spec.operation.name.toUpperCase(), 58)}`,
    subtitulo: `INEVITA Architect · diagnóstico local · ${spec.state.level} ${stateLabels[spec.state.level]}`,
    gancho: `Você está vendo como esta operação funciona, onde perde inteligência e qual sistema faz sentido testar primeiro — sem esconder o que ainda não foi provado.`,
    como_ler: 'de cima para baixo: operação atual → lacunas → oportunidades → primeiro sistema → estado da prova',
    atos: [
      {
        titulo: 'Como a operação funciona hoje',
        texto: clip(`${spec.operation.recurring_work} Medida: ${spec.operation.metric}`, 210),
        visual: { tipo: 'vinhetas', itens: flow },
      },
      {
        titulo: 'Onde a inteligência se perde',
        cor: 'vermelho',
        texto: spec.state.limitations.length ? clip(spec.state.limitations.join(' · '), 220) : undefined,
        visual: { tipo: 'vinhetas', itens: gaps },
      },
      {
        titulo: `O ranking é uma proposta — ${spec.ranking.status}`,
        cor: 'dourado',
        texto: 'A ordem explica o raciocínio; o responsável confirma ou corrige antes da implementação.',
        visual: { tipo: 'vinhetas', itens: opportunities },
      },
      {
        titulo: `Primeiro sistema · ${clip(spec.ranking.opportunities.find((item) => item.id === spec.recommendation.opportunity_id).title, 58)}`,
        cor: 'azul',
        texto: clip(`Gate humano: ${brief.human_gate} Medida: ${brief.metric}`, 220),
        visual: {
          tipo: 'vinhetas',
          itens: [
            { titulo: 'ENTRA', definicao: clip(brief.input, 100), texto: clip(brief.source_ids.join(' · ') || 'fontes a confirmar', 90), cor: 'cinza', pict: { tipo: 'rua' } },
            { titulo: 'VIRA', definicao: clip(brief.pipeline.join(' → '), 120), texto: 'pipeline mínimo; não é automação cega', cor: 'laranja', pict: { tipo: 'tornado' } },
            { titulo: 'SAI', definicao: clip(brief.output, 100), texto: clip(brief.result, 100), cor: 'azul', pict: { tipo: 'botao', label: 'pronto para o gate' } },
          ],
        },
      },
      {
        titulo: 'O estado da prova',
        cor: 'dourado',
        texto: `O mapa está em ${spec.state.level}. Clareza não é a mesma coisa que validação.`,
        visual: { tipo: 'vinhetas', itens: ladder },
      },
    ],
    takeaway: {
      titulo: 'PRÓXIMO PASSO →',
      bullets: [clip(spec.next_step.text, 180)],
    },
    proveniencia: `Vista derivada deterministicamente de ${spec.map_id} · estado ${spec.state.level} · contexto e arquivos permanecem locais`,
    frontmatter: {
      tipo: 'mapa',
      fonte: 'mente-propria',
      tema: 'metodo',
      'pode-ir-comunidade': false,
      criado: spec.generated_at.slice(0, 10),
    },
    largura: 1570,
    estilo: 'clean',
  };
}

if (!inputArg) fail('uso: node render-map.mjs <architect-spec.json> [saida.excalidraw.md] [--validate-only]');
const input = resolve(inputArg);
if (!existsSync(input)) fail(`arquivo não encontrado: ${inputArg}`);
let spec;
try {
  spec = JSON.parse(readFileSync(input, 'utf8'));
} catch (error) {
  fail(`JSON inválido: ${error.message}`);
}
validate(spec);
if (validateOnly) {
  console.log(JSON.stringify({ valid: true, map_id: spec.map_id, level: spec.state.level, ranking: spec.ranking.status }, null, 2));
  process.exit(0);
}
if (!existsSync(VISUAL_ENGINE)) fail('engine frameworks-visuais não encontrado');
const output = resolve(outputArg || input.replace(/\.json$/i, '.excalidraw.md'));
mkdirSync(dirname(output), { recursive: true });
const temp = mkdtempSync(join(tmpdir(), 'inevita-architect-'));
try {
  const frameworkPath = join(temp, 'framework-spec.json');
  writeFileSync(frameworkPath, `${JSON.stringify(toFrameworkSpec(spec), null, 2)}\n`);
  const rendered = spawnSync('python3', [VISUAL_ENGINE, frameworkPath, output], {
    cwd: ROOT,
    encoding: 'utf8',
  });
  if (rendered.status !== 0) {
    process.stderr.write(rendered.stderr || rendered.stdout || 'engine visual falhou\n');
    process.exit(rendered.status || 1);
  }
  process.stdout.write(rendered.stdout);
  console.log(`✓ architect-spec ${spec.map_id} · ${spec.state.level} · ranking ${spec.ranking.status}`);
  spawnSync(process.execPath, [
    join(ROOT, '.agents', 'scripts', 'ping.mjs'),
    'architect_map_generated',
    `--reason-code=${spec.state.level.toLowerCase()}`,
  ], { cwd: ROOT, stdio: 'ignore' });
} finally {
  rmSync(temp, { recursive: true, force: true });
}
