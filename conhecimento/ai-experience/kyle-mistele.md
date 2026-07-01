---
tipo: palestra
fonte: ai-experience
evento: ai-experience
autor: "Kyle Mistele"
sessao: "Loop Engineering from first principles"
pode-ir-comunidade: true
---
# Kyle Mistele (AI Experience) — Por que o harness venceu o modelo
> Claude Code virou o maior coding agent não pelo modelo, mas porque o lab treinou o modelo contra o próprio harness que distribui.

## As sacadas
- **O modelo é commodity; o harness é a vantagem.** *"The difference was that this was the first time that a model lab trained a model against the harness they were going to distribute it to users in."* `[00:22]`
- **Sem dono do modelo E do harness, você sempre perde.** *"If you are a harness builder and you don't own the model weights and you can't RL the model in your harness, you will always be at a disadvantage compared to somebody who owns both the model and the harness."* `[00:38]`
- **As ferramentas eram as mesmas — a diferença foi o loop.** *"They had all the same tools, read, write, edit, grab, bash. So what was the difference?"* `[00:17]`
- **O sinal fácil é "passou no teste"; o difícil é qualidade.** *"Verifying code quality and maintainability is orders of magnitude harder than the code runs in the test pass, because the cost function of bad architecture is measured in months and years."* `[03:09]`
- **Se o modelo soubesse o que é bom, já teria feito bom.** *"Models judging quality can only go so far, because if the model knew what good code looks like, it would probably write it in the first place."* `[04:21]`
- **O que o RL não ensina, você resolve na engenharia do loop.** *"We're constrained by what we can teach during RL. And so I will posit that for now we're stuck reading the code, but we can still move pretty fast."* `[04:35]`
- **O contexto entra, o próximo passo sai — o loop é o produto.** *"LLMs are just next-token predictors. As you're doing your agent loop, context window goes in, next step comes out."* `[01:02]`
- **A alavanca real está antes de gerar: planejar pra encurtar a revisão.** *"We're going to embrace this approach of how do we plan up front to reduce the chance that we have a long or difficult review process."* `[05:02]`

## O que prova pra INEVITA
Na era da IA o modelo vira commodity — todos têm as mesmas "ferramentas". Quem vence é quem controla o loop e o contexto em volta: Kyle mostra que até o lab só ganhou porque treinou o modelo dentro do próprio sistema de entrega. Traduzindo pro nosso mundo: o que diferencia não é a IA que você usa, é o contexto e o sistema que você constrói em volta dela — e a comunidade é justamente o harness que fornece o contexto que o modelo sozinho nunca teria.

**Íntegra:** [[kyle-mistele-completo]]
