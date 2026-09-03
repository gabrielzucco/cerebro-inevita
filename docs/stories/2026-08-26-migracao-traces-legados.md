# Story — Migração one-shot dos traces legados (commit `82e006c`)

> Formalização retroativa: este trabalho foi entregue por outra mesa no commit `82e006c`
> ("fix(trace): migração one-shot dos traces legados sem model_ref/connector_ref") sem story
> própria, e uma linha dele (`validate-product.mjs`) acabou varrida para dentro do commit
> `8b2810b` do Decision Case — o risco documentado de mesas paralelas. Esta story registra o
> escopo e o File List para o histórico ficar auditável; o conteúdo técnico é o do commit.

## Contexto

O Runs Explorer (P1-11) expôs honestamente 4 traces do vault como "Trace ilegível": os arquivos
existem, mas foram gravados antes do validador atual exigir `model_ref`/`connector_ref`. A
reconciliação ficou registrada como task separada — este é o corte que a executa: uma migração
one-shot que completa os eventos legados sem inventar observação (campos ausentes viram valores
explícitos de reconstrução, nunca dados fabricados).

## File List (commit `82e006c`)

- `scripts/migrate-execution-traces.mjs` — a migração one-shot dos traces legados
- `scripts/test-migrate-execution-traces.mjs` — suíte da migração
- `scripts/lib/execution-trace-runtime.mjs` — ajuste do runtime de trace
- `scripts/validate-product.mjs` — registro dos dois arquivos no harness (linha entregue dentro
  do commit `8b2810b` por varredura de working tree entre mesas; o conteúdo pertence a este corte)

## Verificação

- `node scripts/test-migrate-execution-traces.mjs` verde na suíte completa do produto
  (`scripts/test-*.mjs`), junto com `npm test`.
