# Story — Linhagem da geração do índice no Context Snapshot

## Contexto

O Retrieval Provider já desacoplava Systems do driver e os recibos registravam consulta, perfil e
documentos selecionados. Ainda faltava provar qual geração do corpus sustentou a busca: um recibo
de retrieval poderia apontar para documentos sem dizer qual rebuild e quais hashes estavam ativos.

## Critérios de aceite

- [x] Recibos novos de retrieval carregam `index_receipt_ref` e `corpus_sha256`.
- [x] O Context Snapshot abre o recibo privado do índice e valida Provider, corpus, documentos,
      benchmark, privacidade, permissões e estado terminal.
- [x] Corpus divergente, benchmark reprovado, symlink, payload ou recibo ausente bloqueiam o Run.
- [x] O recibo da geração entra em `input_refs` e aparece no Execution Trace junto do recibo da
      consulta.
- [x] Recibos históricos do driver legado e do Provider V1 continuam legíveis sem reescrita.
- [x] Recibo novo sem índice só é válido para `retrieval_unavailable/index_not_ready`.
- [x] Testes e validação completa do produto permanecem verdes.

## Fluxo

```text
source-index-receipt + corpus_sha256
                 ↓
retrieval-receipt + selected document_refs
                 ↓
Context Snapshot → input_refs → Execution Trace → Run Record
```

## Fora deste corte

- copiar conteúdo do índice para o ledger;
- migrar recibos históricos;
- indexar a zona de terceiros;
- alterar automaticamente uma Fonte canônica.

## Verificação

- 31/31 testes do Runtime verdes.
- Produto válido com 19 envelopes, 3 Sistemas e 33 skills sincronizadas.
- `git diff --check` verde.

## File List

- `scripts/lib/context-snapshot-runtime.mjs`
- `scripts/test-context-snapshot-runtime.mjs`
- `docs/stories/2026-08-26-source-index-lineage-v1.md`
