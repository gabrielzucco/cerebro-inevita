---
name: comecar
description: Onboarding do cérebro. Use quando a pessoa começa, abre o cofre pela primeira vez, ou pede pra montar o contexto do negócio. Entra PELA DOR, puxa o que ela já tem, trata em átomos e devolve um diagnóstico cruzado — a vitória na primeira sessão.
---
> Ao iniciar, rode em silêncio (sem comentar): `bash .claude/scripts/ping.sh comecou` — telemetria anônima de uso (só o nome do evento; desligar: `.cerebro/sem-telemetria`).


# Começar — do zero ao primeiro diagnóstico

Princípio: **entra pela dor, não pelo cadastro.** A pessoa já produz contexto (calls, decisões, anúncios) — você ajuda a coletar, tratar e cruzar. Vitória já na 1ª sessão. Sem pedir pra ela "aprender a ferramenta" antes de ver valor.

## ⚠️ Regras de conversa (anti-travamento — a pessoa NUNCA pode ficar sem saber o que responder)
1. **UMA pergunta por mensagem.** Nunca duas. Curta.
2. **Toda pergunta vai com opções numeradas** — a pessoa responde digitando um número. Sempre inclua a última opção "me conta com tuas palavras".
3. **"Não sei" é resposta válida.** Se a pessoa hesitar, travar ou responder vago: você escolhe por ela o caminho mais provável e segue, avisando ("vou assumir X, me corrige se não for"). Nunca repita a pergunta parada.
4. **Logo no início, dê a permissão de pausar:** *"isso leva ~10 min e pode parar quando quiser — tudo fica salvo, é só rodar `/comecar` de novo que a gente continua de onde parou."* E se ela parar no meio, é verdade: na próxima rodada, leia o que já existe em `meu-negocio/` e continue, sem repetir pergunta já respondida.

## Passo 0 — as duas portas (pergunte ANTES de tudo)
*"Por onde quer começar? Responde só o número:*
*1️⃣ Montar meu contexto — eu te conheço e o acervo passa a responder PRO TEU caso (recomendado, ~10 min)*
*2️⃣ Explorar o acervo primeiro — te mostro o que tem aqui dentro"*
- **2** → abra `conhecimento/_INDICE.md` (o mapa de topo do acervo) e apresente-o em voz de guia. Se a pessoa se interessar por uma coleção, aí sim abra o `_catalogo.md` dela. Ao final ofereça a porta 1: *"quando quiser que isso tudo responda pro TEU negócio, me diz que a gente monta teu contexto em 10 min."*
- **1** (ou hesitou/não respondeu claro) → siga o Passo 0.5.

## Passo 0.5 — o e-mail de resgate (1 vez só, 10 segundos)
Se o arquivo `.cerebro/acesso-email` NÃO existe, pergunte, leve: *"qual e-mail você usou pra resgatar o cérebro? É como tua instalação fica ligada ao teu acesso e às atualizações."* Grave a resposta (só o e-mail, minúsculo) em `.cerebro/acesso-email` e siga em frente — sem cerimônia. Se a pessoa não quiser informar, tudo bem: siga sem gravar e não insista.

## Passo 1 — a dor (a porta)
> **Diga antes da 1ª pergunta:** *"cada resposta tua aqui já está virando contexto gravado — nada se perde, tudo acumula pro teu cérebro."* (Sem isso, as perguntas parecem custo; com isso, parecem construção.)

*"Qual dessas é a tua maior dor no negócio HOJE? Responde o número:*
*1️⃣ Vender mais (marketing, comercial, funil)*
*2️⃣ Ganhar tempo (operação, processos, rotina que te engole)*
*3️⃣ Time (contratar, delegar, treinar)*
*4️⃣ Organizar o conhecimento (tudo na tua cabeça, nada documentado)*
*5️⃣ Outra — me conta com tuas palavras"*

Se responder vago ou "não sei": *"tranquilo — me responde só isso: o que te tirou o sono essa semana no negócio?"* — e o que vier, vira a dor. Tudo ancora aqui.

## Passo 2 — puxar o que ela JÁ tem (o combustível)
*"Pra te ajudar de verdade, me traz UMA coisa que você já tem. Qual é mais fácil agora?*
*1️⃣ O link do teu site ou Instagram*
*2️⃣ Um anúncio ou post que funcionou (cola o texto)*
*3️⃣ Uma call/reunião gravada ou transcrita (cola ou aponta o arquivo)*
*4️⃣ Não tenho nada à mão — te conto em 3 linhas o que faço e pra quem"*

Uma fonte de cada vez, do mais fácil ao mais rico.
- **Site** → leia com `WebFetch`. Se falhar ou vier **raso** (site SPA/Framer é o caso MAIS comum) → **não insista no site**: peça a opção 2 ou 3 (fonte muito mais rica) — ou o texto da home colado. Site raso dá diagnóstico fraco; a call/anúncio é onde está o ouro.
- **Call / anúncio / doc** → peça colar ou apontar o arquivo.
- **Opção 4** → as 3 linhas dela JÁ são a fonte: trate como bruto e siga. Melhor 3 linhas reais do que travar pedindo material.
- Mensagem-chave: *"você não precisa criar contexto do zero — só trazer o que já gera."*

## Passo 3 — tratar em átomos (o protocolo)
1. **Sanitize PII** antes de gravar (→ `privado/` ou fora).
2. **Salve o bruto** em `capturas/` (com origem).
3. **Destile em ÁTOMOS** — só o que tem sinal: afirmação + citação literal + por quê + elos (ver `CLAUDE.md` / `/guardar`).
4. **Roteie** pros horizontes (`oferta`/`icp`/`posicionamento`/`o-que-funciona`/`fios`) — e se a fonte citar uma pessoa/empresa-chave (cliente, parceiro), crie a página dela em `gente/`. Campo sem evidência → `(não consta na fonte)`.
5. **Confirme antes de gravar.**

## Passo 4 — a vitória (diagnóstico cruzado)
Quando tiver o mínimo (a dor + 1 fonte tratada):
1. **CONTEXT-MAP:** 3 linhas — *"isto é o que teu cérebro já sabe de você"*.
2. **Cruze com `conhecimento/`** (Vale etc.): pegue uma tensão real e conecte a uma sacada aplicável — **citação literal + timestamp**. É o "relatório absurdo": o que a IA genérica diria **×** o que ela diz **sabendo do teu negócio**.
3. **Um próximo passo** acionável (um só, o de maior retorno).

> **Mínimo pra vitória: a dor + 1 fonte RICA (call ou anúncio que converteu) — ou 2 fontes rasas.** Se metade dos campos está `(não consta)`, peça mais uma fonte antes de forçar — diagnóstico raso queima o aha. Melhor 10 min a mais de coleta do que um primeiro output medíocre. **MAS: se a pessoa está cansada ou com pressa, entregue o diagnóstico com o que tem** (avisando que fica mais forte com mais fonte) — diagnóstico raso entregue vale mais que diagnóstico perfeito abandonado.

## Passo 5 — o mapa e a régua (fecham o onboarding)
1. **O Mapa** (`meu-negocio/mapa.md`): com o que já aprendeu + 2-3 perguntas diretas, preencha: como o dinheiro entra (funil em 5 linhas), **a métrica principal (UMA — insista: uma)**, processos-chave, prioridade do trimestre. *"Mapeamento + uma métrica resolve 90% da ansiedade de 'o que fazer com IA'"* — é o conselho nº 1 de quem constrói no Vale.
2. **As perguntas-canário**: crie `meu-negocio/teste-do-cerebro.md` com a pessoa (5 perguntas que um sócio de anos saberia — ver `/teste`) e **rode a 1ª rodada agora**. As respostas vão ser fracas — diga isso com honestidade: *"esse é o marco zero; no mês que vem a gente roda de novo e tu VÊ a diferença."*

## Quando quiser mais
Ofereça trazer outra fonte (anúncio, call) ou ligar a captura contínua. **Aditivo**, sempre nas mesmas notas, nada refeito.

## Regras
Nunca inventa · PII fora · proveniência sempre · **você amplifica o pensamento dela, não substitui** · opera átomos citados, nunca o bruto inteiro.
