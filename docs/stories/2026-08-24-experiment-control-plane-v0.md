# Story — Experiment Control Plane V0

## Contexto

O Company Brain já representa Fontes, Sistemas, Rotinas, Runs, contexto selecionado e julgamento.
Experimentos ainda existem fora desse mapa: o método humano e o congelamento em Markdown são
fortes, mas o Console não consegue responder qual hipótese está em execução, quais Sistemas
participam, quais Runs pertencem ao teste, quando a leitura está autorizada ou se o aprendizado
voltou para a operação.

Este corte transforma Experimento em objeto de primeira classe sem criar uma segunda casa da
verdade. O pré-registro congelado vira contrato privado; coleta, emendas, Runs, martelo e aplicação
ficam em estado operacional separado. O Console projeta os dois e abre o conteúdo sensível somente
por gesto explícito.

## Decisões congeladas

- Experimento atravessa Sistemas; não é Fonte, Rotina nem subprocesso de um único Run.
- Contrato congelado e estado operacional são envelopes separados.
- O importador legado é determinístico, local e exige `--confirm`; não altera o ledger humano.
- Run pertence a Experimento por `entity_refs[{ role: "experiment", id: "EXP-..." }]`.
- Card e contagens não carregam hipótese, regra ou veredito cru; o detalhe privado exige clique.
- Experimento concluído sem `learning_ref` aparece como aprendizado não ligado. A UI não inventa a
  alteração do Sistema.
- O caso real de validação é o EXP-007, tarja de call-out no anúncio.
- Criar/ativar campanha, executar Meta, streaming de Run e Analytics global ficam fora deste corte.

## Acceptance criteria

- [x] Schemas e validadores separam Experiment Contract V1 de Experiment State V1.
- [x] Importador converte o ledger legado em contratos/estados privados sem apagar ou reescrever a
      origem e sem inferir controle, causalidade ou força estatística.
- [x] Runs com `entity_refs` de Experimento são ligados automaticamente no read model.
- [x] `/api/console` entrega somente resumo reference-only e contagens de Experimentos.
- [x] `/api/experiments/:id` abre hipótese, mudança, braços, régua, emendas, Runs, martelo e vínculo
      de aprendizado somente após gesto explícito local.
- [x] Navegação `Experimentos` mostra status, Sistema palco, Sistemas de leitura, métrica e progresso.
- [x] O detalhe visualiza Hipótese → Contrato → Execução → Medição → Martelo → Aprendizado e deixa
      lacunas visíveis.
- [x] EXP-007 real é importado e exibido como decidido; nenhum Run ou learning ref. inexistente é
      fabricado.
- [x] Testes unitários, integração do Console, validação do produto e QA visual passam.

## Tarefas

- [x] Protocolo e validação
- [x] Importador e read model
- [x] API privada e Console
- [x] Dogfood real e QA
- [x] Documentação e recibo

## Evidências

- Importação privada local: 15 Experimentos, sendo 10 decididos, 2 em execução e 4 com braços
  legados não estruturados; o ledger humano permaneceu intacto.
- EXP-007: contrato completo, dois braços, duas emendas e martelo registrados; zero Runs ligados e
  `learning_ref` ausente aparecem como lacunas, sem inferência retroativa.
- Suíte: 24 scripts passaram, incluindo protocolo, importador legado, API/Console e Execution Trace.
- QA visual no navegador local: lista, detalhe do EXP-007, ligação ao Canvas e viewport 1024 px sem
  erros ou warnings no Console.

## File List

- `docs/stories/2026-08-24-experiment-control-plane-v0.md`
- `.cerebro/layout.json`
- `DESIGN.md`
- `console/app.js`
- `console/index.html`
- `console/styles.css`
- `protocol/README.md`
- `protocol/examples/experiment-contract.v1.json`
- `protocol/examples/experiment-state.v1.json`
- `protocol/experiment-contract.schema.json`
- `protocol/experiment-state.schema.json`
- `scripts/console-bootstrap.mjs`
- `scripts/console-server.mjs`
- `scripts/import-legacy-experiments.mjs`
- `scripts/lib/console-read-model.mjs`
- `scripts/lib/experiment-protocol.mjs`
- `scripts/protocol-validate.mjs`
- `scripts/test-console-server.mjs`
- `scripts/test-experiment-protocol.mjs`
- `scripts/validate-product.mjs`
