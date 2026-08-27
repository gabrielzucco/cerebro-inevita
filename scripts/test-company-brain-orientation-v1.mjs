#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(process.cwd());
const app = readFileSync(resolve(root, 'console/app.js'), 'utf8');
const css = readFileSync(resolve(root, 'console/styles.css'), 'utf8');
const brainView = app.match(/function renderAnatomy\(\) \{([\s\S]*?)\n\}\n\nasync function loadAnatomy/)?.[1] || '';

assert.match(app, /state\.view === 'anatomy'/, 'Cérebro deve esconder o resumo operacional de Hoje');
assert.match(brainView, /brain-anchor-list/, 'quatro conceitos-âncora precisam orientar a primeira leitura');
assert.match(brainView, /anatomy\.identity\.anchors\.map/, 'âncoras devem vir do read model real');
assert.doesNotMatch(brainView, /\[\[\$\{escapeHtml\(anchor_\)\}\]\]/, 'âncoras não devem parecer código do vault');
assert.doesNotMatch(brainView, /<table|sourceRows|brain_ops|ops\.tasks/, 'Cérebro não deve repetir inventário de Fontes ou tarefas do mantenedor');

for (const step of ['Atenção', 'Recuperação', 'Context Snapshot', 'Sistema', 'Julgamento', 'Aprendizado']) {
  assert.match(brainView, new RegExp(step), `fluxo do Cérebro sem etapa ${step}`);
}
for (const destination of ['sources', 'systems', 'governance', 'today']) {
  assert.match(brainView, new RegExp(`data-view="${destination}"`), `orientação sem porta para ${destination}`);
}

assert.match(app, /getJson\('\/api\/graphs\/brain'\)/, 'visão leve deve derivar do grafo canônico');
assert.match(app, /function renderBrainGraphPreview\(graph\)/, 'Cérebro deve renderizar a visão leve do mapa');
assert.match(app, /class="brain-map-preview"/, 'mapa leve deve usar SVG sem importar G6');
assert.match(app, /data-open-brain-map/, 'mapa leve precisa abrir a exploração completa');
assert.match(app, /state\.canvas\.scope = 'brain'/, 'exploração deve abrir a escala inteira do Canvas');
assert.doesNotMatch(app, /^import .*canvas\.bundle\.js/m, 'mapa leve não pode bloquear o bootstrap');

for (const selector of ['.brain-home', '.brain-anchor-list', '.brain-map-preview', '.brain-context-flow', '.brain-actions']) {
  assert.match(css, new RegExp(selector.replace('.', '\\.')), `estilo ausente: ${selector}`);
}
assert.match(css, /\.brain-home \{[^}]*min-width: 0/, 'Cérebro deve conter o grafo no mobile');
assert.match(css, /\.brain-map-frame \{[^}]*overflow: hidden/, 'desktop deve conter o preview dentro da superfície');
assert.match(css, /\.brain-map-frame \{ overflow-x: auto; \}/, 'mobile deve rolar o grafo sem criar overflow na página');

console.log('company-brain-orientation-v1: ok');

