---
tipo: palestra
fonte: ai-experience
evento: ai-experience
autor: "Paul Bakaus"
sessao: "The Dark Arts of Skill Engineering"
pode-ir-comunidade: true
---
# Paul Bakaus (AI Experience) — Skill engineering como vantagem competitiva
> Técnicas avançadas de skill engineering: eval harness próprio, sub-agentes que julgam e por que taste não dá pra automatizar.

## As sacadas
- **Se o portão puder ser burlado, ele será.** *"If the gate can misuse, it will."* `[00:21]`
- **Construa um harness de eval que replica os modelos que importam.** *"I do the evos harness that closely replicates, for me, every model harness that I care about now"* `[05:18]`
- **Um LM age como usuário contra o outro — recria a conversa de ida e volta.** *"I've built this LM that acts as the user against the other one. And so it's also getting that back and forth."* `[05:56]`
- **Mixture-of-expert: vários juízes dão olhos pra cada resultado.** *"I've built that house, and then I've built a mixture of expert design judge that runs on top of it. So it's giving eyes to the value of each result."* `[06:05]`
- **Cada regra tem uma tag pra teste de ablação — remove a linha, roda o eval, vê se mudou.** *"every rule has an XML tag (...) it removes that line, runs the evos against all models, and then has the line back in (...) to see, did it actually change?"* `[07:00]`
- **Modelos são péssimos em avaliar taste.** *"I also think that models are particularly bad at evaluating taste."* `[08:46]`
- **Taste não é solucionável — é escasso por natureza; quando todos usam o mesmo, deixa de ser taste.** *"taste is scarce and unique and once everybody uses the same taste it becomes ubiquitous and then we don't think it's tasteful anymore."* `[08:28]`
- **A ferramenta entrega o suficiente pro primeiro passe — depois entram os olhos humanos.** *"that's good enough for me for the first pass, and then I use my own human eyes to get results."* `[10:04]`

## O que prova pra INEVITA
Bakaus mostra que mesmo no auge da engenharia de skills, o que ele não consegue automatizar é taste — escasso, único, e que vira commodity quando todo mundo copia. É exatamente a tese: a execução (o harness, os juízes) virou commodity; o diferencial é o contexto e o julgamento humano que só vêm de fora do modelo. O founder que opera com IA precisa de um lugar — a comunidade — pra calibrar esse taste contra quem já provou.

**Íntegra:** [[paul-bakaus-completo]]
