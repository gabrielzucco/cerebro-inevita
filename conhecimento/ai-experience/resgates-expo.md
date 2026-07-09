---
tipo: palestra
fonte: ai-experience
evento: ai-experience
sessao: "Resgates do expo — sessões recuperadas do bruto"
pode-ir-comunidade: true
---
# Resgates do expo — sessões recuperadas do bruto

> Quatro sessões recuperadas das gravações brutas do evento (jun/2026): o workshop completo de product discovery (54 min), a imersão numa big tech de pagamentos sobre context plugins (duas gravações — timestamps marcados `[S2]`/`[S3]`), a talk de compound engineering e o clipe sobre por que o Claude Code explodiu. Citações no inglês original, corrigidas do áudio de salão.

## 1 · Product discovery: valide a dor antes de gastar um token — workshop de 54 min (Kent C. Dodds)

**Tese:** na era em que implementar ficou barato, o trabalho que sobrou é descobrir se o problema existe — e o Mom Test é a ferramenta pra isso.

- **Construir certo vem DEPOIS de construir a coisa certa:** *"Building the thing right is downstream of building the right thing."* `[00:46]`
- **A IA inverteu o funil do MVP:** antes você construía até chegar no útil; agora *"In AI, it's like, here's the whole thing, and your job is to whittle it down to the actually useful thing that you're trying to accomplish"* `[03:42]` — o trabalho virou cortar, não adicionar.
- **As perguntas que validam de verdade:** *"tell me about the last time this happened, and what did you do instead, and what did it cost you to do that?"* `[23:05]`. E nunca sobre o futuro: *"Nobody can tell the future. You don't want to say, would you pay? How much would you pay?"* `[23:49]`
- **O sinal de ouro é o quebra-galho que já existe:** *"That is gold. That is really strong evidence that this is a problem worth solving. If they're already putting a bunch of effort and paying a bunch of money to solve this problem with some workaround, that's a really good opportunity"* `[25:33]`. E o contrário também: *"If they can't remember, that's a signal"* `[25:12]`.
- **O custo de pular a validação, em dinheiro:** time construiu um ano pra aguentar "toda a Austrália logando junto" — *"after it was 1.2 million Australian dollars... they ended up like no one used it. Not a single person"* `[27:53]`. *"We probably could have done something in two weeks, not a year"* `[28:23]`.

**Pro teu negócio:** antes de construir feature, oferta ou edição nova, roda o Mom Test no teu cliente: última vez que a dor aconteceu, o que ele fez no lugar, quanto custou o quebra-galho. Se ele não lembra, não tem negócio ali — e a resposta educada de quem quer encerrar a conversa ("eu usaria!") não é evidência.

→ pra cavar fundo: [[kent-dodds]]

## 2 · Context plugins: 91% menos erros — imersão numa big tech de pagamentos (2 gravações)

**Tese:** empacotar o contexto oficial (SDK + docs + skills + MCP num "context plugin") é o que separa o demo happy-path do código de produção — e quando o modelo vira commodity, esse contexto é a vantagem competitiva.

- **Agent experience é a nova user experience:** *"agent experience is the new user experience"* `[S2 00:40]`. O porquê é estatístico: *"in the absence of context, all the options have equal probability. And you know that AI is a probabilistic system"* `[S2 02:15]`. A regra: *"Provide right context, not more context"* `[S2 02:44]` — despejar tudo dá context rot.
- **Demo não é produção:** *"I've been seeing a lot of demos that only show happy path and they don't work in production"* `[S2 08:13]`. No teste real, o agente sem contexto entregou checkout que *"it compiled, the demo was fine, but it never captured the money"* `[S2 08:44]` — *"Because the AI did not think of any edge case, it only took the happy path and built it"* `[S2 09:23]`.
- **O case em números:** *"91% reduction in compiling runtime errors, significant reduction in handling fixes, token consumption"* `[S3 00:42]`. E supera até doc aberta via MCP porque *"the context is not just the docs. It's the conversation. It's the expertise. It's the opinion"* `[S3 01:37]`. Bônus de custo: *"when you have a good harness like the context plugin, you don't need the premium model"* `[S3 15:23]`.
- **A regra de operação que compõe:** *"you have to sit down and watch it fail. Why did it fail? What was missing? What's the context that wasn't there?"* `[S3 07:16]`. E quando errar: *"don't re-prompt the agent. Go back, fix your system, fix your harness, make an adjustment, prompt again"* `[S3 33:22]` — *"the compounding effect over time that you'll get in that harness is tremendous"* `[S3 33:30]`.
- **O mercado que vem aí é de não-devs construindo:** *"4 to 1 citizen developers will outnumber professional coders"* `[S3 02:20]`; *"Future developers aren't even going to touch your product if there's not an MCP server or a CLI that they can interface with"* `[S3 03:17]`. Migração que levava 6 meses `[S3 22:02]` caiu pra *"two hours for the technical migration"* `[S3 22:16]`.

**Pro teu negócio:** trata a IA como cliente do teu contexto — empacota oferta, ICP e processo num formato que o agente consome (é exatamente o que este cérebro faz). E adota a regra deles: quando a IA errar, não re-prompta na base da teimosia; conserta o contexto que faltava, porque essa correção fica pra sempre.

## 3 · Compound engineering: a regra 50/50 — Kieran Klaassen

**Tese:** metade do tempo construindo o feature, metade ensinando o sistema — o conhecimento extraído compõe e inverte a curva: cada entrega torna a próxima mais barata.

- **A regra:** *"my rule is, 50% should go into creating the feature... but 50% of the time should go to teaching the system for anything that it did wrong, can we learn something"* `[00:37]`.
- **Guardar solução economiza token, não gasta:** *"it's actually more token efficient because if you have the right answers and the right solutions already... you don't need to review, you don't need to correct, you don't need to do deep research across the internet"* `[01:16]`. E o conselho: *"keep extracting until the complete [loop] runs itself and it's so freaking good that it will surprise you"* `[01:45]`.
- **O teste de que o sistema está pronto: tédio.** *"It should be boring. It should just work. You should not be needed"* `[09:52]`. A régua concreta: *"If you are at a point where you just run something and it runs for three hours and it's always good, you know you're there"* `[10:04]`.
- **O padrão que prova a composição:** *"your standard should be the next feature should be easier because you shipped this one. If the next feature is harder because you added complexity, which is normally how engineering works, we're flipping that"* `[12:11]`.

**Pro teu negócio:** toda correção que você fez duas vezes na IA — na copy, na proposta, na análise — tem que virar regra gravada no teu cérebro na hora. Não é perfeccionismo: é o que transforma retrabalho eterno em ativo que rende na próxima.

→ pra cavar fundo: [[kieran-klaassen]]

## 4 · Por que o Claude Code explodiu — clipe (Kyle Mistele)

**Tese:** não foi a ferramenta — foi o primeiro caso de lab treinando o modelo dentro do próprio harness que distribui; e o limite atual é que RL não sabe medir manutenibilidade.

- **A pergunta de US$ 9 bi:** *"Why did Claude Code go from nothing to four billion, and I think now they're at nine billion in revenue, in under a year?"* `[00:00]` — os concorrentes *"had all the same tools, read, write, edit, grep, bash. So what was the difference?"* `[00:17]`
- **A resposta:** *"this was the first time that a model lab trained a model against the harness they were going to distribute it to users in"* `[00:22]`.
- **A consequência estrutural:** *"if you are a harness builder and you don't own the model weights and you can't RL the model in your harness, you will always be at a disadvantage compared to somebody who owns both the model and the harness"* `[00:38]`.
- **O buraco do RL é qualidade de longo prazo:** *"Verifying code quality and maintainability is orders of magnitude harder than 'the code runs and the tests pass', because the cost function of bad architecture is measured in months and years"* `[03:09]`.
- **A conclusão de operador:** *"for now, we're stuck reading the code, but we can still move pretty fast"* `[04:41]` — e a alavanca está antes de gerar: revisão de produto, arquitetura e desenho do programa `[05:12]`.

**Pro teu negócio:** o modelo é commodity; quem controla o sistema em volta dele ganha — vale pra escolher ferramenta e vale pra ti: o teu "harness" é o contexto e o processo que você constrói. E não terceiriza o julgamento: erro de arquitetura (no código ou no negócio) só cobra a conta meses depois, quando o feedback já não chega no dia em que a decisão foi tomada.

→ pra cavar fundo: [[kyle-mistele]]

---
**Íntegras (brutas, áudio de salão):** acervo do evento; `S2`/`S3` = as duas gravações da imersão de pagamentos.
