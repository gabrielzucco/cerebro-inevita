---
name: comecar
description: Ativa o Cérebro Base na pasta local: orienta o Mapa da empresa, registra fontes sem conectá-las, usa uma fonte real e prova reutilização do contexto aprovado. Use na primeira abertura ou quando T4 ainda não foi confirmado.
---

# Começar — configurar o cérebro com realidade, não com formulário

A pasta local é o cérebro. Manus, Codex, Claude, Gemini ou qualquer outra IA baseada em arquivos é
apenas o operador atual. A primeira sessão deve deixar contexto durável na pasta e um resultado que
a pessoa possa usar — não apenas respostas numa conversa.

Leia `.cerebro/layout.json`, `sistemas/cerebro-base/manifest.md`, `pipeline.md` e `evals.md`. No
layout, prefira `activationBrief`, `configuration` e `activationContract`; aceite os aliases legados
`firstSystemBrief`, `contextPack` e `systemContract`. Em seguida, leia e execute
`company-brain-sprint` na conversa atual. Não peça reinício, troca de sessão ou instalação de
runtime.

## Experiência de abertura

- Use sempre `você`, `seu` e `sua` e reutilize o vocabulário da pessoa.
- Faça uma pergunta por mensagem. Se a resposta já está no pedido ou nos arquivos autorizados, não
  pergunte de novo.
- Não abra com e-mail, menu, arquitetura, lista de ferramentas ou “o que você faz?”. O
  vínculo de acesso é oferecido somente depois do primeiro output útil e nunca bloqueia a ativação.
- Não exponha run-id, relógio, telemetria, A0/A1/A2, T0–T4 ou nomes internos do método.
- Não procure Node, rode `which node`, altere PATH ou instale dependências para helpers opcionais.
- Telemetria nunca é pedágio. Só rode helpers silenciosos depois do primeiro output útil e ignore
  qualquer falha sem interromper a pessoa.

## 1. Confirmar a casa e recuperar a operação

Confirme em uma frase que o trabalho será gravado na pasta local atual e que as fontes não serão
movidas nem alteradas sem autorização. Procure uma operação concreta na mensagem atual,
`operacao/decisoes-pendentes/onboarding.md` ou nos arquivos que a pessoa já autorizou.

Se a operação já está clara, espelhe o que entendeu e prossiga. Se não está, pergunte apenas:

> Qual trabalho real este cérebro deve compreender primeiro — você já sabe a entrega que quer
> melhorar ou prefere me mostrar um rastro recente que voltou para sua mão?

Isso escolhe a semente de ativação; ainda não instala o primeiro Sistema de negócio. Se a pessoa já
sabe a entrega, siga `resultado → fonte mínima`. Se não sabe, siga `rastro → observação → resultado`:
peça um único caso recente que tomou tempo, voltou para correção ou dependeu do julgamento dela.
Nunca responda à incerteza pedindo para conectar todas as fontes.

## 2. Descobrir sem invadir

Quando scripts estiverem naturalmente disponíveis, `discover-context.mjs` pode olhar somente nomes
de pastas e marcadores técnicos. Nunca abra documentos externos antes da autorização. Se houver
mais de uma instalação, mostre os caminhos e deixe a pessoa escolher. Cérebro existente não é a
mesma coisa que contexto existente.

Antes de abrir conteúdo, faça uma orientação ampla e rasa: registre o que a pessoa declara sobre o
negócio, as fontes que ela sabe que existem, onde moram, para que poderiam servir, quem autoriza e o
que continua desconhecido. Isso é **Mapa da empresa V0 + topologia de fontes**, não prova nem
conexão. **Registrar fonte ≠ conectar fonte.** Uma fonte pode ficar apenas registrada como ponteiro.

Depois peça ou localize a menor amostra real sobre o recorte: duas a quatro fontes pequenas e, quando
possível, de papéis diferentes — verdade do negócio, rastro do trabalho, voz do cliente, sinal de
resultado ou rastro de julgamento. Upload, texto, transcrição, pasta local autorizada e relato
ditado são válidos. Uma fonte permite observação parcial; não permite chamar o mapa de completo.

Se a pessoa autorizar uma pasta externa recorrente, registre apenas a referência local com
`register-source.mjs`. Explique que isso é leitura manual autorizada, sem cópia, mudança ou sync
automático; não é uma conexão automática.

## 3. Não interromper o trabalho por acesso

Neste ponto ainda não existe output. Não peça e-mail, não rode helper e não transforme acesso em
pré-requisito. Somente depois do output útil, aplique a regra opcional do passo 5. O produto e a
ativação funcionam mesmo se a pessoa não vincular a instalação.

## 4. Ativar o Cérebro Base

Execute `company-brain-sprint` para:

1. persistir o Mapa da empresa amplo e raso com estado V0 e lacunas explícitas;
2. classificar o que cada evidência autorizada sustenta e não sustenta;
3. observar profundamente uma única passagem de trabalho;
4. receber a correção do dono antes de persistir o recorte como verdade verificada;
5. definir o Activation Brief do Cérebro Base — o uso atual, não um Sistema de negócio;
6. compilar uma **CONFIGURAÇÃO** estreita e pronta para aquela tarefa;
7. produzir um output real, ajustar uma vez e registrar o primeiro uso;
8. salvar os seis artefatos nos caminhos canônicos ou aliases de `.cerebro/layout.json`.

Além dos seis artefatos humanos, salve o Activation Contract do `cerebro-base` no formato de System
Contract e o primeiro Run Record definidos no layout. Eles são o envelope comum que permite
costurar entidades, fontes, outputs e correções entre Sistemas futuros sem padronizar o conteúdo
privado.

O bruto é usado para prova, citação, contradição e reprocessamento. A CONFIGURAÇÃO recebe apenas o
recorte necessário à tarefa. Não conecte tudo; não despeje o bruto no prompt; não automatize a
rotina antes de provar o run manual.

## 5. Confirmar valor e reutilizar

Depois do primeiro output, pergunte naturalmente:

> Você usaria isso do jeito que está ou mudaria alguma coisa antes?

Agora, e só agora, confira `.cerebro/install-credential`, `.cerebro/acesso-email` e
`.cerebro/acesso-dispensado`. Se a instalação já estiver vinculada ou a pessoa já tiver recusado,
não pergunte nada. Se nenhum existir, ofereça uma única vez:

> Uma coisa rápida: qual e-mail você usou para pegar o acesso ao Cérebro? É o que faz esta
> instalação aparecer como sua na plataforma.

Se responder, grave apenas o e-mail em `.cerebro/acesso-email`, uma linha e modo 0600. Se não
quiser, grave `.cerebro/acesso-dispensado`, nunca mais pergunte e continue. O e-mail fica fora das
notas e do Git; telemetria continua opcional e nunca carrega conteúdo.

Grave a correção nas palavras da pessoa. Quando aprovado, atualize `operacao/_HOJE.md` e o recibo.
Na próxima tarefa, leia primeiro o mapa, o Activation Brief e a CONFIGURAÇÃO persistidos. Não releia
a fonte bruta se o contexto aprovado for suficiente. Pergunte:

> Isso aproveitou o que já estava no cérebro ou você precisou explicar tudo de novo?

Se a resposta confirmar reutilização sem reexplicação, marque T4: o Cérebro Base está ativado. Só
então ofereça `/arquiteto` para escolher o primeiro Sistema de negócio. Uma correção vira
aprendizado candidato; só repetição e resultado medido tornam a regra validada. Três casos
comparáveis ainda exigem replay, aprovação humana, nova versão e rollback antes de alterar o motor.

## 6. Conectar só quando fizer sentido

No primeiro Sistema de negócio, crie rotina quando a mesma entrada e o mesmo output voltarem a
acontecer. Conecte fonte recorrente quando o run manual provar que ela é necessária e houver
permissão de leitura. Conecte ferramenta de escrita/ação apenas depois do human gate e da avaliação
estarem definidos. V3 só existe depois de uma execução comparável devolver resultado observado
contra a medida pré-declarada; T4 não implica V3.

## Compatibilidade — valor antes do runtime

No Antigravity ou em qualquer agente sem shell, faça tudo com leitura e escrita de arquivos. Fora
dele, scripts auxiliares só podem rodar depois da primeira resposta útil; caso contrário, pule. O
produto funciona pelos arquivos e pelo contrato; helpers não podem transformar ativação em setup.
