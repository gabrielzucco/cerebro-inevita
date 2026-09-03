# Story — Retrieval Receipt no Context Snapshot V2

## Contexto

O cérebro interno já possui um gateway GBrain aprovado que devolve somente referências e grava um
`retrieval-receipt` privado. O Runtime de Sistemas já produz Context Snapshot V2, mas só consegue
selecionar JSON Pointers de um artefato determinístico; ainda não consegue provar que uma busca
semântica real selecionou os documentos usados.

Este corte liga as duas peças sem abrir o conteúdo recuperado: o collector continua privado e
registra no seu artefato apenas a referência do recibo. O Context Snapshot resolve essa referência,
valida perfil, privacidade e decisão e incorpora somente `document_ref`s.

## Acceptance criteria

- [x] `source_selections` aceita modo `retrieval-receipt` por ponteiro dinâmico no artefato.
- [x] O contrato exige SHA-256 do perfil esperado e impede misturar pointer selection com receipt.
- [x] O Runtime lê recibos somente de `.cerebro/runtime/receipts/retrieval/` e bloqueia symlink.
- [x] Recibo precisa ser reference-only, ter identidade íntegra, perfil pinado e combinações válidas
      de status/decisão/referências.
- [x] Context Snapshot grava documentos selecionados, hash da consulta, recibo, assurance e frescor,
      mas nunca query, snippet ou conteúdo.
- [x] `insufficient_evidence` vira gap quando a Fonte é opcional e bloqueia quando é obrigatória.
- [x] `retrieval_unavailable` nunca vira fallback confiante.
- [x] O recibo entra em `input_refs`, permitindo Execution Trace e Run Record mostrarem a linhagem.
- [x] Testes cobrem sucesso, abstenção, indisponibilidade, perfil divergente, privacidade e symlink.
- [x] Validador do produto e suíte do Runtime permanecem verdes.
- [x] Nenhuma Fonte real, modelo, ação externa, MCP ou conteúdo privado é aberto neste corte.

## Fluxo

```text
collector privado
  └── artefato: { retrieval_receipt_ref }
                         ↓
Context Snapshot Runtime
  ├── valida recibo + perfil + privacidade
  ├── accepted → document refs no access
  ├── insufficient_evidence → gap/stop
  └── unavailable/invalid → gap/stop, nunca conteúdo alternativo
                         ↓
Run Record + Execution Trace por referência
```

## Fora deste corte

- Alterar um collector real para chamar o gateway.
- Executar novamente Funil, Calls ou Próxima Melhor Ação.
- Abrir o conteúdo dos documentos recuperados para um modelo.
- Exibir o novo acesso no Console além do que a vista genérica já deriva do Run Record.

## Resultado

O Runtime agora aceita dois modos mutuamente exclusivos de seleção: recorte determinístico por
JSON Pointer ou recibo dinâmico de recuperação. O segundo modo fecha a linhagem da busca sem mover
o conteúdo para o ledger: somente `document_ref`, `query_sha256`, `profile_sha256`, frescor,
assurance e a referência privada do recibo chegam ao Context Snapshot.

O consumidor rejeita recibos com campos extras, payload cru, privacidade divergente, perfil não
pinado, permissões abertas, symlink, ranking descontínuo ou combinação incoerente de estado. Uma
abstenção permanece abstenção e uma indisponibilidade permanece indisponibilidade; nenhuma das duas
é convertida em evidência confiante.

### Verificação

- `node scripts/test-context-snapshot-runtime.mjs` — verde.
- `node scripts/test-routine-runtime.mjs` — verde.
- `scripts/test-*.mjs` — 28/28 suítes do Runtime verdes, incluindo os servidores locais.
- `npm test` — verde: 19 envelopes, 3 sistemas e 33 arquivos de skills sincronizados.
- `git diff --check` — verde.

## File List

- `scripts/lib/context-snapshot-runtime.mjs`
- `scripts/test-context-snapshot-runtime.mjs`
- `protocol/routine-contract.schema.json`
- `scripts/lib/routine-protocol.mjs`
- `scripts/test-routine-runtime.mjs`
- `docs/stories/2026-08-26-context-snapshot-retrieval-receipts-v1.md`
