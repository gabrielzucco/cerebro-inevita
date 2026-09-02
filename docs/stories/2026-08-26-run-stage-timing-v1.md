# Story — Duração real por etapa no Execution Trace

## Contexto

O Canvas já reproduzia o caminho de um Run, mas mostrava apenas sequência e estado. A prova real
de Calls levou 5m21s; coleta e retrieval fecharam em cerca de 3s, enquanto quase toda a espera
ficou dentro da execução do modelo. Sem duração por etapa, o Cockpit atribuía a lentidão ao Run
inteiro e não ajudava a diagnosticar o gargalo.

## Critérios de aceite

- [x] Duração é derivada dos timestamps append-only do trace; nenhum payload novo entra no ledger.
- [x] O Run mostra total, cobertura medida, tempo não atribuído e etapa dominante.
- [x] Coleta, contexto, execução/modelo, entrega, avaliação e julgamento aparecem em ordem.
- [x] Modelo ganha evento `running` nos Runs novos; traces antigos continuam legíveis e honestos.
- [x] Etapa sem par de início/fim aparece como marco, nunca como duração inventada.
- [x] Clicar numa etapa leva ao nó correspondente e o inspector mostra sua duração.
- [x] O replay mostra o tempo relativo observado sem esperar os minutos reais.
- [x] Traces reconstruídos mostram apenas o total disponível e declaram granularidade limitada.
- [x] API e UI continuam reference-only e não expõem prompt, output ou erro cru.
- [x] Testes do Runtime, Console e produto permanecem verdes.

## Prova real

- Run: `routine-run-b868df8b-5a25-4d35-a1b4-2b926f4e6020`.
- Total: `321.287 ms`.
- Coleta: `2.760 ms`; contexto: `6 ms`; execução/modelo: `318.502 ms`; entrega: `1 ms`;
  avaliação: `7 ms`; `11 ms` entre etapas; julgamento pendente.
- O trace histórico possui apenas o marco final do modelo, então a UI declara “duração não
  separada neste trace”. Runs novos registram `model running → terminal` e passam a separar o
  tempo exato sem migrar o passado.

## Verificação

- 31/31 suítes do Runtime verdes antes do refinamento visual final; testes focados de grafo,
  Runtime e Console reexecutados depois.
- Produto válido com 19 envelopes, 3 Sistemas e 33 skills sincronizadas.
- QA no Cockpit real confirmou proporções, clique da avaliação até o gate e replay com `t+`.
- `node --check` e `git diff --check` verdes.

## Fora deste corte

- streaming ao vivo de um Run ainda em execução;
- tokens, custo ou latência reportada pelo provider;
- SLA, alerta ou histórico agregado entre Runs;
- reescrita dos traces históricos.

## File List

- `scripts/lib/graph-read-model.mjs`
- `scripts/lib/routine-runtime.mjs`
- `scripts/test-graph-read-model.mjs`
- `scripts/test-routine-runtime.mjs`
- `scripts/test-console-server.mjs`
- `console/app.js`
- `console/styles.css`
- `docs/stories/2026-08-26-run-stage-timing-v1.md`
