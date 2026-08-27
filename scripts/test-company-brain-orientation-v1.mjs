#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(process.cwd());
const app = readFileSync(resolve(root, 'console/app.js'), 'utf8');
const css = readFileSync(resolve(root, 'console/styles.css'), 'utf8');
const overview = app.match(/function renderBrainOverview\(anatomy\) \{([\s\S]*?)\n\}\n\nfunction renderBrainMemory/)?.[1] || '';
const brainView = app.match(/function renderAnatomy\(\) \{([\s\S]*?)\n\}\n\nfunction openBrainRun/)?.[1] || '';

assert.match(app, /state\.view === 'anatomy'/, 'Cérebro deve esconder o resumo operacional de Hoje');
assert.doesNotMatch(overview, /brain-anchor-list|anatomy\.identity\.anchors/, 'conceitos-âncora não devem dominar a primeira leitura operacional');
assert.doesNotMatch(overview, /sourceRows|brain_ops|ops\.tasks/, 'Visão geral não deve repetir inventário ou tarefas do mantenedor');
for (const view of ['overview', 'memory', 'recovery', 'learning', 'architecture']) {
  assert.match(brainView, new RegExp(`${view}: renderBrain`), `centro operacional sem vista ${view}`);
}

assert.match(app, /getJson\('\/api\/graphs\/brain'\)/, 'visão leve deve derivar do grafo canônico');
assert.match(app, /function renderBrainGraphPreview\(graph\)/, 'Cérebro deve renderizar a visão leve do mapa');
assert.match(app, /class="brain-map-preview"/, 'mapa leve deve usar SVG sem importar G6');
assert.match(app, /data-open-brain-map/, 'mapa leve precisa abrir a exploração completa');
assert.match(app, /state\.canvas\.scope = 'brain'/, 'exploração deve abrir a escala inteira do Canvas');
assert.doesNotMatch(app, /^import .*canvas\.bundle\.js/m, 'mapa leve não pode bloquear o bootstrap');

for (const selector of ['.brain-control-view', '.brain-overview-lead', '.brain-map-preview', '.brain-run-table', '.brain-learning-lead']) {
  assert.match(css, new RegExp(selector.replace('.', '\\.')), `estilo ausente: ${selector}`);
}
assert.match(css, /\.brain-control-view \{[^}]*min-width: 0/, 'Cérebro deve conter as vistas no mobile');
assert.match(css, /\.brain-map-frame \{[^}]*overflow: hidden/, 'desktop deve conter o preview dentro da superfície');
assert.match(css, /\.brain-map-frame \{ overflow-x: auto; \}/, 'mobile deve rolar o grafo sem criar overflow na página');

console.log('company-brain-orientation-v1: ok');
