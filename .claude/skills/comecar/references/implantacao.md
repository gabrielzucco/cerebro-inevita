# Implantação: aproveitar o contexto e preparar as fontes

Leia esta referência quando houver acervo artesanal, fonte recorrente ou necessidade de ligar uma
fonte a um Sistema. O acompanhamento pertence a `comecar`; não cria outra skill, Sistema ou estado
de implantação. Use a casa, o layout e os recibos já existentes.

## Acervo existente

Faça primeiro o diagnóstico delimitado de `auditar-cerebro`. A pessoa pode manter o acervo como
fonte no caminho original ou escolher a migração para uma instalação separada. `migrar-cerebro`
classifica e apresenta o mapa concreto antes da cópia, preservando origem, personalizações e
proveniência. Autorização genérica não aprova destinos ou arquivos ainda não apresentados.

Se a implantação for interrompida, use `operacao/decisoes-pendentes/onboarding.md` somente quando a
escrita estiver autorizada e a retomada precisar disso. Referencie decisões, contratos e recibos
existentes, sem duplicá-los. Migração de conteúdo, atualização do motor e `migrate-platform.mjs`
são trabalhos distintos: o último ajusta roteamento de serviços; não migra o contexto da empresa.

## Uma fonte, evidências separadas

| Item | O que permite afirmar |
|---|---|
| Registro | Sabemos onde a fonte mora, sua finalidade e quem pode autorizá-la. |
| Source Contract | Sua fronteira, uso, sensibilidade, retenção e consumidores estão declarados. |
| Grant e vínculo ao Sistema | Existe autorização para um sujeito, fonte, ação e papel determinados. |
| Conector configurado | Há um meio concreto de acesso; configuração não prova que funciona agora. |
| Leitura observada | Uma amostra autorizada ficou acessível naquele momento. |
| Frescor | A evidência permite dizer até quando o conteúdo representa a operação. |

Registre somente o que foi confirmado; lacunas permanecem visíveis. Fonte local lida pelo agente
usa garantia `receipt-audited`, não `runtime-enforced`. Credenciais ficam no provedor próprio,
nunca no registro, no contrato ou na conversa. `credential_ref` é uma referência, não o segredo.

Para a primeira entrega, uma amostra autorizada basta. Uma fonte ainda não necessária continua
como ponteiro. Não transforme a criação de todos os contratos em um formulário que bloqueia valor.

## Registro e contrato

Para uma fonte externa local já autorizada, o helper disponível é:

```sh
node scripts/register-source.mjs --path "/caminho/autorizado" --type local-folder --label "Fonte operacional" --scope "Finalidade aprovada" --confirm
```

Ele grava `conexoes/configuradas/fontes.json` e não copia ou sincroniza o conteúdo. Não invente
um caminho local para CRM ou Drive: registre a referência real e o acesso conhecido. Sem shell,
o agente pode preparar os arquivos aprovados diretamente pelos schemas do produto.

Leia `protocol/source-contract.schema.json` e o caminho `sourceContracts` de
`.cerebro/layout.json`. Para converter um registro simples existente, use a prévia:

```sh
node scripts/source-contract.mjs migrate-registry --output=.cerebro/contracts/sources
```

Se o layout definir outro caminho permitido, substitua `--output`. Revise todos os itens propostos;
o comando converte o registro inteiro, não aceita seleção por fonte. Só acrescente `--confirm`
quando o conjunto estiver aprovado e sem conflitos. Para apenas uma fonte, prepare seu contrato
diretamente no caminho do layout e aprove o conteúdo antes de gravar. Não sobrescreva um contrato
existente divergente nem remova o registro para forçar a migração.

A conversão gera um ponto de partida: dono pode estar não confirmado, retenção não declarada,
consumidores vazios e conexão ausente. Complete somente com decisões reais, mantendo o `source_id`.
`updatedAt` do registro não prova frescor do conteúdo: confira a observação real antes de adotar
`freshness.observed_at`; use `null` quando não houver evidência. Um estado `active` migrado tampouco
prova conexão ou acesso atual. Confira autoridade, finalidade, escopo, PII, modos, retenção,
revogação, consumidores e garantia. Valide o arquivo resultante:

```sh
node scripts/source-contract.mjs validate .cerebro/contracts/sources/ID_DA_FONTE.json
```

Esses helpers aproveitam runtime existente; não instale dependências para completar o cadastro.
Se um teste de acesso for necessário e autorizado, leia a menor amostra pelo meio real disponível,
registre o resultado e seu momento no recibo da tarefa. Falha de acesso deixa uma lacuna e um
próximo passo, não uma declaração de fonte conectada.

## Ligação com o trabalho

Para um Sistema já instalado, leia seu contrato e planeje os papéis de fontes:

```sh
node scripts/system-source-binding.mjs plan ID_DO_SISTEMA
```

O plano compara requisitos mecânicos. O agente precisa verificar se a fonte sustenta aquele papel
e se a autorização cobre o uso. Preserve o Source Contract canônico; não altere a fonte para fazê-la
caber no Sistema. Antes de gravar um binding, leia `protocol/system-source-binding.schema.json` e,
quando houver grant, `protocol/access-grant.schema.json`. Reutilize grants vigentes dentro do escopo;
um grant ainda não concedido não pode ser inventado a partir do contrato.

Um binding `ready` exige grant existente e compatível, aprovação humana registrada, fonte ativa e
referências válidas. Até lá, use o estado compatível com a evidência, sem anunciar execução pronta.
Salve o rascunho autorizado em caminho privado relativo e faça a prévia:

```sh
node scripts/system-source-binding.mjs bind operacao/arquitetura/ID_DO_BINDING.binding.json
```

A prévia sem `--confirm` termina com código 2 por desenho; não representa instalação. Depois da
aprovação, repita com `--confirm`. Se já houver binding, compare o diff antes de usar `--replace`.
O binding não instala conector, não testa a fonte e não agenda nada. Primeiro execute o trabalho
autorizado e registre output, avaliação e decisão humana. Rotinas recorrentes vêm da necessidade
provada no uso, com autorização própria.
