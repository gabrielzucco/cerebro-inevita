# Story — Execution Canvas V1

## Contexto

O Canvas atual separa Cérebro, Sistema e Run, mas achata toda execução em nós funcionais
genéricos. O Execution Trace V1 e o Run Record V2 já registram referências de entrada e saída;
mesmo assim, a interface mostra somente um nó `Output`. Isso impede responder visualmente quais
artefatos entraram, qual contexto foi recuperado, qual entrega saiu e o que chegou ao julgamento.

Experimento não resolve essa lacuna: ele é uma sobreposição que agrupa e compara execuções. A
cadeia observável de qualquer Sistema precisa existir primeiro.

## Decisões congeladas

- Sistema mostra o pipeline contratado; etapa declarada não é tratada como execução observada.
- Run materializa somente artefatos presentes em Run Record ou Execution Trace reference-only.
- Fonte continua sendo a casa de verdade; arquivo, snapshot, briefing, task e entrega são
  artefatos/objetos da execução, não novas Fontes.
- Referências equivalentes do mesmo Context Snapshot são agrupadas em um único nó, preservando a
  contagem de recortes sem expor payload.
- Access Receipts não viram dezenas de nós: permanecem como evidência da Fonte acessada.
- Link externo só aparece quando existe referência HTTPS registrada e o host pertence à lista
  operacional permitida. Nenhum link é inferido de nome, ID parcial ou descrição humana.
- Experimento será overlay da cadeia; não terá topologia paralela.

## Acceptance criteria

- [x] System Graph mostra cada estágio do `pipeline` com input, output e gate no inspector.
- [x] Run Graph cria nós de artefato para instrução, coleta, Context Snapshot e entrega observados.
- [x] Arestas ligam artefatos aos passos que os produziram ou consumiram sem expor conteúdo.
- [x] Context pointers do mesmo snapshot não proliferam nós e mantêm contagem reference-only.
- [x] Inspector distingue contrato de objeto observado e oferece link externo apenas quando seguro.
- [x] O controle “Run” passa a se chamar “Execução” sem quebrar API ou layout existente.
- [x] Runs reais de Funil e Calls continuam coerentes com recibos, traces e julgamentos.
- [x] Testes, build do Canvas, validação de produto e QA visual passam.

## Tarefas

- [x] Read model de estágios e artefatos
- [x] Canvas e inspector
- [x] Testes unitários e E2E
- [x] Dogfood visual com Funil e Calls
- [x] Overlay de Experimento documentado como próximo corte

## Evidência

- O Sistema de Conteúdo renderizou 12 nós de contrato, incluindo 4 Fontes e 3 estágios; o
  inspector mostrou input, output e gate de `Produzir Resultado`.
- A execução real de Funil materializou instrução, coleta, Context Snapshot e entrega sem criar
  URL externa inexistente.
- A execução real de Calls renderizou 17 nós observados, 4 deles artefatos; Sources, Context
  Snapshot, entrega e julgamento permaneceram ligados ao Trace reconstruído.
- QA visual em 1920×1080 e 1280×900: todos os objetos enquadráveis, sem overflow horizontal em
  1280 px e sem erro no console do navegador.
- `node scripts/test-graph-read-model.mjs`
- `node scripts/test-console-server.mjs`
- `node scripts/test-execution-trace.mjs`
- `node scripts/test-handoff-protocol.mjs`
- `node scripts/test-experiment-protocol.mjs`
- `npm run build:console`
- `npm test` — 19 envelopes, 3 sistemas e 33 arquivos de skills válidos.

## Próximo corte

Experimento entra como overlay de uma ou mais execuções ligadas por `chain_id`: baseline,
variante, métricas, decisão e aprendizado. Antes disso, produtores e conectores precisam gravar
no Trace as referências HTTPS reais de task, arquivo, mídia publicada e objeto medido. O Canvas já
sabe abrir ClickUp, Drive e Meta quando a referência segura existe; Runs antigos não ganham link
inferido.

## File List

- `docs/stories/2026-08-24-execution-canvas-v1.md`
- `scripts/lib/graph-read-model.mjs`
- `scripts/test-graph-read-model.mjs`
- `scripts/test-console-server.mjs`
- `console/app.js`
- `console/canvas.js`
- `console/canvas.bundle.js`
- `console/styles.css`
