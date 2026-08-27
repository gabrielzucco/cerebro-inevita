#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(process.cwd());
const app = readFileSync(resolve(root, 'console/app.js'), 'utf8');
const css = readFileSync(resolve(root, 'console/styles.css'), 'utf8');

const between = (start, end) => app.slice(app.indexOf(start), app.indexOf(end, app.indexOf(start)));
const today = between('function renderToday()', 'function canvasRefOptions');
const capabilities = between('function renderNativeCapabilities', 'function renderBrainOverview');
const workspace = between('function wsOverview', 'function wsProcessFlow');
const skills = between('function renderSkills', 'function openSkill');

assert.match(today, /queue\.open\.slice\(0, 5\)/, 'Hoje deve limitar a primeira fila de decisões');
assert.match(today, /routines\.slice\(0, 4\)/, 'Hoje deve limitar a primeira fila de rotinas');
assert.match(today, /<details class="today-more">/, 'a cauda de Hoje deve começar recolhida');

assert.match(capabilities, /você não precisa rodar um comando/, 'capacidade nativa deve explicar o uso automático');
assert.match(capabilities, /ESTADO NESTE CÉREBRO/, 'visão geral deve mostrar apenas uma prova curta');
assert.doesNotMatch(capabilities, /capability\.proof\.detail/, 'prova técnica detalhada não pertence à primeira camada');
assert.doesNotMatch(capabilities, /capability\.skills/, 'Skills não devem lotar o resumo de capacidades');
assert.match(css, /\.native-capability-card \{[^}]*grid-template-columns: 130px/, 'capacidades devem formar sequência compacta');

assert.match(app, /systems: \{ category: 'all', stage: 'all'/, 'Sistemas precisam de filtro de estágio independente');
assert.match(app, /data-system-stage/, 'launcher deve expor o filtro de estágio');
assert.match(app, /const weight = \{ active: 0, configured: 1, mapped: 2 \}/, 'Sistemas ativos devem vir primeiro');

assert.match(app, /\['overview', 'Sobre'\]/, 'primeira aba do Sistema deve se apresentar como Sobre');
assert(workspace.indexOf('Para que este sistema existe') < workspace.indexOf('${wsMetrics(ws)}'), 'promessa deve aparecer antes das métricas');
assert.match(workspace, /EVIDÊNCIA OPERACIONAL/, 'métricas devem manter uma seção própria');

assert.match(skills, /COMANDOS ESPECIALIZADOS/, 'Skills devem ser explicadas em linguagem de uso');
assert.doesNotMatch(skills, /\.claude\/skills/, 'caminhos técnicos não devem aparecer na primeira camada');
assert.match(css, /\.skill-card \{[^}]*min-height: 220px/, 'cards de Skills devem ser compactos');
assert.match(css, /\.skill-description \{[^}]*-webkit-line-clamp: 2/, 'descrição de Skill deve limitar-se a duas linhas');

console.log('company-brain-product-polish-v1: ok');
