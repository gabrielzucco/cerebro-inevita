# Story — Runs Explorer unificado (P1-11)

## Contexto

Depois do corte vertical Hoje/Anatomia/Workspace, as execuções do cérebro continuavam espalhadas
em duas superfícies: a view `runs` só listava routine receipts, e os run records completos (com
contexto, eval, decisão e cadeia) só apareciam dentro do workspace de cada sistema. Run records
standalone do ledger — replays de experimento e runs live encadeados — não tinham casa própria.

Este corte unifica tudo numa linha do tempo única, somente leitura, reaproveitando a gramática já
existente do Console: proveniência carimbada (`prov()`), lacuna visível, comparação A×B
(`wsCompareTable` → `runCompareTable`), salto para o trace no Canvas (`data-canvas-jump-run`) e
para o workspace do sistema.

## Acceptance criteria

- [x] `GET /api/runs` unifica routine receipts + run records standalone do ledger
      (`latestRunRecords`) numa lista única ordenada por conclusão.
- [x] Recibo sem Run Record não inventa snapshot, eval, decisão nem versão — campos ficam `null`
      e a UI mostra "contexto não registrado" / "versão não registrada".
- [x] Trace sondado no arquivo real por run: `recorded` × `reconstructed` × `none` ×
      `unreadable` (arquivo existe mas falha na validação atual), com contagem de eventos.
      Nada de métrica inventada.
- [x] Cada linha mostra: sistema (→ workspace), versão, rotina/experimento, modo (live/replay),
      status, contexto registrado (n fontes · lacunas/conflitos), eval, decisão humana,
      chain/handoffs e trace clicável (→ Canvas).
- [x] Decisão humana resolvida com julgamento do recibo ganhando de `human_decision` do record
      (o julgamento é o registro mais recente).
- [x] Filtros por sistema, modo, status, decisão e com/sem snapshot, respeitando o filtro global
      de Área (`state.areaFilter`); ordenação por coluna.
- [x] KPIs derivados só das linhas visíveis: total + últimos 7d, com/sem contexto, traces por
      origem, evals falhos, rejeitadas e pendentes de martelo.
- [x] Comparação entre duas runs quaisquer reusa `runCompareTable`; sistemas diferentes ou
      execução sem record dizem explicitamente que não são comparáveis, sem fingir.
- [x] Ledger ou recibo ilegível vira issue visível na view, não silêncio.
- [x] View substitui a antiga tabela de recibos na mesma rota `runs` da nav.
- [x] Zero escrita no vault; nenhum modelo executado ao abrir a view.
- [x] Testes na suíte HTTP real: 403 sem sessão, entrada de recibo com trace recorded e 3 fontes,
      recibo failed sem record honesto, record standalone (replay, chain, experimento, handoff)
      com "sem trace", e nenhum output privado no payload.

## Fora deste corte

- Decision Case com veredito escrito no vault (mesa futura, própria).
- Reconciliar os 4 traces antigos do vault que falham no validador atual
  (`model_ref`/`connector_ref` ausentes — anteriores ao endurecimento do schema); no Explorer
  eles aparecem honestamente como "Trace ilegível" com tooltip.
- Qualquer mutação de runtime, contrato ou rotina.

## Resultado

A rota `runs` virou o explorador único de execuções. Com os dados reais do vault: 10 execuções
(7 recibos de rotina + 3 run records standalone — 2 replays EXP-007 encadeados e 1 run live da
cadeia GTM), 8 nos últimos 7 dias. O gate de 2 minutos fecha: o que executou e com que resultado
(tabela + KPIs), o que tem contexto registrado × reconstruído (colunas Contexto e Trace + filtro
de snapshot), o que falhou em eval ou foi rejeitado (colunas Eval/Decisão + KPIs), e o que mudou
entre duas runs do mesmo sistema (A×B default já escolhe o par comparável mais recente — funil
v1.0.0 replay × v1.1.0 rotina, com fontes trocadas).

## File List

- `scripts/console-server.mjs` — `runsExplorerModel`, `traceProbe`, `runContextView`, rota
  `GET /api/runs` (commit `4e197e1`)
- `scripts/test-console-server.mjs` — asserts do `/api/runs` na suíte HTTP real (commit `4e197e1`)
- `console/app.js` — view Execuções (`renderRuns` + helpers `runsEntries`/`runsVisibleEntries`/
  `runsFilterBar`/`runsKpis`/`runsCompareSection`), refactor `wsCompareTable` → `runCompareTable`,
  handlers de filtro/ordenação/comparação, labels novos (commit `cd9fd98`)
- `console/styles.css` — `.runs-filterbar`, `.runs-table`, `th[data-runs-sort]` (commit `cd9fd98`)
- `console/index.html` — bump de cache `?v=5` em app.js e styles.css (commit `cd9fd98`)
- `docs/stories/2026-08-26-runs-explorer-unificado.md` — esta story

## Verificação

- `npm test` · `node scripts/test-console-server.mjs` · `node scripts/test-canvas-layout-readability.mjs`
  verdes antes de cada commit e após o fechamento.
- Verificado ao vivo no Chrome (Console na 4782, server reiniciado com o código novo): filtros,
  ordenação, A×B com diffs destacados, mensagens honestas de não-comparável, saltos para Canvas
  (run live da cadeia GTM) e workspace; único erro de console era de extensão do navegador.
