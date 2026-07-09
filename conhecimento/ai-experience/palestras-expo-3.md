---
tipo: palestra
fonte: ai-experience
evento: ai-experience
sessao: "Palestras expo vol. 3 — a trilha do contexto"
pode-ir-comunidade: true
---
# Expo vol. 3 — a trilha do contexto (7 palestras + ecos)

> Sete palestras do AI Engineer World's Fair sobre O assunto: contexto, memória e onde o conhecimento mora. Citações no inglês original com minutagem. Íntegras: [[palestras-expo-3-completo]].

## 1. WTF Is the Context Layer? — a tese com números
**Tese:** performance de IA = inteligência × contexto. A inteligência multiplicou por mil na década; o contexto do teu negócio quase não saiu do lugar.
- *"One out of five AI use cases actually make it to production."* `[01:32]` — o problema do mercado não é o modelo.
- *"Intelligence has thousand X in the last decade. On the other hand, context, the situated knowledge of your business, that's barely moved... It's otherwise logged in dashboards, Slack threads, and the head of that analyst who might be leaving next week."* `[03:04]`
- *"These dream teams are built on shared context. They have a shared language. They have a shared picture of what's true today."* `[10:54]`
- *"Context kind of needs to be managed like code."* `[13:52]`
- *"I started this presentation by saying context is king. I'd like to end it by saying **context is also IP**."* `[18:54]`

**Pro teu negócio:** numa era em que tu e teu concorrente têm o MESMO modelo, o que diferencia é o contexto que só tu tem — e ele se gerencia como código: versionado, com dono, vivo. É exatamente o que este cérebro faz.

## 2. Agent Memory Is Solved. Agent Learning Is Not. — por que teu "sim" vale ouro
**Tese:** memória virou commodity; aprendizado não. O que falta é promoção supervisionada — o humano decidindo o que vira durável.
- *"Agentic memory is not learning, it's just more memory... Shared state is not shared knowledge."* `[02:17]`
- *"A bigger context window is the surest way to quickest failure in an expensive manner... your context rots."* `[03:00]`
- *"It's just like code. Not anyone can contribute. You need to go through a process of supervised promotion and only then does it make it durable."* `[03:38]`
- *"Our context chunks went down from over 7,000 chunks to about 1,000 chunks. So one-seventh the context size, a lot higher precision, and a lot less money burned on tokens."* `[05:35]`
- *"Human promotions today kind of equal the training signal for self-improving orchestration tomorrow."* `[15:08]`

**Pro teu negócio:** quando este cérebro te pede "guardo assim?" antes de gravar, não é burocracia — cada aprovação tua é o sinal que treina o sistema. E destilar não perde informação: 1/7 do contexto, MAIS precisão.

## 3. AI in GTM at Notion — o case comercial completo
**Tese:** vendas com IA virou problema de sistemas — um loop know→decide→act→learn onde humanos e agentes operam no mesmo substrato.
- *"Every workflow could be reduced to four questions: What do we know about the customer? What should happen next? How do we execute that safely? And did it work?"* `[05:16]`
- *"We decided that it was very important to own the context layer, and we decided to rent everything else... We refuse to outsource the context layer because that's where our edge is."* `[08:07]`
- *"Before you build, shadow your best human... that was a chaos, but it was also the spec. If you encode a mediocre process, you get a mediocre agent."* `[19:02]`
- *"Users who received context-aware recommendations were **63% more likely** to take the next step."* `[18:35]`

**Pro teu negócio:** antes de automatizar qualquer processo teu, GRAVE teu melhor humano fazendo — o caos dele é a spec. E o contexto é a única camada que não se aluga: o resto (modelo, ferramenta) troca-se.

## 4. Prompt, Memory, Weights — onde o conhecimento mora
**Tese:** a decisão de arquitetura central de qualquer sistema de IA é onde cada conhecimento vive — e a maioria decide por acidente.
- *"Your architecture was accumulated, it was not designed. That is the accident."* `[04:20]`
- *"The job of the prompt is behavior... The wrong job for the prompt is to store facts."* `[05:00]`
- *"The job of memory is to ground your model in a knowledge that is current, large and citable."* `[06:40]`
- *"The only axis that drives this is rate of change."* `[11:20]` — muda sempre → contexto da conversa; muda às vezes → memória; nunca muda → é do modelo.
- *"**The model is the easy part.** What you build around the model... is the key architecture that you are developing."* `[pt2 @ 01:48]`
- *"The agent gets better at its job by the virtue of doing its job."* `[pt2 @ 01:31]`

**Pro teu negócio:** fato do teu negócio NUNCA vive no prompt — vive em nota citável que atualiza (este cofre). O prompt é comportamento; a memória é conhecimento; e o loop entre eles é o que faz tua IA melhorar trabalhando.

## 5. LLM Knowledge Bases: a practical guide — o cérebro pessoal em produção
**Tese:** capturar bruto sem fricção (voz), deixar a IA enriquecer e conectar, acordar com tudo organizado.
- *"The goal should just be get down as many thoughts in the moment as possible."* `[01:43]`
- *"I actually instruct the agent to be reluctant to add new tags because Claude loves to get creative."* `[03:56]`
- *"All of that is generated programmatically. I didn't write any of this. Because all I have time to do is generate the raw ingredients."* `[08:10]`
- *"I wake up to a perfectly fresh wiki that I can review. **It's like the daily paper but it's your own.**"* `[13:17]`

**Pro teu negócio:** é a descrição de um cérebro como o teu, operado por outra pessoa no Vale — captura barata, curadoria com freio (rótulo novo só com aprovação), e o jornal da semana que o `/reindex` te entrega.

## 6. The Building Blocks of GTM Orchestration — de baixo pra cima
**Tese:** orquestração se constrói resolvendo pra UM time primeiro, sobre uma fundação de dados consistente.
- *"Everybody is operating off of a different source of truth, and that makes it effectively impossible to distribute some coordinated action."* `[01:01]`
- *"The way we tend to approach these problems is **solve for one team first, then scale horizontally**."* `[06:22]`
- *"Unstructured information is probably the most valuable thing you're sitting on — within your warehouse or your notes or wherever you store this today."* `[09:31]`

**Pro teu negócio:** tuas notas, calls e conversas soltas são o ativo mais valioso que tu tem parado. E automação começa estreita: um processo, um time, e só então espalha.

## 7. Why We Killed Our Multi-Agent Pipeline — a lição da humildade
**Tese:** o pipeline multiagente quebrou não pelo modelo, mas pela divisão errada do trabalho — julgamento se consolida, não se espalha.
- *"Obviously it's not the LLM which failed, right? It's the way how we split the work."* `[05:23]`
- *"This is a completely deterministic workflow. So we separated it out from the agentic system. The agent's job is to investigate, not to identify."* `[07:57]`
- *"We didn't want the judgment to be distributed between agents. We wanted to consolidate to a single agent."* `[09:17]`

**Pro teu negócio:** o que é processo determinístico vira automação simples; o que exige julgamento fica concentrado — em UMA IA bem contextualizada e, acima dela, em TI. Exército de agentes sem dono do julgamento é como time sem gestor.

---

## Ecos do expo (frases fortes de sessões com gravação parcial)
- *"AI makes individuals faster. **Shared memory makes teams faster.**"* — sobre memória compartilhada `[19:13]`
- *"Your harness, your memory. If you don't own your harness, you don't own your memory."* `[17:55]`
- *"Bad memory is expensive... having a good structural policy for recall can save you a lot of tokens. What survives when you run this over and over?"* — sobre política de recall `[02:24–03:04]`
- *"The same prompt can generate different responses every time... you must constantly evaluate quality in the live environment."* — sobre monitorar GenAI `[00:54]`
- *"Loops can drift... and loops can cost you money."* + *"Pydantic at the door, ontology at the ledger."* — sobre guardrails `[01:54, 06:26]`
- *"If you can't build a single agentic loop, why go and try to build a multi-agent orchestrated system?"* — sobre não over-engineer `[00:57]`
- *"Keep the tool count small... make it dead simple for agents to stumble across the right way to use things."* — sobre desenhar pra agentes `[05:26, 13:00]`

elos: [[mapa-da-conversa]] · [[workshops-expo-2]]
