#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(process.cwd());
const app = readFileSync(resolve(root, 'console/app.js'), 'utf8');
const css = readFileSync(resolve(root, 'console/styles.css'), 'utf8');

assert.match(
  app,
  /\['activation', 'canvas', 'system', 'systems', 'skills', 'hermes', 'society'\]\.includes\(state\.view\) \|\| state\.view === 'anatomy'/,
  'Launcher e catálogo de capacidades não devem repetir o resumo operacional de Hoje',
);
assert.match(
  css,
  /\.systems-market-grid \{[^}]*minmax\(330px, 1fr\)/,
  'grade deve reservar largura suficiente para reconhecer cada Sistema',
);
assert.match(
  css,
  /\.system-card-title h3 \{[^}]*font-size: var\(--fs-lead\)/,
  'nome do Sistema deve manter hierarquia de título',
);
assert.doesNotMatch(
  css,
  /\.system-card-title h3 \{[^}]*-webkit-line-clamp/,
  'nome do Sistema não pode ser truncado por quantidade fixa de linhas',
);
assert.match(
  css,
  /\.system-result \{[^}]*-webkit-line-clamp: 3/,
  'resultado precisa de três linhas úteis antes do corte',
);
assert.doesNotMatch(css, /\.system-accent-\d/, 'categoria não pode voltar a pintar a casca do card');
assert.doesNotMatch(css, /\.system-launcher-card[^}]*linear-gradient/, 'card não pode usar gradiente decorativo');

console.log('company-brain-launcher-hierarchy-v1: ok');
