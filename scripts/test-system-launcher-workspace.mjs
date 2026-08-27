#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(process.cwd());
const read = (path) => readFileSync(resolve(root, path), 'utf8');
const html = read('console/index.html');
const app = read('console/app.js');
const css = read('console/styles.css');

assert.match(html, /data-view="systems" data-views="systems,system"/, 'Sistemas deve ser navegação principal');
assert.match(html, /data-view="areas" data-views="areas,sources,experiments"/, 'Estrutura deve preservar apenas Áreas, Fontes e Experimentos');
assert.doesNotMatch(html, /data-view="areas" data-views="[^"]*systems/, 'Sistemas não pode continuar escondido em Estrutura');

const tabs = app.match(/const WS_TABS = \[([\s\S]*?)\n\];/)?.[1] || '';
for (const name of ['Visão geral', 'Canvas', 'Execuções', 'Julgamento', 'Governança']) {
  assert.match(tabs, new RegExp(name), `workspace deve conter ${name}`);
}
for (const oldName of ['Arquitetura', 'Experimentos', 'Aprendizado', 'Configuração']) {
  assert.doesNotMatch(tabs, new RegExp(oldName), `workspace não deve manter a aba antiga ${oldName}`);
}
assert.equal((tabs.match(/\['/g) || []).length, 5, 'workspace deve expor exatamente cinco superfícies');

const card = app.match(/function systemCard\(system\) \{([\s\S]*?)\n\}/)?.[1] || '';
assert.match(card, /systemLaunchAction\(system\)/, 'card deve oferecer abertura da aplicação');
assert.match(app, /data-system-launch=/, 'ação de abrir aplicação deve ser rastreável');
assert.match(card, /data-open-system=/, 'card deve oferecer Inspecionar operação');
assert.match(card, />Inspecionar</, 'porta operacional deve ser explícita');
assert.doesNotMatch(card, /<article[^>]+data-open-system=/, 'card inteiro não pode ser a ação implícita');
assert.match(app, /url\.protocol === 'https:' \|\| localHttp/, 'interface externa deve aplicar allowlist de protocolo');
assert.match(app, /rel="noopener noreferrer"/, 'interface externa deve isolar o opener');

for (const mode of ['Contrato', 'Estado atual', 'Último Run']) {
  assert.match(app, new RegExp(mode), `Canvas deve oferecer o modo ${mode}`);
}
for (const kind of ['operation', 'context', 'trust', 'value']) {
  assert.match(app, new RegExp(`wsMetricGroup\\('${kind}'`), `métricas devem separar ${kind}`);
}
assert.match(app, /Benchmark', 'não calculado'/, 'ausência de benchmark deve permanecer explícita');
assert.match(app, /Repetição provada'.*'sem prova'/, 'repetição sem evidência não pode virar sucesso');
assert.match(app, /Sistema → Inspecionar operação/, 'busca global deve respeitar a porta operacional');

for (const selector of ['.system-launcher-card', '.systems-market-grid', '.ws-metrics', '.ws-mode-switch', '.ws-canvas-flow']) {
  assert.match(css, new RegExp(selector.replace('.', '\\.')), `estilo ausente: ${selector}`);
}
assert.match(css, /var\(--kind-system\)/, 'identidade do Sistema deve usar o token existente');
assert.match(css, /var\(--brand\)/, 'casca deve preservar a marca existente');
assert.doesNotMatch(css, /--company-brain-|--gtm-shell-/, 'não pode nascer um design system paralelo');

console.log('system-launcher-workspace: ok');
