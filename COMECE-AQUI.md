# Comece aqui

Este é o **cérebro operacional do seu negócio**. Ele cruza seu contexto com referências de campo e,
principalmente, transforma fonte real em resultado por sistemas que deixam rastro e melhoram.

## Se uma IA já está lendo esta pasta

Não troque de ferramenta nem de sessão. O agente que instalou ou encontrou esta pasta deve ler este
arquivo e a skill `comecar` diretamente, e conduzir a primeira entrega na conversa atual. O comando
de slash é um atalho, não um requisito.

| Ambiente | Skills | Entrada |
|---|---|---|
| Claude Code | `.claude/skills/` | `/comecar` |
| Codex | `.agents/skills/` | `$comecar` ou “quero começar” |
| Gemini CLI | `.agents/skills/` | “quero começar” |
| Antigravity | `.agents/skills/` | “quero começar meu cérebro” |
| Hermes | `.agents/skills/` | “quero começar” no CLI ou Telegram |
| outro agente local | `.agents/skills/` | ler `comecar/SKILL.md` |

### O acesso é vinculado (e-mail ou credencial)

O Cérebro é entregue ligado a um acesso por e-mail. Quem instala pela instrução da plataforma já
chega vinculado (credencial em `.cerebro/`). Quem clonou esta pasta direto, sem instrução, informa
o e-mail do acesso quando a skill `comecar` oferecer isso, somente depois do primeiro output útil.
Recusar não bloqueia a ativação: o agente registra a preferência e segue. Ainda sem acesso?
Cadastre-se em https://lp.inevitasociety.com/cerebro. Seu conteúdo continua local; o vínculo só liga
a instalação à pessoa.

O agente precisa abrir esta pasta, ler e editar arquivos. Scripts validam o protocolo quando o
ambiente permite, mas não são requisito para a primeira ativação. Se ele só recebe arquivos como
base de conhecimento e não consegue gravar, consulta o acervo, mas não mantém o cérebro acumulando
contexto.

Se a instalação começou fora desta pasta, o agente pode usar o caminho absoluto como diretório de
trabalho. Só peça para abrir uma nova sessão quando o ambiente realmente não conseguir ler, escrever
ou executar aqui. Antes disso, grave a primeira tarefa e o estágio em
`operacao/decisoes-pendentes/onboarding.md`; a sessão seguinte retoma sem repetir perguntas.

### Instalar, reinstalar ou continuar

Ao encontrar um Cérebro existente, o agente oferece **três caminhos**, mesmo que só exista um:

1. **Usar o existente:** você escolhe a pasta e pode pedir `auditar-cerebro` antes de continuar.
2. **Instalar novo em pasta nova:** você escolhe outro destino; a instalação anterior fica intacta.
3. **Migrar:** `migrar-cerebro` faz primeiro um plano de classificação e fontes; só copia depois
   da sua aprovação, com proveniência, sem mover a origem ou alterar o motor.

O agente nunca decide sozinho qual é o “real” ou “de teste”. Pedido de novo/limpo não autoriza
reaproveitar ou limpar a pasta encontrada. Nenhuma escolha conecta automaticamente CRM, banco ou
Drive. Essas fontes podem ser consideradas mesmo sem arquivos locais.

### Versão fixa para instalar e atualizar

Escolha uma tag publicada, como `v1.37.0`, em Releases. **Esta versão está preparada localmente;
o exemplo só ficará disponível após a publicação aprovada.** Não use `main` ou `latest` como
fonte de instalação. O `VERSION` de um checkout não prova que a release está publicada.

Para obter o pacote e o atualizador seguro, clone a tag escolhida em uma **pasta nova**:

```bash
git clone --branch v1.37.0 --single-branch --depth 1 https://github.com/gabrielzucco/cerebro-inevita pacote-1.37.0
```

A pasta clonada já pode ser usada como Cérebro após a sua escolha explícita. Se preferir uma
instalação gerenciada em outra pasta, o instalador copia apenas motor e seeds do pacote:

```bash
node pacote-1.37.0/scripts/install.mjs --tag v1.37.0 --destination /caminho/novo-cerebro
node pacote-1.37.0/scripts/install.mjs --tag v1.37.0 --destination /caminho/novo-cerebro --apply
```

O primeiro comando mostra a prévia. Execute o segundo apenas depois de aprová-la. Destino
existente devolve as três opções e não escreve. A versão do pacote precisa coincidir com a tag.
Node.js 20+ é necessário para esses scripts; sem runtime, o agente pode orientar o plano.

**Primeira atualização de uma instalação antiga:** use o script seguro da tag nova em separado.
O script antigo pode apagar personalizações antes de receber a correção; não o execute.

```bash
node pacote-1.37.0/scripts/update.mjs --tag v1.37.0 --root /caminho/cerebro-existente
```

A prévia lista conflitos e seu `plan_hash`. Após revisar e aprovar esse plano, repita o comando
com `--apply --approve-plan HASH_DA_PREVIA`. Se qualquer conteúdo mudar, revise uma nova prévia.
O updater não consulta latest novamente e não recorre a main se o download da tag falhar.
Arquivos fora do pacote permanecem, inclusive skills próprias. Texto fora do bloco
`INEVITA:MANAGED` no `CLAUDE.md` é preservado; um arquivo legado sem bloco fica inteiro antes
do bloco novo. Revise eventuais regras duplicadas sem descartá-las automaticamente.

Backups ficam em `.cerebro/update-backups/`, privados e fora do Git. Arquivos retirados do pacote
não são removidos automaticamente. A migração privada de runtime, se necessária, aparece como
próximo passo separado; não roda nem envia telemetria durante a atualização. O Console só aplica
atualizações sem conflitos; para revisar personalizações use `atualizar` e a prévia acima.

### Cérebro existente não é a mesma coisa que contexto existente

Uma instalação do Cérebro INEVITA tem `COMECE-AQUI.md`, `VERSION` e `.cerebro/`. É nela que o motor,
os sistemas e o contexto acumulado trabalham juntos. Se houver mais de uma instalação, você escolhe
qual quer abrir ou pode pedir uma nova e limpa.

Obsidian, repositório de código, pasta de reuniões, documentos e outros espaços de trabalho são
fontes do seu negócio — não são “outro Cérebro”. Eles não precisam ser migrados para funcionar. O
agente pode fazer uma descoberta limitada olhando apenas nomes de pastas e marcadores técnicos,
mostrar o que parece relevante e pedir sua autorização antes de abrir qualquer conteúdo.

Quando você aprova uma fonte local recorrente, o Cérebro guarda apenas uma referência privada ao
caminho original. A fonte continua onde está, como fonte de verdade: sem cópia, mudança ou sync automático.
A primeira experiência começa por uma amostra pequena; conexão contínua só existe quando houver um
conector real e consentimento específico.

## Não usa nenhum agente pago?

Comece pelo Google Antigravity ou Gemini CLI. Claude Code e Codex também funcionam. O cérebro não
exige uma assinatura específica e o Cérebro Base opera com arquivos locais.

## Quer ver e conectar pelo Telegram?

Abra o Cockpit local com `node scripts/cockpit.mjs`. É o mesmo núcleo visual do Console usado na
operação da INEVITA, adaptado para funcionar inteiramente na sua máquina. **Hoje** mostra o que
precisa de você. Em **Meus trabalhos**, escolha o resultado que quer produzir. Em **Entregas**, leia
o rascunho, veja quais informações foram usadas e aprove ou peça ajuste. Os registros técnicos
ficam em **Ver como foi feito**, dentro de cada resultado. A tela também leva o cérebro ao Telegram
em três passos: preparar o agente, conectar o bot criado no BotFather e confirmar a conta que enviou
`/start`. O Cockpit cuida da configuração e do diagnóstico. O guia completo está em
[`COCKPIT.md`](COCKPIT.md).

## A primeira experiência

No cockpit opcional, esta etapa aparece como **Primeira Missão**. É um estado transitório: antes
de T4 orienta o próximo passo; depois de T4 desaparece da navegação e deixa seu recibo em
`Cérebro`. `Cérebro Base` é a infraestrutura nativa de contexto, não um Sistema de negócio.
A novidade mais recente pode aparecer ali em um cartão compacto; a comunicação completa e o
histórico de releases vivem permanentemente em `Cérebro → Atualizações`.

O cérebro começa entendendo uma situação recorrente do seu trabalho: o que ocupa tempo, volta para
suas mãos ou ainda depende da sua decisão. Depois localiza onde esse trabalho deixa rastros e pede
somente um caso recente — uma reunião, conversa, mensagem, documento ou outro material real.

Se você já sabe o resultado, ele começa por ele. Se não sabe, começa por um rastro recente do
trabalho real, reconstrói a operação e propõe até três resultados. Nenhuma das rotas começa
conectando tudo.

`orientar → registrar sem conectar → menor fonte real → usar → ajustar → reutilizar`

Uma reunião pode virar decisões e ações; um briefing, uma mensagem ou uma proposta pedem outro
tipo de entrega. O cérebro escolhe o formato pelo trabalho, não força todo material a virar resumo.
Ao final, o resultado fica legível para você e também deixa o contrato de ativação do Cérebro Base
e Run Records para que Sistemas futuros reutilizem entidades, fontes e aprendizados sem copiar o
dado canônico.

O acordo é explícito: a Fonte continua como casa da verdade; o Cérebro prepara, destila e recupera
o recorte necessário; o Sistema pede contexto por papel e produz seu resultado. Leitura direta da
Fonte só acontece quando dado fresco ou estruturado exige isso e o contrato, a permissão e o Run
Record deixam a exceção visível.

Depois que o contexto aprovado volta numa segunda tarefa, o Cérebro pode abrir o `/arquiteto`: ele
mapeia como uma operação funciona, mostra o que é só declarado e o que já tem evidência, e propõe o
primeiro sistema para o responsável confirmar. Diagnóstico não finge implantação nem validação.

Com o resultado confirmado, `/sistematizar` observa uma execução recente, separa declarado de
observado e instala a versão manual em `sistemas/outros-instalados/`. As fontes ficam registradas
por papel e casa de verdade; isso ainda não as conecta. O Sistema nasce `configuring`, roda o
primeiro caso com `/operar` e só depois pode merecer conexão, rotina por evento ou automação.

O acervo do AI Engineer World's Fair continua disponível com fonte e minuto do vídeo, mas funciona
como referência para melhorar uma decisão. Ele não substitui o contexto do seu negócio.

## O mapa

- `meu-negocio/` — seu contexto privado.
- `sistemas/` — resultados instalados e suas réguas.
- `skills/` — julgamentos reutilizáveis do motor.
- `protocol/` — o contrato comum de Capabilities, Sistemas e Runs.
- `conexoes/` — arquivos e integrações opcionais.
- `operacao/` — seu brief vivo, o que rodou, falhou, escalou e os caminhos aprovados que podem ser reutilizados.
- `operacao/arquitetura/` — specs privadas e mapas visuais produzidos pelo `/arquiteto`.
- `comunidade/inevita/` — o que recebemos da INEVITA.
- `comunidade/minhas-contribuicoes/` — o que você pode decidir compartilhar.
- `conhecimento/` — referências externas; `capturas/` — bruto; `privado/` — PII local.

## Quando quiser construir além da primeira vitória

- **Onde aplicar primeiro:** rode `/arquiteto` para mapear uma operação e propor o primeiro Sistema.
- **Como transformar trabalho real em Sistema:** rode `/sistematizar`; ele usa
  [`METODO-SISTEMAS.md`](METODO-SISTEMAS.md) e gera o contrato local sem conectar tudo.
- **Como operar o primeiro caso:** rode `/operar <system-id>` e confirme valor somente quando o
  responsável disser que usaria ou usou o output.
- **Como testar uma mudança sem enganar a leitura:** leia
  [`METODO-EXPERIMENTOS.md`](METODO-EXPERIMENTOS.md) e use
  [`templates/experimento.md`](templates/experimento.md).

O material aberto entrega arquitetura e templates. Os System Packs, laboratórios, casos e releases
validados pela rede entram pela Society.

## Privacidade, ping e comunidade

Seu contexto fica local. Para medir ativação, o cérebro envia telemetria técnica opcional: evento,
`install_id`, versão, sistema operacional, runtime e, quando configurados, e-mail de acesso ou
`member_id`. Runs de Sistemas também podem levar IDs opacos, versão, resultado do eval e decisão
humana categórica. Nunca envia fonte, output, erro ou texto. Desligar: crie
`.cerebro/sem-telemetria` ou use `CEREBRO_TELEMETRY=off`.

Quando encontra um padrão útil, o cérebro pode perguntar se você quer **preparar** uma contribuição
anonimizada. Ele mostra o payload exato. Aprovar não envia; enviar pede outro “sim”. A rede e o
marketplace ainda estão em construção — o cérebro não simula um envio que não existe.
