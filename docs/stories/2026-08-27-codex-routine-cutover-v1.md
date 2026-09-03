# Story — Codex Routine Cutover V1

## Contexto

Radar de Voz e Personas já operavam como automações locais do Codex, mas as tasks, memórias e
resultados agregados ficavam fora do ledger do Company Brain. Os Routine Contracts existiam, porém
sem Routine Run Receipts; por isso o Cockpit confundia “não observado no protocolo” com “nunca
executado”. A migração também não pode desligar o legado antes de grants, prova manual e runner
nativo estarem prontos.

## Decisões

- Histórico legado entra reference-only, com IDs determinísticos e importação idempotente.
- Trace histórico é `reconstructed`; não inventa acesso, contexto, duração ou uso efetivo de Skill.
- Skill solicitada no legado aparece apenas como `declared` e `requested-not-verified`.
- Ausência de Run Record V2 permanece `context-not-recorded`; o importador não fabrica snapshot.
- O matcher diário de Personas deixa de ser etapa escondida do Radar e ganha Routine Contract.
- O legado só é pausado depois de uma execução manual nativa concluída por rotina.
- A confirmação da pausa e a ativação usam o Routine Migration existente para impedir duplicidade.
- Executor `workspace-write` usa a revisão automática de aprovações do Codex para permitir a
  elevação auditável de rede; sandbox fixa sem rota de aprovação não vale como prova funcional.
- Todo Run recebe um envelope constitucional que distingue execução de configuração: metadados de
  schedule/cutover nunca autorizam criar, alterar, pausar ou excluir automações.
- Reexecução do mesmo `run_key` atualiza métricas e também as quatro bordas da janela observada.

## Acceptance criteria

- [x] Manifesto de importação rejeita payload, segredo, referência inválida e Skill não declarada.
- [x] Preview não escreve; `--confirm` cria Routine Run Receipt e Execution Trace.
- [x] Repetir a importação é `no-change`; divergência no mesmo recibo é conflito.
- [x] Recibo preserva versão histórica e aponta somente para referências locais opacas.
- [x] Trace reconstruído carrega origem, evidência externa e assurance sem copiar prompt/output.
- [x] Radar e Personas históricos aparecem no Runs Explorer.
- [x] Personas diário possui contrato, prompt, grants e migração próprios.
- [x] Radar, Personas diário, semanal e mensal completam prova manual nativa.
- [x] Automações legadas são pausadas com readback e as rotinas nativas ficam ativas.
- [x] Cockpit e validação integral permanecem verdes.

## Cutover comprovado em 27/08

- Radar: `routine-receipt-99b8a7af-7e9f-4aeb-9c50-f56567b2aa7e` — 200 mensagens
  sanitizadas, 26 fontes locais, 2 evidências aceitas e 2 propostas; sem falha de Fonte.
- Personas diário: `routine-receipt-866f2519-2b76-4913-b3fc-93f05a9aa967` — população 70,
  cobertura 87,14%, 146 unmatched, zero drift e 3 propostas abertas.
- Personas semanal: `routine-receipt-7db129b8-92ac-4767-82e3-a2a917f32478` — população 943,
  cobertura 83,03%, 1 flag de baseline semântico insuficiente e 3 propostas abertas.
- Personas mensal: `routine-receipt-ad5384cc-c278-44f6-8d76-36aa0f5ffe36` — população 944,
  cobertura 83,05%, 3 martelos abertos e nenhuma decisão automática. O readback do Supabase
  confirmou janela atual `2026-07-31`–`2026-08-27` e comparação `2026-07-03`–`2026-07-30`.
- Os quatro primeiros recibos usados para ativar as rotinas comprovaram o executor, mas não o efeito
  de negócio: a sandbox bloqueou DNS. Eles permanecem na linhagem; não são a evidência funcional.
- Um primeiro retry diário de Personas criou por engano uma automation Codex duplicada; ela foi
  pausada com readback e originou o envelope constitucional de execução. Não ficou agenda duplicada
  ativa.
- Os três agendamentos legados têm readback `PAUSED`; as quatro migrações estão
  `cutover-completed` e as quatro rotinas nativas estão `active`.
- `test-routine-runtime`, 16 testes do lifecycle de Personas, validação integral do produto e
  readback autenticado de `/api/console` passaram; o Console projeta as quatro rotinas como
  `state.status=active`, `migration.status=cutover-completed` e zero issue de protocolo.

## File List

- `scripts/lib/legacy-routine-run-import.mjs`
- `scripts/import-legacy-routine-runs.mjs`
- `scripts/test-legacy-routine-run-import.mjs`
- `scripts/lib/model-executors.mjs`
- `scripts/lib/routine-runtime.mjs`
- `scripts/test-routine-runtime.mjs`
- `docs/stories/2026-08-27-codex-routine-cutover-v1.md`
- `.automacao/persona_lifecycle.py`
- `.automacao/test_persona_lifecycle.py`
- `.automacao/rotinas/radar-voz-diario.prompt.md`
- `.automacao/rotinas/personas-match-diario.prompt.md`
- `.cerebro/contracts/routines/{radar-voz-diario,personas-match-diario,personas-drift-semanal,personas-upgrade-mensal}.json`
- `.cerebro/contracts/access-grants/grant-{radar,personas}-*.json`
- `.cerebro/contracts/systems/{inteligencia-conhecimento,oferta-vendas}.json`
- `.cerebro/runtime/executors/executor-codex-gabriel.json`
- `.cerebro/runtime/imports/codex-radar-personas-history-v1.json`
- `.cerebro/runtime/migrations/routines/{radar-voz-diario,personas-match-diario,personas-drift-semanal,personas-upgrade-mensal}.json`
