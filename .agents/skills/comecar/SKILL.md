---
name: comecar
description: Conduz a implantação e a ativação do Cérebro Base, aproveitando contexto existente, formalizando as fontes necessárias e provando seu uso e reuso. Use para começar, retomar a implantação ou aproveitar um Cérebro artesanal.
---

# Começar — configurar o cérebro com realidade, não com formulário

A pasta local é o cérebro. Manus, Codex, Claude, Gemini ou qualquer outra IA baseada em arquivos é
apenas o operador atual. A primeira sessão deve deixar contexto durável na pasta e um resultado que
a pessoa possa usar — não apenas respostas numa conversa.

Primeiro confirme a casa e recupere o trabalho pelo passo 1. Depois, na instalação escolhida,
leia `.cerebro/layout.json`, `sistemas/cerebro-base/manifest.md`, `pipeline.md` e `evals.md`. No
layout, prefira `activationBrief`, `configuration` e `activationContract`; aceite os aliases legados
`firstSystemBrief`, `contextPack` e `systemContract`. Execute `company-brain-sprint` uma vez, no
passo 4, reaproveitando o que já foi apurado. Continue na conversa atual quando o agente conseguir
ler e escrever na pasta; não peça reinício nem troca de ferramenta por conveniência.

## Experiência de abertura

- Use sempre `você`, `seu` e `sua` e reutilize o vocabulário da pessoa.
- Faça uma pergunta por mensagem. Se a resposta já está no pedido ou nos arquivos autorizados, não
  pergunte de novo.
- Reutilize escolhas e autorizações explícitas da sessão dentro do escopo aprovado. Mostre a prévia
  concreta de uma mutação quando ainda faltar, sem repetir decisões já tomadas.
- Não abra com e-mail, menu, arquitetura, lista de ferramentas ou “o que você faz?”. O
  vínculo de acesso é oferecido somente depois do primeiro output útil e nunca bloqueia a ativação.
- Não exponha run-id, relógio, telemetria, A0/A1/A2, T0–T4 ou nomes internos do método.
- Não procure Node, rode `which node`, altere PATH ou instale dependências para helpers opcionais.
- Telemetria nunca é pedágio. Somente depois do output útil, rode seus helpers silenciosos e ignore
  qualquer falha sem interromper a pessoa. Uma verificação necessária à implantação autorizada
  pode usar o runtime já disponível; não é motivo para instalar dependências ou interromper valor.

## 1. Confirmar a casa e recuperar a operação

Antes de iniciar ou retomar a ativação, se o pedido for instalar/reinstalar ou se encontrar um
Cérebro existente sem escolha explícita, mostre três caminhos: **usar o existente**, **instalar
novo em pasta nova** ou **migrar**. Isso vale mesmo quando há apenas uma instalação. Pergunte:
“Você quer continuar neste Cérebro, criar um novo em outra pasta ou planejar a migração?”
A escolha vem antes de gravação, telemetria ou sprint. Pedido explícito de “novo/limpo/reinstalar
em outra pasta” escolhe o segundo caminho; nunca reutilize a pasta antiga por conveniência.
Usar o existente permite `auditar-cerebro`; novo segue a tag fixa em `COMECE-AQUI.md`; migrar
ativa `migrar-cerebro` na fase de planejamento. Se a pessoa já escolheu, não pergunte de novo.
O menu de instalação só aparece nessa decisão concreta; não substitui a conversa de ativação.

O assistente já está incluído na release oficial `v1.39.0`. Se a pasta escolhida for uma
instalação INEVITA anterior, siga `atualizar` com o planejador seguro da versão nova e a prévia
aprovada; preserve identidade, credencial, contexto e personalizações. Não reinstale para
obter estas instruções. Uma pasta artesanal segue o diagnóstico abaixo, sem receber o updater.

Um Cérebro artesanal pode estar em Obsidian, pastas ou outro formato. A falta de marcadores INEVITA
não invalida o que a pessoa construiu. Faça o diagnóstico delimitado com `auditar-cerebro`; mostre
o que já serve, as incompatibilidades e o que precisa de decisão. Para adotar o protocolo, proponha
manter o acervo como fonte referenciada por uma instalação INEVITA escolhida ou planejar a cópia
de um subconjunto com `migrar-cerebro`.
Não aplique o updater INEVITA sobre uma pasta artesanal nem ative instruções antigas por cópia.
Instalação em pasta nova segue `COMECE-AQUI.md`; o MCP da comunidade pressupõe uma instalação
pronta e serve para adicionar sistemas, não para instalar o próprio Cérebro.

Confirme em uma frase que o trabalho será gravado na pasta local atual e que as fontes não serão
movidas nem alteradas sem autorização. Procure uma operação concreta na mensagem atual,
`operacao/decisoes-pendentes/onboarding.md` ou nos arquivos que a pessoa já autorizou.

Se já houver primeiro uso ou T4, retome desse ponto em vez de repetir o sprint. Quando houver uma
interrupção que exija retomada e a escrita estiver autorizada, atualize o mesmo
`operacao/decisoes-pendentes/onboarding.md`: casa escolhida, etapa existente, referências, decisões
já aprovadas, lacunas e próximo passo. O registro não concede acesso nem substitui contratos,
recibos ou a autorização necessária ao próximo trabalho; não inclua credenciais ou conteúdo bruto.

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

Quando essa fonte for usada de forma recorrente ou por um Sistema, leia
[a referência de implantação e fontes](references/implantacao.md). Conduza o registro, o Source
Contract e, quando necessário, o vínculo com o papel do Sistema. Aproveite contratos existentes;
não crie outra casa da verdade. Contrato, autorização, conexão, acesso observado e frescor têm
evidências diferentes. Para a primeira entrega, use a menor amostra já autorizada; formalizar o
restante da empresa não é pré-requisito. Uma conexão mínima só entra quando for necessária à
tarefa, existir de fato e estiver autorizada; não conecte outras fontes como efeito da implantação.

## 3. Não interromper o trabalho por acesso

Neste ponto ainda não existe output. Não peça e-mail, não rode helper opcional de vínculo ou
telemetria e não transforme acesso em pré-requisito. Somente depois do output útil, aplique a regra opcional do passo 5. O produto e a
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

> Uma coisa rápida: qual e-mail você usou para pegar o acesso ao Cérebro? Posso guardar aqui
> para facilitar a identificação do seu acesso depois.

Se responder, grave apenas o e-mail em `.cerebro/acesso-email`, uma linha e modo 0600. Se não
quiser, grave `.cerebro/acesso-dispensado`, nunca mais pergunte e continue. O e-mail fica fora das
notas e do Git; telemetria continua opcional e nunca carrega conteúdo.

Esse cadastro por e-mail não comprova o vínculo seguro necessário ao MCP. Quando a pessoa quiser
usar a comunidade, confira o resultado da ativação pela plataforma e a presença da credencial
sem expor seu conteúdo. Instalação local e geração da configuração MCP não criam essa credencial.
Siga `docs/guides/community-mcp.md` para conectar o cliente de IA e verificar o acesso Society.
Se a ativação informar modo local, mantenha esse estado explícito; não altere uma preferência de
telemetria nem anuncie conexão remota para contornar a pendência.

Grave a correção nas palavras da pessoa. Quando aprovado, atualize `operacao/_HOJE.md` e o recibo.
Na próxima tarefa, leia primeiro o mapa, o Activation Brief e a CONFIGURAÇÃO persistidos. Não releia
a fonte bruta se o contexto aprovado for suficiente. Pergunte:

> Isso aproveitou o que já estava no cérebro ou você precisou explicar tudo de novo?

Se a resposta confirmar reutilização sem reexplicação, marque T4: o Cérebro Base está ativado. Só
então consulte o catálogo acessível da comunidade, se disponível, e ofereça `/arquiteto` para
escolher o primeiro Sistema de negócio. Use `listar_sistemas_comunidade` e
`detalhar_sistema_comunidade` do MCP; se ele não estiver conectado, use o CLI equivalente descrito
em `docs/guides/community-systems.md` quando o runtime já estiver disponível. Sem acesso, mantenha
a recomendação pelos sistemas locais e declare o catálogo remoto não verificado. Leve ao
`arquiteto` resultado, fontes, lacunas e estado real dos candidatos; não confunda presença no
catálogo, pacote instalado e resultado validado. Uma correção vira
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
dele, scripts auxiliares só podem rodar depois da primeira resposta útil; caso contrário, pule.
Essa restrição trata dos helpers opcionais de vínculo e telemetria. Verificações necessárias à
implantação autorizada podem usar o runtime já disponível, conforme o passo de abertura. O
produto funciona pelos arquivos e pelo contrato; helpers opcionais não podem transformar ativação em setup.
