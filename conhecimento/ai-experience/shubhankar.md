---
tipo: palestra
fonte: ai-experience
evento: ai-experience
autor: "Shubhankar Srivastava"
sessao: "Hill-climbing Skills: How to Improve Agents Without Touching the Model"
pode-ir-comunidade: true
---
# Shubhankar Srivastava (AI Experience) — agente melhora sem trocar o modelo
> Como subir a confiabilidade de browser agents sem mexer no modelo — no harness, na estratégia e no aprendizado que persiste entre runs.

## As sacadas
- **A dor não é o modelo — é que cada run começa do zero.** *"And the most important thing is, every run starts from zero. You're not really having any sort of learning baked into your run."* `[01:53]`
- **O artefato que muda o jogo é um arquivo de estratégia que carrega o aprendizado entre execuções.** *"the key thing that happens is there's a strategy.md file that is essentially the artifact across multiple runs. After every iteration, the teacher thinks about what happened, looks at the screenshot, looks at the logs... and it puts that in the strategy.md file, and that artifact carries over to the next iteration, and it improves from there."* `[03:15]`
- **O agente acha truques que um humano nunca acharia — e o ganho é brutal em custo e tempo.** *"it went from $6.22 to $0.51... the time taken went from 189 seconds to 27 seconds... These are the kind of learnings where humans would never have done, where you just sort of embrace the virtual lesson and let agents do the job and they can find these tricks for you."* `[08:51]`
- **Fine-tuning não escala; o que escala é deixar o agente aprender da produção.** *"some people might say, oh, why don't you fine tune on something... but it's not really scalable, right? ... You want some, you want a modality where it can learn from its production races and get better over time."* `[02:28]`
- **Confiabilidade é problema de engenharia, não de modelo — está no harness.** *"Reliability is an engineering problem. you can design your harness to go for one skill for each task, or you can take one skill for every task that you will ever see. I think it entirely depends how you do the artist engineering."* `[27:58]`
- **O harness é quem decide qual ferramenta usar pra fazer o trabalho.** *"If the harness has the intelligence to bring in skills from OpenTable and from Resi and Google reservations. Maybe it can bring all of those in, figure out what is the best way to book me a date night... Like the hardest should be able to figure out which tools to use to get the job done."* `[28:46]`
- **Duas condições não-negociáveis pra esse loop funcionar: ambiente replayável e métrica verificável.** *"A, you should have a replayable environment of some sort so that you can run these loops, and B, you should have some sort of verifiable, some sort of quantifiable metric for you to run these loops."* `[14:28]`
- **Investir no ambiente é o que ninguém discute e é o que mais rende.** *"Retaining the environment, I think, sometimes is under-discussed, but extremely important... So investing in your environment also can be super rewarding in these cases."* `[19:31]`

## O que prova pra INEVITA
O próprio palestrante diz que o modelo (Opus, computer use) já é commodity — o que separa quem entrega do que não entrega é o harness, a estratégia que persiste e o ambiente em volta. É a tese da INEVITA: na era da IA a execução virou commodity, vence quem tem contexto e o sistema ao redor. E o aprendizado que ele descreve (carregar lições de runs passadas) é exatamente o que uma comunidade faz pelo founder — dá o contexto que falta pra não recomeçar do zero a cada problema.

**Íntegra:** [[shubhankar-completo]]
