#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(process.cwd());
const read = (path) => readFileSync(resolve(root, path), 'utf8');
const app = read('console/app.js');
const css = read('console/styles.css');
const readModel = read('scripts/lib/console-read-model.mjs');

assert.doesNotMatch(app, /^import .*canvas\.bundle\.js/m, 'Canvas não pode bloquear o bootstrap');
assert.match(app, /import\('\/canvas\.bundle\.js\?v=5'\)/, 'Canvas deve ser carregado dinamicamente');
assert.match(app, /const TOTAL = lowPower \? 36 : 72/, 'ambiente deve respeitar orçamento de partículas');
assert.match(app, /Math\.min\(window\.devicePixelRatio \|\| 1, 1\.5\)/, 'Canvas deve limitar densidade de pixels');
assert.match(app, /visibilitychange/, 'animação deve pausar quando a aba fica oculta');

assert.match(app, /Reproduzir trace/, 'ação deve nomear exatamente o que reproduz');
assert.match(app, /replay visual indisponível/, 'Run sem eventos deve explicar a limitação');
assert.match(app, /button\.disabled = replayEvents === 0/, 'disponibilidade deve derivar dos eventos');
assert.doesNotMatch(app, />▶ Replay</, 'rótulo antigo não pode sobreviver');

for (const category of ['Vendas', 'Marketing', 'Produto', 'Operações', 'Comunidade', 'Dados & Tecnologia']) {
  assert.match(app, new RegExp(category), `launcher sem função empresarial ${category}`);
}
assert.match(app, /data-system-category/, 'launcher deve permitir filtro por função');
assert.match(app, /data-system-search/, 'launcher deve permitir busca local');
for (const area of ['Comercial', 'Operações & Tecnologia', 'Produto & Comunidade']) {
  assert.match(app, new RegExp(area), `área interna sem nome empresarial ${area}`);
}
assert.match(app, /system-identity/, 'cards devem ter identidade visual própria');
assert.match(app, /mark\.kind !== 'monogram'/, 'identidade publicada deve respeitar o Experience Manifest');
assert.match(app, /system-identity is-published/, 'marca publicada deve permanecer contida no módulo de identidade');
assert.doesNotMatch(app, /style="--system-accent:/, 'identidade não pode relaxar a CSP com estilo inline');
assert.match(app, /Dono operacional/, 'card deve nomear responsabilidade sem fingir publisher');
assert.match(readModel, /operational_owner: contract\.result\.owner/, 'read model deve expor dono declarado');

for (const selector of [
  '.systems-launcher-toolbar', '.system-filter', '.systems-market-grid',
  '.system-identity', '.system-compact-actions', '.replay-availability',
]) {
  assert.match(css, new RegExp(selector.replace('.', '\\.')), `estilo ausente: ${selector}`);
}
assert.match(css, /#area-switcher \.area-pill \{ grid-template-columns: 14px/, 'switcher de Área não pode invadir o conteúdo no mobile');

console.log('company-brain-product-cut-v1: ok');
