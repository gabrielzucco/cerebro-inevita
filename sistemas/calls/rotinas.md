# Rotinas — Calls em Decisões

## Por evento

- **Terminou uma reunião importante:** tratar em até 48 horas.
- **Entrou uma transcrição:** iniciar o pipeline.
- **Chegou a próxima reunião:** revisar pendências ainda abertas antes de extrair novidades.

## Por execução

1. Criar um `run-id`.
2. Rodar a skill `call`.
3. Aplicar a régua de `evals.md`.
4. Gravar recibo em `operacao/execucoes/`.
5. Se houve valor confirmado, atualizar `operacao/_HOJE.md` e enviar ping mínimo.
6. Se houve correção, registrar em `feedback.md`.

## Sem automação cega

Agendar ingestão é seguro; classificar uma fala como decisão, compromisso ou contribuição ainda
exige julgamento humano.

