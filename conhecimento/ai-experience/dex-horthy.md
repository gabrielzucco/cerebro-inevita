---
tipo: palestra
fonte: ai-experience
evento: ai-experience
autor: "Dex Horthy"
sessao: "Harness Engineering is not Enough: Why Software Factories Fail"
pode-ir-comunidade: true
---
# Dex Horthy (AI Experience) — Loops que funcionam no mundo real
> Loops de IA são poderosos, mas sozinhos falham: em codebase de verdade, exigem teoria de controle, método e humano no loop.

## As sacadas
- **Loops sim, mas lendo o código.** *"I think loops are super powerful, but we can design loops and still read the code. In fact, we can design loops to make it easier to read the code because the loops are making the code better."* `[02:26]`
- **Código ruim ficou muito mais caro na era dos agentes.** *"Bad code is much more expensive in the age of agents than it has ever been at any point in its past."* `[02:11]`
- **Isso exige engenharia de verdade, não mágica.** *"But to do this is going to take some real engineering, y'all. So let's talk about control theory."* `[02:44]`
- **Mudança incremental, não tentar chegar ao fim de uma vez.** *"Control loops change the system incrementally, instead of just trying to get straight to the end state immediately all at once, and risk blowing everything up."* `[04:09]`
- **O oposto do "blind loop": ninguém quer revisar um PR gigante.** *"So control loops are the opposite of what I'm going to call a blind Ralph loop. How do we avoid PRs that look like this? Because nobody wants to review this."* `[04:23]`
- **Padrões-ouro escritos à mão antes de soltar o agente.** *"At HumanLayer, we like to build out what we call golden patterns by hand before setting the agent loose. These are just like idiomatic handwritten examples for the agent to follow because they're just pattern replicators."* `[09:53]`
- **Humano no loop, com baixíssima fricção pra re-steerar.** *"There's a better way to do this, where we can put a human on the loop in a really low friction way to re-steer it when it goes wrong. And the way to do this is to just create a feedback file... tracked in version control."* `[11:13]`
- **A pergunta-chave: dá pra medir e aplicar em pequenos passos?** *"The key questions are, can we find something we can measure? Can we apply changes incrementally?"* `[06:52]`

## O que prova pra INEVITA
Reforça a tese: o harness/contexto (o loop bem desenhado) vence o modelo cru, mas só com método e disciplina — padrões-ouro escritos à mão, medição, incremento, humano no loop. Não é YOLO nem mágica: exige engenharia. A comunidade é justamente onde esse método (o "como fazer certo") circula — o contexto que falta pra não cair no blind loop.

**Íntegra:** [[dex-horthy-completo]]
