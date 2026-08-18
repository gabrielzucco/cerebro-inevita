#!/usr/bin/env node

import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { latestRunRecords } from './lib/system-protocol.mjs';

const ROOT = process.env.CEREBRO_INSTALL_ROOT
  ? resolve(process.env.CEREBRO_INSTALL_ROOT)
  : resolve(dirname(fileURLToPath(import.meta.url)), '..');
const NOW = new Date(process.env.CEREBRO_BRIEF_NOW || Date.now());
const DRY_RUN = process.argv.includes('--dry-run');
const OUTPUT = join(ROOT, 'operacao', '_HOJE.md');

function json(path, fallback) {
  if (!existsSync(path)) return fallback;
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return fallback;
  }
}

function markdownFiles(path) {
  if (!existsSync(path)) return [];
  return readdirSync(path)
    .filter((name) => name.endsWith('.md') && !name.startsWith('_'))
    .map((name) => ({ name, path: join(path, name), modified: statSync(join(path, name)).mtimeMs }))
    .sort((left, right) => right.modified - left.modified);
}

function heading(path, fallback) {
  try {
    const match = readFileSync(path, 'utf8').match(/^#\s+(.+)$/m);
    return match?.[1]?.trim() || fallback;
  } catch {
    return fallback;
  }
}

function date(value) {
  if (!value) return '—';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? '—'
    : new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(parsed);
}

function cell(value) {
  return String(value ?? '—').replaceAll('|', '\\|').replaceAll('\n', ' ');
}

function listSystemStates() {
  const path = join(ROOT, '.cerebro', 'sistemas');
  if (!existsSync(path)) return [];
  return readdirSync(path)
    .filter((name) => name.endsWith('.json'))
    .map((name) => json(join(path, name), null))
    .filter(Boolean)
    .sort((left, right) => String(left.system_id).localeCompare(String(right.system_id)));
}

function listConciergeRuns() {
  const path = join(ROOT, '.cerebro', 'concierge-runs');
  if (!existsSync(path)) return [];
  return readdirSync(path)
    .filter((name) => name.endsWith('.json'))
    .map((name) => json(join(path, name), null))
    .filter(Boolean);
}

function listSources() {
  const registry = json(join(ROOT, 'conexoes', 'configuradas', 'fontes.json'), {
    version: 1,
    sources: [],
  });
  if (!Array.isArray(registry.sources)) return [];
  return registry.sources.map((source) => ({
    ...source,
    availability: source.location && existsSync(source.location) ? 'disponível' : 'não encontrada',
  }));
}

function statusLabel(status) {
  return {
    package_added: 'pacote adicionado',
    configuring: 'configurando',
    first_run: 'primeiro run',
    active: 'ativo',
    needs_attention: 'precisa de atenção',
  }[status] || status || '—';
}

function makeBrief() {
  const systems = listSystemStates();
  const conciergeRuns = listConciergeRuns();
  const sources = listSources();
  const decisions = markdownFiles(join(ROOT, 'operacao', 'decisoes-pendentes'));
  const executions = markdownFiles(join(ROOT, 'operacao', 'execucoes')).slice(0, 5);
  const improvements = markdownFiles(join(ROOT, 'operacao', 'o-que-melhorou')).slice(0, 5);
  const incompleteOnboarding = conciergeRuns.filter((run) => !run.milestones?.T4);
  const alerts = [
    ...systems
      .filter((system) => system.status === 'needs_attention')
      .map((system) => `Sistema **${system.system_id}** precisa de atenção.`),
    ...sources
      .filter((source) => source.availability !== 'disponível')
      .map((source) => `Fonte **${source.label || source.id}** não está acessível no caminho registrado.`),
  ];
  let ledgerRuns = [];
  try {
    ledgerRuns = latestRunRecords(ROOT).filter((run) => run.status === 'completed');
  } catch {
    alerts.push('Ledger de runs precisa de reparo antes de costurar novas jornadas.');
  }
  const entitySystems = new Map();
  for (const run of ledgerRuns) {
    for (const entity of run.entity_refs || []) {
      if (!entitySystems.has(entity.id)) entitySystems.set(entity.id, new Set());
      entitySystems.get(entity.id).add(run.system_id);
    }
  }
  const stitchedEntities = [...entitySystems.values()].filter((systemIds) => systemIds.size > 1).length;
  const timestamp = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(NOW);

  const lines = [
    '# Hoje',
    '',
    `> Brief operacional local · gerado em ${timestamp}. Nenhum conteúdo foi enviado à INEVITA.`,
    '',
    '## Em 30 segundos',
    '',
    `- sistemas instalados: **${systems.length}** · ativos: **${systems.filter((system) => system.status === 'active').length}** · em atenção: **${systems.filter((system) => system.status === 'needs_attention').length}**`,
    `- decisões pendentes: **${decisions.length}**`,
    `- fontes registradas: **${sources.length}** · não encontradas: **${sources.filter((source) => source.availability !== 'disponível').length}**`,
    `- runs no protocolo comum: **${ledgerRuns.length}** · entidades atravessando mais de um Sistema: **${stitchedEntities}**`,
    `- primeiras experiências ainda sem T4: **${incompleteOnboarding.length}**`,
    `- candidatos de melhoria/procedimento: **${improvements.length}**`,
    '',
    '## O que exige atenção',
    '',
    ...(alerts.length ? alerts.map((alert) => `- ${alert}`) : ['- nenhuma exceção detectada']),
    '',
    '## Sistemas',
    '',
  ];

  if (systems.length) {
    lines.push('| sistema | estado | runs aprovados | último eval | atualizado |');
    lines.push('|---|---|---:|---|---|');
    for (const system of systems) {
      const lastEval = system.last_run
        ? `${system.last_run.eval_passed ? 'passou' : 'falhou'} · ${system.last_run.human_decision || 'sem decisão'}`
        : '—';
      lines.push(`| ${cell(system.system_id)} | ${cell(statusLabel(system.status))} | ${Number(system.approved_run_count || 0)} | ${cell(lastEval)} | ${date(system.updated_at)} |`);
    }
  } else {
    lines.push('- nenhum sistema adicional instalado');
  }

  lines.push('', '## Fontes registradas', '');
  if (sources.length) {
    lines.push('| fonte | tipo | acesso | atualização | disponibilidade |');
    lines.push('|---|---|---|---|---|');
    for (const source of sources) {
      lines.push(`| ${cell(source.label || source.id)} | ${cell(source.type)} | ${cell(source.access)} | ${cell(source.refresh)} | ${cell(source.availability)} |`);
    }
    lines.push('', '> “Disponível” confirma somente que a referência local ainda existe. Atualização manual não é sincronização nem prova de frescor.');
  } else {
    lines.push('- nenhuma fonte externa registrada');
  }

  lines.push('', '## Decisões pendentes', '');
  lines.push(...(decisions.length
    ? decisions.map((item) => `- ${heading(item.path, basename(item.name, '.md'))}`)
    : ['- nenhuma']));

  lines.push('', '## Últimas execuções', '');
  lines.push(...(executions.length
    ? executions.map((item) => `- ${heading(item.path, basename(item.name, '.md'))}`)
    : ['- nenhuma']));

  lines.push('', '## O que pode virar memória procedural', '');
  lines.push(...(improvements.length
    ? improvements.map((item) => `- ${heading(item.path, basename(item.name, '.md'))}`)
    : ['- nenhum caminho bem-sucedido foi aprovado como candidato ainda']));
  lines.push('', '> Caminho bem-sucedido só vira pipeline ou skill depois de recorrência, replay, diff e aprovação do dono.', '');

  return lines.join('\n');
}

const brief = makeBrief();
if (DRY_RUN) {
  console.log(brief);
} else {
  mkdirSync(dirname(OUTPUT), { recursive: true });
  const temporary = `${OUTPUT}.tmp`;
  writeFileSync(temporary, brief, { mode: 0o600 });
  renameSync(temporary, OUTPUT);
  console.log('✓ operacao/_HOJE.md atualizado');
}
