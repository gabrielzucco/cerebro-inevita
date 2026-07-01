---
tipo: palestra
fonte: ai-experience
evento: ai-experience
autor: "Niels Rogge"
sessao: "How I automate my own job at Hugging Face using agents"
pode-ir-comunidade: true
---
# Niels Rogge (AI Experience) — automatizar o próprio trabalho com agents
> Um ML engineer da Hugging Face automatiza a própria rotina — abrir PRs, issues, model/dataset cards, ler papers — com um agent que roda enquanto ele dorme.

## As sacadas
- **O gargalo não é o trabalho, é a escala do humano.** *"It's not really scalable for me to open all these GitHub issues with pull requests because every single day there are hundreds of research papers coming out on the market."* `[00:12]`
- **Automatize replicando o SEU próprio fluxo, não um genérico.** *"So at the time I started building a workflow which basically replicated the workflow that I was doing when I was doing this outreach."* `[03:03]`
- **Comece simples: uma LLM API, sem framework.** *"Start simple, start with a single LLM API, avoid frameworks, actually I think those were great tips."* `[02:55]`
- **O operador trabalha dormindo — o agent roda sozinho.** *"When I'm sleeping, there's this agent, this agent is just a cron job... which is gonna read the abstracts of the papers and then it might open different issues."* `[03:48]`
- **Os modelos ficaram tão bons que substituem milhares de linhas de código custom.** *"I can replace a lot of custom code, thousands of lines of code, with nowadays just a simple agent with maybe a CLI as a tool and a skill, and that's it. Because the models have become so good."* `[06:46]`
- **Não esconda que é agent — ele entrega exatamente o que você entregaria.** *"To be honest I don't think it's close that it's an agent, why?... they post exactly the same stuff as I was doing before, mainly. So I don't actually see any reason to do that."* `[10:29]`
- **Milhares de ações automatizadas, quase nenhuma rejeição — é win-win.** *"Out of the thousands of issues that are being created on Hugging Face, actually so far, we had two negative comments... most of the people, they just said, yeah, actually it makes perfect sense... Why didn't I think of this?"* `[11:06]`
- **O mesmo motor multiplica em vários canais.** *"I have a Twitter account... called Daily Papers, and it actually uses the exact same workflow as my agents behind the scenes... It recently crossed 90,000 followers without the involvement of me."* `[15:23]`

## O que prova pra INEVITA
O founder que aprende a automatizar o próprio trabalho com agents deixa de ser um humano com teto de horas e vira um operador de alto impacto: ele se multiplica. Mas o pulo do gato do Niels é que o agent só funciona porque replica o fluxo dele — o contexto dele. Sem o contexto do negócio (o que fazer, como fazer, com que voz), o agent não tem o que executar. É exatamente isso que o cérebro captura: o contexto que torna a automação possível.

**Íntegra:** [[niels-rogge-completo]]
