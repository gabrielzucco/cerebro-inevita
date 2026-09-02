#!/usr/bin/env node

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(process.cwd());
const app = readFileSync(resolve(root, 'console/app.js'), 'utf8');
const css = readFileSync(resolve(root, 'console/styles.css'), 'utf8');

const between = (start, end) => app.slice(app.indexOf(start), app.indexOf(end, app.indexOf(start)));
const recoveryAsset = between('function renderOverviewRecoveryAsset', 'function renderOverviewCapabilities');
const activity = between('function renderOverviewActivity', 'function renderBrainOverview');
const overview = between('function renderBrainOverview', 'function renderBrainMemory');

assert.match(overview, /SEU CÉREBRO HOJE/, 'a visão geral deve começar pela vida da empresa');
assert.match(overview, /Contexto que já consegue voltar para o trabalho/, 'a promessa deve falar de uso');
assert.match(overview, /Realidade entrando/, 'Fontes observadas devem aparecer como fato vivido');
assert.match(overview, /Trabalho sustentado/, 'integridade dos Runs deve aparecer sem score composto');
assert.match(overview, /Julgamento humano/, 'aprendizado deve permanecer ligado ao julgamento');

for (const contract of [
  'Hit@3',
  'quality.cases',
  'quality.false_positive_percent',
  'quality.gate_passed',
  'quality.measured_at',
  'Benchmark local',
  'ainda não é ranking da Society',
]) {
  assert(recoveryAsset.includes(contract), `ativo de recuperação sem ${contract}`);
}
assert.doesNotMatch(recoveryAsset, /score composto|ranking da Society[^<]*ativo/, 'a UI não pode declarar ranking');

const heroAt = overview.indexOf('brain-overview-hero');
const supportedAt = overview.indexOf('brain-supported');
const activityAt = overview.indexOf('brain-overview-lower');
const detailsAt = overview.indexOf('brain-capability-details');
assert(heroAt >= 0 && heroAt < supportedAt && supportedAt < activityAt && activityAt < detailsAt,
  'a hierarquia deve ser estado, capacidades, atividade/cuidado e anatomia recolhida');

assert.match(overview, /O QUE ELE JÁ SUSTENTA/, 'a prova curta deve ser traduzida para capacidade');
assert.match(activity, /ATIVIDADE OBSERVADA/, 'atividade precisa ser nomeada sem alegar causalidade');
assert.match(activity, /O que aconteceu por último/, 'a atividade deve orientar sem inventar mudança');
assert.match(overview, /PEDE ATENÇÃO/, 'sinais de cuidado precisam continuar visíveis');
assert.match(overview, /<details class="brain-capability-details">/, 'a anatomia técnica deve nascer recolhida');
assert.match(overview, /Como este Cérebro funciona/, 'a divulgação progressiva precisa ser explícita');
assert.doesNotMatch(overview, /systems_readiness|Sistemas prontos/, 'prontidão de Sistemas ainda não é medida');

for (const selector of [
  '.brain-overview-hero',
  '.brain-recovery-asset',
  '.brain-supported-grid',
  '.brain-overview-lower',
  '.brain-capability-details',
]) {
  assert(css.includes(selector), `estilo ausente: ${selector}`);
}
assert.match(css, /@media \(max-width: 720px\)[\s\S]*\.brain-supported-grid \{ grid-template-columns: 1fr;/,
  'capacidades devem virar leitura linear no mobile');
assert.match(css, /@media \(max-width: 720px\)[\s\S]*\.brain-recovery-asset > dl \{ grid-template-columns: 1fr 1fr;/,
  'prova da recuperação deve caber em duas colunas no mobile');

console.log('company-brain-lived-overview-v2: ok');
