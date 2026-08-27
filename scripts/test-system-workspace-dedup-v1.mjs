#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(process.cwd());
const read = (path) => readFileSync(resolve(root, path), 'utf8');
const app = read('console/app.js');
const css = read('console/styles.css');
const story = read('docs/stories/2026-08-27-system-workspace-dedup-v1.md');

const tabs = app.match(/const WS_TABS = \[([\s\S]*?)\n\];/)?.[1] || '';
assert.equal((tabs.match(/\['/g) || []).length, 6, 'workspace deve expor seis superfícies');
for (const [id, label] of [
  ['overview', 'Visão geral'], ['how', 'Como funciona'], ['runs', 'Execuções'],
  ['experiments', 'Experimentos'], ['learning', 'Aprendizado'], ['config', 'Configuração'],
]) {
  assert.match(tabs, new RegExp(`\\['${id}', '${label}'\\]`), `superfície ausente: ${label}`);
}
assert.doesNotMatch(tabs, /Julgamento|Canvas|Governança/, 'workspace não pode duplicar superfícies constitucionais globais');

assert.match(app, /function wsHowItWorks\(ws\)/, 'Como funciona deve ser uma superfície própria');
assert.match(app, /data-ws-how-mode="declared"/, 'Como funciona deve mostrar o declarado');
assert.match(app, /data-ws-how-mode="installed"/, 'Como funciona deve mostrar o instalado');
assert.doesNotMatch(app, /data-ws-how-mode="last-run"/, 'Como funciona não pode repetir o último Run');
assert.doesNotMatch(app, /Canvas completo →/, 'workspace não pode sugerir um segundo Canvas');
assert.match(app, /Abrir no Mapa Operacional →/, 'fluxo leve deve abrir a autoridade global do mapa');

assert.match(app, /function wsJudgmentForRun\(ws, record\)/, 'Execuções deve ligar Run ao Judgment Receipt');
assert.match(app, /ws\.judgments\.find\(\(item\) => item\.run_id === record\.run_id\)/, 'ligação deve usar o run_id canônico');
assert.match(app, /data-open-judgment=/, 'Execuções deve reutilizar o drawer constitucional de julgamento');
assert.match(app, /data-view="judgments"/, 'Execuções deve abrir a fila global');
assert.match(app, /Uma fila constitucional/, 'autoridade da fila única deve estar explícita');
assert.doesNotMatch(app, /function wsJudgment\(ws\)/, 'não pode existir uma Caixa de Julgamento local');

assert.match(app, /experiments: wsExperiments/, 'Experimentos devem ser projetados por Sistema');
assert.match(app, /learning: wsLearning/, 'Aprendizado deve ser projetado por Sistema');
assert.match(app, /config: wsConfig/, 'Configuração deve reutilizar a projeção existente');
assert.match(app, /\['Candidatos', 'não projetado'/, 'inventário de candidatos sem escopo por Sistema não pode virar zero');
assert.match(app, /\['Melhoria provada', 'sem prova'/, 'melhoria não observada não pode virar zero otimista');
for (const selector of ['.ws-run-authority', '.ws-run-judgment']) {
  assert.match(css, new RegExp(selector.replace('.', '\\.')), `estilo ausente: ${selector}`);
}
assert.match(css, /\.ws \{ min-width: 0; \}/, 'workspace deve permitir contenção intrínseca no mobile');
assert.match(css, /\.ws-stack > \*, \.ws \.table-wrap \{ min-width: 0; max-width: 100%; \}/, 'tabelas devem rolar dentro do workspace');
assert.match(css, /\.ws-compare-pick \{ flex-direction: column;/, 'comparação deve empilhar seletores no mobile');

for (const contract of [
  'uma única Caixa de Julgamento',
  'Experimentos aparecem tanto na Estrutura global quanto filtrados dentro do Sistema',
  'sem criar ledgers novos',
]) {
  assert.match(story, new RegExp(contract), `story sem decisão: ${contract}`);
}

console.log('system-workspace-dedup-v1: ok');
