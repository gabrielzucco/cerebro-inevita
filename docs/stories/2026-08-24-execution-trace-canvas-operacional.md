# Story — Execution Trace V1 + Canvas Operacional V0

## Contexto

O Console já compila Áreas, Sistemas, Fontes, Rotinas, Run Record V2 e Julgamento. Ainda falta
mostrar a topologia esperada e o caminho realmente percorrido por cada Run. O Run Record prova o
contexto selecionado, mas não registra a ordem dos passos; `eval.passed` pode continuar nulo mesmo
quando um harness foi executado fora do runtime; e a UI não pode afirmar que uma skill participou
sem evidência de carregamento.

Este corte cria uma camada de observabilidade local e reference-only. O Canvas deriva contratos,
recibos e eventos; não armazena uma arquitetura editorial concorrente.

## Decisões congeladas

- AntV G6 é o motor visual; Canvas V0 continua independente de React.
- Execution Trace V1 é append-only, privado, ordenado e sem prompt/output/erro cru.
- Skill só aparece como usada quando o runtime leu explicitamente o arquivo e registrou o hash.
- Gates determinísticos de Calls rodam dentro do runtime antes do Run Record final.
- Runs antigos podem ganhar trace reconstruído, marcado como `reconstructed`; isso não finge
  granularidade temporal que o recibo antigo não possui.
- Reorganização salva somente posições locais. Alterar a topologia exige contrato novo.

## Acceptance criteria

- [x] Schema e validador do Execution Trace Event V1 rejeitam payload privado e sequência inválida.
- [x] Runtime emite eventos para acesso, coleta, recuperação, skill carregada, capability/modelo,
      output, eval e julgamento.
- [x] `skill_ref` só existe após leitura real e SHA-256 do arquivo; declaração sem leitura não vira uso.
- [x] Calls executa seus quatro gates no runtime e persiste `eval.passed` + resultados reference-only.
- [x] Endpoints entregam `{nodes, edges, states}` para Cérebro, Sistema e Run.
- [x] Runs sem trace têm derivação honesta `reconstructed`; Runs novos usam trace `recorded`.
- [x] Canvas alterna Cérebro/Sistema/Run, abre inspector, faz fit e mostra legenda de estados.
- [x] `Reorganizar` move nós e persiste apenas layout privado com confirmação e CSRF.
- [x] Console mantém lista equivalente e não expõe conteúdo privado.
- [x] Runs reais de Funil e Calls abrem no Canvas e seus estados batem com recibos/Run Records.
- [x] Testes, validação de produto, build e QA visual passam.

## Tarefas

- [x] Protocolo e runtime
- [x] Gates e skill load
- [x] Read models e endpoints
- [x] Canvas G6 e layout local
- [x] Backfill/validação real
- [x] Testes e documentação

## Evidência

- Calls real: trace reconstruído com 14 eventos; quatro gates concluídos; `eval.passed: true`.
- Funil real: trace reconstruído com 11 eventos; gates continuam declarados porque a execução
  histórica não registrou avaliação.
- Mapa real: 32 nós e 77 arestas, compilados de 3 Áreas, 14 Sistemas, 13 Fontes e 2 Rotinas.
- QA em Chromium: Cérebro, Sistema e Run renderizados sem erro de console; lista equivalente abre
  o mesmo inspector por teclado.
- Harness: trace, evaluator, graph read model, routine runtime, Context Snapshot, protocolo,
  bundle e Console E2E passaram.

## File List

- `DESIGN.md`
- `AGENTS.md`
- `protocol/execution-trace-event.schema.json`
- `protocol/examples/execution-trace-event.v1.json`
- `protocol/routine-contract.schema.json`
- `protocol/README.md`
- `scripts/lib/execution-trace-runtime.mjs`
- `scripts/lib/evaluation-runtime.mjs`
- `scripts/lib/graph-read-model.mjs`
- `scripts/lib/canvas-layout-runtime.mjs`
- `scripts/lib/model-executors.mjs`
- `scripts/lib/routine-protocol.mjs`
- `scripts/lib/routine-runtime.mjs`
- `scripts/lib/context-snapshot-runtime.mjs`
- `scripts/backfill-execution-trace.mjs`
- `scripts/protocol-validate.mjs`
- `scripts/console-server.mjs`
- `.cerebro/layout.json`
- `.gitignore`
- `console/index.html`
- `console/app.js`
- `console/canvas.js`
- `console/styles.css`
- `package.json`
- `package-lock.json`
- `scripts/test-execution-trace.mjs`
- `scripts/test-evaluation-runtime.mjs`
- `scripts/test-graph-read-model.mjs`
- `scripts/test-console-server.mjs`
- `scripts/test-routine-runtime.mjs`
