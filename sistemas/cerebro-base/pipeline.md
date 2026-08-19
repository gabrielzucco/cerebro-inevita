# Pipeline — Cérebro Base

| Estado | Entrada | Saída | Gate |
|---|---|---|---|
| orientado | declaração + nomes/topologia | Mapa da empresa V0 + fontes registradas | registrar não abre nem conecta fonte |
| retomado | resultado conhecido ou rastro recente | semente de ativação entendida | não repetir pergunta já respondida |
| autorizado | menor fonte real | fonte acessível | pessoa autorizou leitura no caso atual |
| transformado | fonte | artefato útil proposto | evidência vem da fonte; sistema adequado foi usado |
| aprovado | artefato | correção ou confirmação humana | pessoa diz que usaria do jeito apresentado |
| salvo | aprovados | contexto e recibo locais | nenhuma escrita derivada antes do ok |
| reutilizado | mapa + Activation Brief + CONFIGURAÇÃO | segunda saída | bruto não foi relido nem a empresa reexplicada |
| encerrado | segunda saída | T0–T4 + aprendizado | falha e intervenção continuam visíveis |

## Rotas da ativação

- **Resultado primeiro:** a pessoa já sabe a entrega; aproximar a menor fonte capaz de sustentá-la.
- **Fonte primeiro:** a pessoa traz um rastro recente; observar o caso e propor um uso imediato.

As duas rotas convergem em `fonte autorizada → output aprovado → contexto salvo → reutilização`.
Não trocar a semente, o tipo de output ou a versão entre o primeiro e o segundo uso.

## Segunda utilização determinística

Depois de T3, escolher **uma** saída coerente com o mesmo trabalho e usar somente o mapa, o
Activation Brief, a CONFIGURAÇÃO, as decisões e os átomos salvos:

1. próxima decisão ou pergunta que o contexto já permite responder;
2. mensagem ou briefing derivado do primeiro uso; ou
3. adaptação do output para o próximo responsável/momento.

Escolher a opção que exige menos contexto adicional. Mostrar de quais arquivos salvos a saída foi
derivada, sem expor caminhos técnicos se isso não ajudar a pessoa. Se for necessário reabrir a
fonte bruta, T4 falhou: registrar o motivo em vez de simular reutilização.

## Regra do concierge

O humano pode resolver acesso, permissão, transcrição e ambiguidade factual. Não pode escrever o
artefato pelo agente, salvar fora do pipeline, inventar contexto, esconder erro ou alterar a versão
durante um lote. Intervenção fora do contrato é falha observada do produto.
