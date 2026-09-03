# Story — Execution Lineage + Handoff Runtime V1

## Contexto

O Execution Canvas já materializa Fontes, Context Snapshot, artefatos e julgamento de uma
execução isolada. Ainda falta a prova entre execuções: hoje o protocolo não consegue afirmar
que o artefato produzido por um Sistema foi aceito e consumido por outro. Sem essa costura, o
pipeline Drive → transcrição → briefing → task → aprovação → publicação → medição vira apenas
uma sequência visual provável.

Experimento é uma sobreposição dessa cadeia. O runtime genérico precisa existir primeiro e
permitir que qualquer execução registre seus objetos sem transformar arquivo, task ou publicação
em novas Fontes.

## Decisões congeladas

- `chain_id` costura qualquer cadeia; `experiment_ref` é opcional e nunca define a topologia.
- Run Record V2 e Execution Trace V1 aceitam lineage sem invalidar recibos legados.
- Modelo e Conector só aparecem como observados quando o runtime registra o evento real e seu
  nível de assurance.
- O único recibo novo entre Sistemas é o Handoff Receipt; não existe Artifact Receipt paralelo.
- Handoff Contract declara a possibilidade; a aresta só acende com Handoff Receipt aceito.
- Artefato cru continua em sua casa. Ledger, Trace e Console carregam apenas referência, versão,
  hash, estado e links HTTPS já registrados.
- Replay nunca se apresenta como live e nenhuma ação externa é executada por este corte.

## Acceptance criteria

- [x] Run Record V2 registra `chain_id`, `mode`, `experiment_ref` e `handoff_refs` com validação.
- [x] Execution Trace V1 carrega lineage e observa Modelo/Conector com assurance explícita.
- [x] Runtime persiste Handoff Contract e Handoff Receipt em diretórios privados e seguros.
- [x] Handoff aceito valida contrato, Runs produtor/consumidor, lineage, schema, versão e SHA-256.
- [x] Brain Canvas mostra handoffs declarados e só acende os comprovados por recibo aceito.
- [x] Execution Canvas mostra os Runs e o artefato da mesma cadeia ligados ao Run selecionado.
- [x] Inspector diferencia declaração, observação e replay sem expor payload.
- [x] A cadeia da tarja é provada por replay honesto, reference-only e sem ação externa.
- [x] Testes, build do Canvas e validação do produto passam.

## Tarefas

- [x] Schemas e validadores de lineage/observabilidade
- [x] Persistência e verificação do Handoff Runtime
- [x] Read model e Canvas da cadeia
- [x] Replay vertical da tarja
- [x] Testes, validação e recibo

## Evidência

- Chain: `chain-tarja-replay-20260824-001` (`mode: replay`, `experiment_ref: EXP-007`).
- Runs: `run-tarja-briefing-replay-20260824-001` →
  `run-tarja-reading-replay-20260824-001`.
- Handoff aceito: `handoff-receipt:handoff-tarja-replay-20260824-001`.
- O Brain Canvas mostrou `Creative Brief · REAL`; o Execution Canvas mostrou contexto, Modelo,
  artefato, link real do ClickUp, gate e julgamento concluídos.
- `npm test`, testes focados, `npm run build:console` e E2E do servidor local passaram.
- Replay usou somente evidência histórica local/exportada; não chamou Meta/Supabase ao vivo,
  não publicou conteúdo e não executou ação externa.

## File List

- `docs/stories/2026-08-24-execution-lineage-handoff-runtime-v1.md`
- `console/app.js`
- `console/canvas.bundle.js`
- `console/canvas.js`
- `console/styles.css`
- `protocol/README.md`
- `protocol/examples/execution-trace-event.v1.json`
- `protocol/examples/handoff-contract.v1.json`
- `protocol/examples/run-record.v2.json`
- `protocol/execution-trace-event.schema.json`
- `protocol/handoff-receipt.schema.json`
- `protocol/run-record-v2.schema.json`
- `scripts/console-server.mjs`
- `scripts/lib/company-brain-protocol-v2.mjs`
- `scripts/lib/console-read-model.mjs`
- `scripts/lib/context-snapshot-runtime.mjs`
- `scripts/lib/execution-trace-runtime.mjs`
- `scripts/lib/graph-read-model.mjs`
- `scripts/lib/handoff-protocol.mjs`
- `scripts/lib/json-schema-runtime.mjs`
- `scripts/lib/replay-runtime.mjs`
- `scripts/lib/routine-runtime.mjs`
- `scripts/test-company-brain-protocol-v2.mjs`
- `scripts/test-console-server.mjs`
- `scripts/test-execution-trace.mjs`
- `scripts/test-graph-read-model.mjs`
- `scripts/test-handoff-protocol.mjs`
- `scripts/test-replay-runtime.mjs`
- `scripts/test-routine-runtime.mjs`
- `scripts/validate-product.mjs`
