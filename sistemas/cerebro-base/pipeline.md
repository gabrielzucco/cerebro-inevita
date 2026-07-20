# Pipeline — Cérebro Base

| Estado | Entrada | Saída | Gate |
|---|---|---|---|
| retomado | pedido atual ou handoff | situação concreta entendida | não repetir pergunta já respondida |
| autorizado | menor fonte real | fonte acessível | pessoa autorizou leitura no caso atual |
| transformado | fonte | artefato útil proposto | evidência vem da fonte; sistema adequado foi usado |
| aprovado | artefato | correção ou confirmação humana | pessoa diz que usaria do jeito apresentado |
| salvo | aprovados | contexto e recibo locais | nenhuma escrita derivada antes do ok |
| reutilizado | contexto salvo | segunda saída | bruto não foi relido nem a situação reexplicada |
| encerrado | segunda saída | T0–T4 + aprendizado | falha e intervenção continuam visíveis |

## Rota do primeiro lote

Usar uma call recente com decisão real e delegar a transformação para `calls-decisoes`. Não trocar
fonte, job, pipeline ou versão entre as três primeiras ativações.

## Segunda utilização determinística

Depois de T3, escolher **uma** saída coerente com a call e usar somente decisões, ações, pendências
e átomos salvos:

1. pauta da próxima reunião;
2. mensagem de follow-up; ou
3. briefing de execução para o responsável.

Escolher a opção que exige menos contexto adicional. Mostrar de quais arquivos salvos a saída foi
derivada, sem expor caminhos técnicos se isso não ajudar a pessoa. Se for necessário reabrir a
transcrição bruta, T4 falhou: registrar o motivo em vez de simular reutilização.

## Regra do concierge

O humano pode resolver acesso, permissão, transcrição e ambiguidade factual. Não pode escrever o
artefato pelo agente, salvar fora do pipeline, inventar contexto, esconder erro ou alterar a versão
durante um lote. Intervenção fora do contrato é falha observada do produto.
