# Story — Retrieval Provider Contract V1

## Contexto

O Runtime já conseguia ligar um recibo de recuperação ao Context Snapshot, mas a identidade do
transporte estava acoplada ao GBrain. Isso confundia uma implementação open source com o protocolo
do Company Brain e tornava a troca futura de motor uma mudança nos consumidores.

Este corte cria a fronteira estável da INEVITA: Systems e Rotinas conhecem um `provider_ref`, uma
Fonte e um recibo genéricos. GBrain permanece declarado e atribuído somente como o driver local
atual desse Provider.

## Critérios de aceite

- [x] Existe um Retrieval Provider Contract V1 fechado e validado por código.
- [x] O contrato separa interface, driver, corpus, privacidade, assurance e licença.
- [x] A interface exige `retrieve`, `health`, recibo auditável e falha fechada.
- [x] O corpus exige catálogo explícito; a zona de dados de terceiros permanece fora.
- [x] O Runtime valida `provider_ref` contra o binding da Source Contract.
- [x] Recibos novos não dependem de nome de implementação ou transporte específicos.
- [x] Recibos históricos sem `provider_ref` continuam legíveis somente pela exceção explícita do
      antigo transporte `gbrain-vector-daemon`, sem reescrever o ledger.
- [x] Divergência entre Provider observado e Provider autorizado bloqueia o Context Snapshot.
- [x] Testes de protocolo, Context Snapshot, Rotina e Canvas permanecem verdes.

## Fluxo

```text
System / Routine
  -> Source: operational-memory-index
  -> Provider: local-semantic-retrieval
  -> driver atual: GBrain
  -> retrieval-receipt reference-only
  -> Context Snapshot / Execution Trace
```

## Fora deste corte

- tornar GBrain parte da identidade comercial do produto;
- importar automaticamente novas Fontes para o índice;
- indexar `02-dados-terceiros/`;
- reescrever recibos históricos;
- publicar ou executar ação externa.

## Verificação

- `node scripts/test-retrieval-provider-protocol.mjs` — verde.
- `node scripts/test-context-snapshot-runtime.mjs` — verde, incluindo recibo novo, legado e
  Provider divergente.
- 31/31 suítes do Runtime — verdes.
- `npm test` — verde: 19 envelopes, 3 Sistemas e 33 arquivos de skills sincronizados.

## File List

- `protocol/retrieval-provider-contract.schema.json`
- `protocol/examples/retrieval-provider-contract.v1.json`
- `scripts/lib/retrieval-provider-protocol.mjs`
- `scripts/test-retrieval-provider-protocol.mjs`
- `scripts/protocol-validate.mjs`
- `scripts/lib/context-snapshot-runtime.mjs`
- `scripts/test-context-snapshot-runtime.mjs`
- `scripts/validate-product.mjs`
- `protocol/README.md`
- `docs/stories/2026-08-26-retrieval-provider-contract-v1.md`
