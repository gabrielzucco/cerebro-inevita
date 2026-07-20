---
name: comecar
description: Conduz a primeira sessão do cérebro a partir de uma situação recorrente do trabalho, encontra a menor fonte real disponível e transforma um caso concreto em algo utilizável. Use quando a pessoa instala ou abre o cérebro pela primeira vez, pede para começar, traz a primeira tarefa ou ainda não teve uma entrega aprovada no próprio negócio.
---

> Ao iniciar, rode em silêncio SOMENTE: `node .agents/scripts/ping.mjs comecou`. Não concatene o
> ping com `cat`, `ls` ou arquivos opcionais. Falha de telemetria nunca interrompe a conversa.

Depois do ping, leia `sistemas/cerebro-base/manifest.md`, `pipeline.md` e `evals.md`. Crie um
`run-id` local no formato `AAAA-MM-DD-HHMM-cerebro-base` e inicie o relógio em silêncio:

```bash
node scripts/concierge-run.mjs start --run-id <run-id> --system cerebro-base
```

Falha do relógio não bloqueia a pessoa: preserve o erro no recibo da execução e continue.

# Começar — entender uma situação, usar uma fonte, entregar algo real

A pessoa não precisa aprender a administrar um cérebro. Ela precisa perceber que uma situação que
sempre dependia dela pode deixar contexto e melhorar na próxima execução.

Internamente, instalação é A0, início é A1 e artefato aprovado é A2. **Nunca exponha A0, A1, A2,
eval, telemetria, prova, sistema, skill ou arquitetura durante a primeira experiência.**

## Voz e continuidade

- Use sempre `você`, `seu` e `sua`. Nunca use `tu`, `teu` ou `tua`.
- Converse como alguém que está entendendo o trabalho junto, não aplicando um formulário.
- Faça uma pergunta por mensagem e explique naturalmente por que ela vem agora.
- Antes da próxima pergunta, reconheça em uma frase o que a pessoa acabou de dizer.
- Reutilize as palavras da pessoa. Não troque o vocabulário dela por termos do método.
- Pergunte por comportamentos observáveis: o que ela abre, lê, escuta, compara ou procura. Evite
  abstrações como “fonte”, “material”, “rastro”, “processo” e “resultado” na conversa.
- Não siga frases-modelo mecanicamente. Adapte a transição ao caso concreto.
- Não abra com menu, arquitetura, lista de fontes ou escolha de sistema.
- “Não sei” não trava: ofereça dois exemplos relacionados ao que já apareceu e peça o mais próximo.

## -1. Retomar antes de perguntar

1. Procure uma tarefa concreta na mensagem atual, no prompt de instalação ou em
   `operacao/decisoes-pendentes/onboarding.md`.
2. A instrução mais recente da pessoa sempre vence o handoff.
3. Se já existe uma fonte ou tarefa real do negócio, não mostre opções e não peça para repetir.
   Diga em uma frase o que entendeu e execute a rota adequada.
4. Se a tarefa é a pergunta padrão sobre “empresas do Vale” e respostas genéricas, trate-a como
   demonstração curta do acervo e, depois da resposta, siga para a descoberta do trabalho real.
5. Se não existe tarefa, comece pelo passo 1.

Continue no agente e na conversa atuais. Ler esta skill diretamente já basta. Nunca peça reinício,
troca de sessão, reabertura da pasta ou execução manual de `/comecar`.

## 0. Reconhecer o acesso sem interromper

Se `.cerebro/member-id` contém um UUID, siga sem pedir e-mail. Na ausência de identificação, não
transforme cadastro em pedágio da primeira entrega; ofereça vincular o acesso somente depois.

## 0.5 Descobrir sem invadir

Antes de perguntar onde o contexto está, faça uma descoberta limitada e somente leitura:

```bash
node scripts/discover-context.mjs --root . --root .. --max-depth 2 --json
```

- A descoberta olha apenas nomes de pastas e marcadores técnicos. Ela não abre documentos, notas,
  reuniões ou arquivos do negócio.
- `inevita-brain` é outra instalação do Cérebro. Se aparecer mais de uma, não escolha pela pessoa e
  não grave contexto: mostre os caminhos concretos e pergunte em qual ela quer continuar. Se a
  instrução mais recente já diz explicitamente “novo e limpo”, continue na instalação nova.
- Obsidian, repositório Git, pasta de reuniões e workspace de conhecimento são **fontes que podem
  continuar onde estão**. Nunca apresente essas fontes como se fossem outro Cérebro.
- Não despeje um inventário de pastas nem abra um menu técnico. Guarde os candidatos e use apenas o
  que ficar relevante depois de entender o trabalho da pessoa.
- Não leia o conteúdo de uma fonte externa antes da pessoa autorizar seu uso no caso atual.
- Se a pessoa demonstrar receio de cópia, mudança ou acesso, diga já na primeira resposta que a
  checagem olha somente nomes e marcadores técnicos, sem abrir conteúdo nem alterar nada.

## 1. Entender onde o trabalho ainda depende da pessoa

Quando não há uma tarefa real, contextualize antes de perguntar. Use este sentido, adaptando a voz:

> “Antes de organizar qualquer coisa, quero entender onde isso pode aliviar seu trabalho de
> verdade. Pensando na sua rotina, o que mais toma seu tempo ou sempre volta para suas mãos porque
> depende da sua decisão, aprovação ou jeito de fazer?”

Não pergunte apenas “o que você faz no dia a dia?”. Procure uma situação recorrente e sentida.

Depois da resposta:

1. Espelhe o caso: “Entendi. Então [situação nas palavras da pessoa] ainda depende de você para
   [consequência que ela descreveu].” Não invente consequência.
2. Só então descubra o que ela consulta quando faz aquele trabalho. A pergunta precisa nascer da
   situação. Exemplo para conteúdo: “Quando você vai revisar uma peça, o que costuma olhar para
   saber se ela ficou boa — briefing, exemplos antigos, conversas com o time ou só o que está na
   sua cabeça?” Não reutilize esse exemplo em outro contexto.
3. Dê alternativas concretas apenas para facilitar e relacionadas ao que ela contou. Não presuma
   que uma ferramenta ou documento existe.
4. Se a descoberta encontrou um candidato coerente com a resposta, cite-o em linguagem comum e
   peça autorização para olhar apenas o menor exemplo necessário. Exemplo: “Encontrei uma pasta de
   reuniões chamada `Calls`. É daí que costuma vir esse contexto? Se você quiser, posso começar por
   uma reunião recente sem copiar nem mover a pasta.” Não registre a fonte só porque foi encontrada.

## 2. Começar por uma amostra, não pela empresa inteira

Depois de localizar a fonte, peça o menor caso recente que represente o problema. Explique o passo:

> “Vamos começar por um caso recente, sem conectar tudo de uma vez. Me envie um exemplo disso e eu
> organizo o que importa, o que ainda depende de você e o que pode virar padrão.”

Aceite arquivo, texto colado, transcrição, mensagem, pasta local ou relato ditado. Se a fonte já
está acessível, use-a. Não peça Drive inteiro, histórico completo, OAuth ou integração antes da
primeira entrega. Nunca finja que um conector existe.

Se a pessoa aprovar uma pasta externa como fonte recorrente, registre somente a referência local:

```bash
node scripts/register-source.mjs --path "<caminho absoluto>" --type <tipo> \
  --label "<nome reconhecível>" --scope "<para qual trabalho será usada>" --confirm
```

Explique somente se necessário: o registro é privado, somente leitura e de atualização manual. Ele
não copia, move ou altera a fonte e não é uma conexão automática. A primeira entrega usa uma
amostra; sincronização, indexação contínua ou conector são etapas futuras e só podem ser oferecidas
quando realmente existirem.

Quando a menor fonte estiver autorizada, acessível e legível, marque T1 em silêncio:

```bash
node scripts/concierge-run.mjs mark --run-id <run-id> --milestone T1
```

## 3. Transformar a fonte em algo utilizável

- **Call ou reunião:** use `operar` com `calls-decisoes`.
- **Outra fonte real:** use `guardar`, produza um artefato adequado ao caso e registre a execução
  como `fonte-em-artefato`.
- **Relato sem arquivo:** preserve as palavras da pessoa como fonte primária antes de estruturar.
- **Acervo:** entregue uma demonstração curta e imediatamente volte ao passo 1.

O formato do artefato nasce da situação: decisão, mensagem, briefing, processo, análise, copy,
ações com responsável ou regra reutilizável. Não force toda entrada a virar resumo.

Imediatamente antes de mostrar o primeiro artefato, marque T2 em silêncio:

```bash
node scripts/concierge-run.mjs mark --run-id <run-id> --milestone T2
```

### Formato da demonstração do acervo

- No máximo três conclusões, em português e ligadas a uma implicação prática.
- Traduza a ideia principal; não abra com blocos em inglês.
- Coloque as referências no final como `Nome humano da palestra — minuto 11:53`.
- Nunca mostre caminho de arquivo, `[01:48]` solto ou mais de duas fontes por conclusão.
- Rode em silêncio `node .agents/scripts/ping.mjs proof_delivered`.
- Não diga que “isso não é A2”, não faça “notas de honestidade” e não mencione o ping.
- Termine a demonstração com uma transição natural para o passo 1, não com uma pesquisa de valor.

## 4. Ajustar até ficar pronto para uso

Depois do artefato, pergunte de forma natural:

> “Você usaria isso do jeito que está ou mudaria alguma coisa antes?”

- Se mudaria, pergunte apenas o que ficou fora do jeito ou da realidade dela, aplique a correção e
  mostre novamente.
- Se usaria, grave o recibo local, atualize `operacao/_HOJE.md` e rode em silêncio
  `node .agents/scripts/ping.mjs first_value_confirmed <system_id>`.
- Depois que o contexto aprovado estiver salvo, marque T3 em silêncio:
  `node scripts/concierge-run.mjs mark --run-id <run-id> --milestone T3`.
- Se houve handoff, marque-o como `concluido` somente depois da entrega.

Não diga “isso ajuda você a decidir ou agir?”, não explique a régua e não transforme aprovação em
pesquisa de satisfação.

## 5. Fazer o contexto trabalhar uma segunda vez

Depois da aprovação, explique em linguagem comum e somente se o salvamento aconteceu:

> “Perfeito. Vou guardar o que funcionou aqui para a próxima vez não começar do zero.”

Não encerre a primeira experiência no salvamento. Leia `sistemas/cerebro-base/pipeline.md` e use
somente as decisões, ações, pendências ou átomos aprovados para produzir uma segunda saída pequena.
Escolha a que exige menos informação adicional: pauta da próxima reunião, mensagem de follow-up ou
briefing de execução. **Não releia a fonte bruta.** Se precisar reabrir o bruto, deixe a falha
visível e não marque T4.

Mostre a segunda saída e pergunte de forma natural:

> “Isso aproveitou o que acabamos de organizar ou você precisou explicar tudo de novo?”

Depois da confirmação de reutilização, marque T4 em silêncio:

```bash
node scripts/concierge-run.mjs mark --run-id <run-id> --milestone T4
```

Consulte o recibo com `node scripts/concierge-run.mjs status --run-id <run-id> --json` e leve apenas
tempos e categorias de intervenção para o recibo operacional. Nunca copie conteúdo para o relógio.

## 6. Mostrar o que começa a melhorar

Se esse tipo de material nasce sempre na mesma fonte, ofereça torná-la recorrente apenas agora. Se
há conector real, explique escopo e consentimento. Se não há, proponha a menor rotina manual sem
prometer automação.

Só mostre pastas, método, privacidade técnica ou arquitetura quando a pessoa perguntar.

## 7. Contribuição vem depois e com consentimento

Se a execução revelar um padrão útil para outros operadores, pergunte em linguagem comum se a
pessoa quer preparar uma versão sem dados do negócio para revisar. Preparar, aprovar e enviar são
estados diferentes; nada é compartilhado automaticamente.
