#!/usr/bin/env node
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { companyMapModel } from './console-server.mjs';

const root = resolve(process.cwd());
const app = readFileSync(resolve(root, 'console/app.js'), 'utf8');
const css = readFileSync(resolve(root, 'console/styles.css'), 'utf8');
const server = readFileSync(resolve(root, 'scripts/console-server.mjs'), 'utf8');

assert.match(app, /\? saved : 'overview'/, 'Visão geral deve abrir por padrão');
assert.match(app, /\['memory', 'Memória'\]/, 'Mapa da empresa precisa sobreviver dentro de Memória');
assert.match(app, /\['architecture', 'Arquitetura'\]/, 'grafo estrutural precisa sobreviver dentro de Arquitetura');
assert.match(app, /function renderCompanyMap\(anatomy\)/, 'renderer do mapa vivo ausente');
assert.match(app, /data-brain-map-search/, 'mapa precisa de busca local');
assert.match(app, /Não chama modelo/, 'busca precisa declarar a fronteira honesta');
assert.match(app, /anatomy\.company_map/, 'experiência deve ler o read model do mapa');
assert.match(app, /state\.brain\.mode === 'architecture'.*void loadBrainGraph\(\)/s, 'Arquitetura deve carregar o grafo quando escolhida');

const loadAnatomy = app.match(/async function loadAnatomy\(\) \{([\s\S]*?)\n\}\n\nasync function loadBrainGraph/)?.[1] || '';
assert.doesNotMatch(loadAnatomy, /api\/graphs\/brain/, 'modo novo não pode baixar o grafo no primeiro carregamento');
assert.match(server, /Estratégia & negócio/);
assert.match(server, /Marketing & vendas/);
assert.match(server, /Produto & entrega/);
assert.match(server, /Comunidade/);
assert.match(server, /Pesquisa & referências/);
assert.match(server, /Operação & tecnologia/);
assert.match(server, /third_party_aggregate_only: true/, 'dados de terceiros devem ficar somente em agregado');

for (const selector of ['.brain-mode-switch', '.company-map-search', '.company-map-layout', '.company-domain', '.company-source-brief', '.company-routine-list', '.company-memory-flow']) {
  assert.match(css, new RegExp(selector.replace('.', '\\.')), `estilo ausente: ${selector}`);
}

const fixture = mkdtempSync(join(tmpdir(), 'company-map-'));
const put = (relative, content = 'x') => {
  const target = join(fixture, relative);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, content);
};

try {
  put('01-nucleo-privado/operacao-comunidade/_OFERTAS.md');
  put('01-nucleo-privado/producao-conteudo/ads/_a-classificar/ad.md');
  put('01-nucleo-privado/founders/dailies/2026-08-27.md');
  put('01-nucleo-privado/sistemas/demo/sistema.md');
  put('02-dados-terceiros/calls-raw/call.md', 'conteúdo que o read model não deve devolver');
  put('.cerebro/contracts/systems/demo.json', '{}');
  put('.cerebro/contracts/experiments/exp.json', '{}');
  put('.cerebro/contracts/routines/daily.json', '{}');
  put('.cerebro/contracts/sources/vault.json', '{}');

  const model = {
    systems: [{ system_id: 'demo' }],
    experiments: [{ experiment_id: 'exp' }],
    routines: [{
      routine_id: 'routine-demo', name: 'Rotina demo', health_reason_code: 'active', schedule: 'Diária',
      receipts: [{ completed_at: '2026-08-25T10:00:00Z' }, { completed_at: '2026-08-27T10:00:00Z' }],
    }],
    issues: [],
  };
  const sources = [{ source_id: 'vault', last_access: { occurred_at: '2026-08-27T09:00:00Z' } }];
  const map = companyMapModel(fixture, { model, sources, round: null, contextGaps: 2 });
  const entries = map.domains.flatMap((domain) => domain.entries);
  const byId = new Map(entries.map((entry) => [entry.id, entry]));

  assert.equal(byId.get('systems').count, 1, 'Sistemas deve contar objetos sem somar arquivos e contratos');
  assert.equal(byId.get('experiments').count, 1, 'Experimentos deve contar objetos sem duplicar estado e contrato');
  assert.equal(byId.get('third-party').sealed, true);
  assert.equal(map.privacy.content_exposed, false);
  assert.equal(map.privacy.third_party_aggregate_only, true);
  assert.equal(map.care.context_gaps, 2);
  assert.equal(map.routines[0].name, 'Daily dos founders');
  assert.equal(map.routines.at(-1).last_observed, '2026-08-27T10:00:00Z', 'rotina deve usar o recibo mais recente');
  assert.deepEqual(map.memory_flow.map((step) => step.name), ['Fonte', 'Bruto', 'Processado', 'Destilado', 'Contexto vigente', 'Sistema', 'Julgamento', 'Aprendizado']);
  assert.doesNotMatch(JSON.stringify(map), /conteúdo que o read model não deve devolver/);
} finally {
  rmSync(fixture, { recursive: true, force: true });
}

console.log('company-brain-company-map-v0: ok');
