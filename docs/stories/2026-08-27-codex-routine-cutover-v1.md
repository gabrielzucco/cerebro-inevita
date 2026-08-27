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

## Acceptance criteria

- [x] Manifesto de importação rejeita payload, segredo, referência inválida e Skill não declarada.
- [x] Preview não escreve; `--confirm` cria Routine Run Receipt e Execution Trace.
- [x] Repetir a importação é `no-change`; divergência no mesmo recibo é conflito.
- [x] Recibo preserva versão histórica e aponta somente para referências locais opacas.
- [x] Trace reconstruído carrega origem, evidência externa e assurance sem copiar prompt/output.
- [ ] Radar e Personas históricos aparecem no Runs Explorer.
- [ ] Personas diário possui contrato, prompt, grants e migração próprios.
- [ ] Radar, Personas diário, semanal e mensal completam prova manual nativa.
- [ ] Automações legadas são pausadas com readback e as rotinas nativas ficam ativas.
- [ ] Cockpit e validação integral permanecem verdes.

## File List

- `scripts/lib/legacy-routine-run-import.mjs`
- `scripts/import-legacy-routine-runs.mjs`
- `scripts/test-legacy-routine-run-import.mjs`
- `docs/stories/2026-08-27-codex-routine-cutover-v1.md`
- `.automacao/rotinas/radar-voz-diario.prompt.md`
- `.automacao/rotinas/personas-match-diario.prompt.md`
- `.cerebro/contracts/routines/{radar-voz-diario,personas-match-diario,personas-drift-semanal,personas-upgrade-mensal}.json`
- `.cerebro/contracts/access-grants/grant-{radar,personas}-*.json`
- `.cerebro/contracts/systems/{inteligencia-conhecimento,oferta-vendas}.json`
- `.cerebro/runtime/executors/executor-codex-gabriel.json`
- `.cerebro/runtime/imports/codex-radar-personas-history-v1.json`
- `.cerebro/runtime/migrations/routines/{radar-voz-diario,personas-match-diario,personas-drift-semanal,personas-upgrade-mensal}.json`
