---
tipo: colecao-workshops
fonte: ai-engineer-worlds-fair
evento: vale-2026
pode-ir-comunidade: true
anonimizado: true
criado: 2026-07-07
---
# Workshops e sessões do expo — pepitas (gravações parciais)

> Gravações de dentro das salas do AI Engineer World's Fair (jun/2026) — fragmentos de 3 a 19 minutos, não sessões completas. Destilado com citações corrigidas; íntegras em [[workshops-expo-completo]]. Empresas e figuras públicas mantidas; palestrantes não identificados ficam anônimos.

## 1 · Skills: o conhecimento da empresa virando executável *(workshop, partes 1-2)*

- **O stack agêntico tem 4 componentes — hooks, MCP servers, subagents e skills — mas o valor mora na última:** *"you would find all of your know-how is actually at the skill level"* `[00:45]`. O diferencial não é a ferramenta; é o conhecimento estruturado que você coloca nela.
- **A definição mais citável:** skill *"defines a new unit... that makes your know-how organization executable"* `[02:39]` — o tácito da empresa virando coisa que o agente executa.
- **Skill boa é estreita:** *"it should be specialized to define one task specifically"* `[01:58]`, e composável, sem duplicação.
- **Subagent é higiene de contexto, não mágica:** *"just to minimize context window... delegates [to a] subagent to execute a specific task"* `[00:39]`.
- **Skills são portáveis entre harnesses:** *"if I'm having a skill on Claude Code and they will move it to Cursor, it will just work"* `[01:51]` — teu conhecimento codificado não fica preso a vendor.
- **Sem a skill certa você paga em tokens:** ficar guiando o agente na mão *"is burning more tokens... rather than giving one shot at the right answer"* `[09:18]`.
- **Segurança:** skill pública pode carregar prompt injection e scripts — *"you might be performing something that's insecure"* `[05:32]`. Não instale skill de terceiro sem revisar. Em organização: catálogo central com metadados, versão, dono — *"if you don't have an owner, no one will be able to maintain the skills"* `[05:03]`.

## 2 · O meio-termo entre delegar tudo e fazer tudo à mão *(sessão de design)*

- **Os dois extremos falsos da era da IA:** o token maxer (delega tudo por medo de ficar pra trás) e o artesão (recusa tudo). *"There's this middle ground that we haven't explored enough... what is the exact level of control?"* `[00:20]`
- **"Claude Beige":** quando todo mundo usa a mesma IA do mesmo jeito, tudo fica igual — *"algorithmic uniformity"* `[01:48]`.
- ***"You cannot one-shot design"*** `[01:56]` — design bom exige contexto, audiência e iteração.
- **Output sem decisão humana é vazio:** *"Nobody decided anything on this page. It's maybe competent, but completely empty."* `[03:57]`
- **Vocabulário é vantagem:** um designer e um engenheiro no MESMO modelo têm outputs completamente diferentes *"based on the language that they use"* `[05:00]`.
- **O trecho final é humano:** *"AI is [not] good enough to replace humans with about 5, 10, maybe 20% of the work to get from good to great"* `[07:48]`.

## 3 · Slop é mensurável — e julgamento virou o ativo caro *(sessão sobre qualidade)*

- **A tese central:** *"as the cost of production basically goes to zero, the thing that becomes expensive and matters more than ever is judgment"* `[01:55]`.
- A internet já vinha ficando homogênea antes da IA; a IA acelerou — *"even in completely different buckets, you saw patterns that were very similar"* `[00:32]`.
- **Slop se mede:** classificadores treinados detectam site gerado por IA melhor que LLM-as-judge `[01:28]`.
- **Criatividade não é temperatura alta:** *"you intentionally diverge on a couple of things while maintaining adherence to expectations"* `[03:42]`.
- **Marca é contexto acumulado que ninguém usa:** *"great brands are the work of dozens of designers... we've already done the work of defining what is great, and then we're not using it well"* `[04:30]`.
- **Curadoria plural como antídoto:** comunidade de ~1.000 designers de mídias e países diferentes pra medir pluralismo `[09:42]` — pessoas (e seu gosto) são o dado que vale.

## 4 · Thinking in public — a lição da YC *(palestra)*

- **Por que a YC funciona:** Paul Graham *"not only is a phenomenal thinker... he also shares his brain, how his mind works"* — *"people are applying to YC because of him"* `[00:14]`. Pessoas > empresas, dito de dentro.
- **Além de building in public:** *"What about thinking in public? It's basically what PG is doing."* `[00:45]` — a palestrante transformou um canal de brain-dump em produto, começando com *"a few people that I highly trust"* `[00:57]` (contexto compartilhado começa em círculo pequeno de confiança).
- **A citação-mãe de PG:** *"Live in the future, then build what's missing — a great prompt for everyone here."* `[02:12]`
- **Aprendizado sob demanda:** *"whenever you have a stream of consciousness about something, ask a model to prepare a little research report"* `[10:59]`.
- **A velocidade da era:** a ferramenta demonstrada foi construída NA MANHÃ da palestra; o highlight foi gerado 20 minutos antes de subir ao palco `[07:35]`.

## 5 · Agent experience na prática: Stripe & Metronome *(sessão)*

- **Erro verboso é feature:** *"our perspective is to have much more verbose and clear errors so that the agent can self-correct"* `[00:10]` — contexto legível por máquina é a nova developer experience.
- **O framework dos 3 papéis do agente** (mapeie no teu produto): agente como **produto** (metrar tokens), como **comprador** (procurement via linguagem natural) e como **usuário** `[03:12]`. E torne teu serviço *"discoverable to agents"* `[03:36]`.
- **Pricing por assento morre:** *"a world in which an agent can operate their entire system... paying for seat-level access is no longer important"* `[04:20]` — caso HubSpot migrando pra créditos; eles chamam de *"headlessness"*.
- **Já é presente:** *"last week at Andreessen's demo day, all five demoing companies were sales-led agents"* `[04:43]`.
- **Pricing complexo descrito em linguagem natural:** replicaram o modelo da Lovable só descrevendo — *"there's nothing more difficult than that"* `[09:01]`.
- Sinal de mercado: *"exponential increase in new business formation with Stripe"* `[02:26]`.

## 6 · Sites generativos: eval por caso de uso, não ranking *(sessão de commerce)*

- **Não existe eval universal:** a avaliação de modelos depende do site — tamanho, área, tipo de commerce `[00:05]`.
- **Velocidade é conversão:** página gerada em 1-2s porque *"the faster the site, the more conversions"* `[01:10]`. Diferença real entre providers: 1,1s vs 4,6s no mesmo prompt `[01:55]`.
- **"Bom o suficiente + rápido" vence "perfeito":** o critério é fitness pro caso de uso `[02:44]` — e não precisa de LLM gigante pra montar página `[03:10]`.
- **Intent-driven:** agrupar queries por intenção do usuário e montar a página só pra ele `[15:02]` — página inteira personalizada em 1,64s ponta a ponta `[10:15]`. *"It's only going to get cheaper, only going to get faster."* `[14:51]`

## 7 · Contra o slop visual: a skill que codifica o que NÃO fazer *(demo)*

- ***"10 to 20% of extra effort focused on UI is a really big competitive advantage"*** `[00:47]` — porque a maioria dos apps de IA é slop.
- **Slop é catalogável:** uma skill que codifica os padrões ("don't use purple gradient, don't use italics in the title") `[01:46]`.
- **O conselho nº 1:** *"give your agents references and screenshots"* `[08:23]` — mantenha um cofre de inspiração; tuas preferências viram um Agents.md acumulável `[08:03]`.
- **Prompt falado ganha:** *"longer and more specific prompts are always better. These days I just record voice notes"* `[09:05]`.
- **Modelo caro pra base, barato pra iterar:** na demo, o modelo 5x mais barato ficou indistinguível do topo de linha pra landing page `[05:24]`.

## 8 · Design ops com agentes: o valor está na exceção *(demo)*

- **IA como QA visual:** checagem de 140+ logos de patrocinadores com *"accuracy 100%"* `[03:41]`.
- ***"The real job is handling exceptions"*** `[05:16]` — mudou a agenda de última hora? Pede o botão de editar e reexporta.
- **Pra escalar, pense pequeno:** *"think everything that can go wrong... and solve it before"* `[06:01]`. E o gargalo virou ter problemas bons: *"once you have a problem that's worth solving, you can basically solve anything"* `[03:11]`.

## 9 · Gateway e config: o stack agêntico na empresa *(workshop, abertura)*

- Em escala de organização: **gateway de MCP** e **gateway de modelos** na frente de tudo `[01:09]`.
- **O conhecimento do agente vive numa camada de config versionável** — os arquivos do Claude Code, agents, schemas e memória `[01:35]` — não na cabeça de ninguém.
- Spec-driven (specify → plan → tasks → implement) é o padrão, mas *"just one step in the journey"* `[02:17]`.

---
**Íntegras (parciais, áudio de sala):** [[workshops-expo-completo]]
