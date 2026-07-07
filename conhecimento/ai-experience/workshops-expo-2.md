---
tipo: colecao-workshops
fonte: ai-engineer-worlds-fair
evento: vale-2026
pode-ir-comunidade: true
anonimizado: true
criado: 2026-07-07
---
# Expo vol. 2 — palestras e estandes (gravações do salão)

> Segunda leva de gravações do AI Engineer World's Fair (jun/2026): 4 palestras identificadas + 3 conversas de estande. Citações corrigidas; íntegras em [[workshops-expo-2-completo]].

## 1 · GEPA: o sistema que otimiza o próprio contexto — Lakshya A. Agrawal (UC Berkeley)

- **O gargalo não é modelo, é eficiência amostral:** *"most teams do not actually have that much data or compute... the problems we are trying to tackle with AI now are bottlenecked by sample efficiency"* `[00:49]`
- **Refletir em texto ganha de reforço numérico:** em vez de aprender de um 0/1, um LLM olha o trace inteiro e reflete no que funcionou `[02:50]`. *"A single natural language update can give a very large behavior change"* `[03:31]` — **uma frase no prompt vale milhares de gradientes.**
- **GEPA com 3 exemplos bateu 2x o ganho que RL (GRPO) teve com 25.000 rollouts** `[04:57]`. Semanas de ajuste manual de prompt viram ~1h automatizada `[06:22]`.
- **Conhecimento de domínio no prompt destrava o "impossível":** agente numa API sem documentação foi de 4,25% → 30,52% (7x) só com contexto otimizado `[07:26]`.
- ***"If you can write it as text and score it, GEPA can optimize it"*** `[10:48]` — um script de 4 linhas evoluiu sozinho pra um agente de 6 passos (32,5% → 89,5% em ARC-AGI) `[13:46]`.
- **Skills otimizadas barato transferem pro modelo caro:** aprendidas num modelo mini (24%→93%), aplicadas ao Claude Sonnet chegaram a ~100% cortando tempo/tokens pela metade `[15:44]`.
- **A tese que valida tudo:** *"as models get better... the more precise instruction about your task that you give to a very smart model, the better that model will be"* `[18:26]` — **quanto melhor o modelo, MAIS vale o teu contexto.**
- Pra tarefas subjetivas: ~50 trajetórias anotadas por humano treinam um LLM-juiz que vira flywheel de melhoria `[19:04]`.

## 2 · Aiden: o agente que venceu o desafio da OpenAI — Zhengyao Jiang (Weco AI)

- Abril/2026: no desafio de contratação da OpenAI, *"the top contributor was one candidate that they couldn't hire. It wasn't a person, it's an agent"* `[00:43]`.
- **A régua certa não é benchmark:** *"can an auto research agent produce work that a human community actually recognizes?"* `[01:36]` — em 22 dias: 7 recordes, ~1.300 experimentos, h-index de PRs 10 vs 7 do melhor humano `[03:59]`.
- **Eficiência > força bruta:** com no máximo 4% do compute total fez ~15% dos recordes `[04:57]`. *"It didn't win through massive parallelization."*
- **Divisão real humano-IA:** quase todas as ideias vieram de papers e humanos — inclusive **ideias abandonadas** que o agente achou e implementou `[06:21]`. *"Execution is mostly the bottleneck... what moves the frontier is belief on existing ideas and tons of good executions"* `[09:02]`
- **O novo trabalho humano é desenhar o ambiente:** *"your codebase abstraction is essentially the architecture... your eval is the loss function and the data"* `[11:42]`. **Eval proprietário é moat:** *"a good evaluation would be amplified more and more as auto research is getting stronger"* `[12:43]`
- Caso concreto: API frouxa deixou o agente vazar dado de teste; apertar a abstração zerou o vazamento — **design do ambiente > vigiar o agente** `[14:37]`.
- **A frase de fecho:** *"The search is automated. The human just moves up the stack, not out of it."* `[15:46]`

## 3 · ACP: o padrão pra comandar agentes — Alex Hancock (Block, mantenedor do Goose)

- O buraco do stack: existe padrão pro agente AGIR (MCP), não pra MANDAR nele — *"we don't yet have a standard for client software to tell agents what to do"* `[02:21]`. O ACP (Agent Client Protocol) fecha isso.
- **Padrões criam mercados:** *"the most powerful thing about MCP is not anything about MCP itself, but that everyone uses MCP"* `[02:03]`
- Demo: mesmo agente, dois clients, zero retrabalho — *"one implementation on the harness side, and you can now use it in any client"* `[06:14]`. E remoto por design: *"agents are gonna be running in the cloud"* `[06:36]`
- O stack agêntico em 4 peças desacopláveis: client, harness, tools (MCP) e modelo `[07:50]` — e a competição migra pra **UX dos agentes** `[09:42]`.

## 4 · MCP Tasks: tarefas longas e duráveis — Cornelia Davis (Temporal)

- Tasks resolvem o tool longo: invoca e recebe um handle — *"long running in the background, and eventually you can get back the response"* `[03:45]`
- **Durabilidade é obrigatória:** a task sobrevive a queda de agente, servidor, rede e humano ausente `[05:33]` — ciclo de vida formal (working → input_required → completed/failed) `[18:14]`.
- V1 não escalava (list sem filtro = varrer milhões); V2 vira stateless e persistir task IDs é responsabilidade do client `[15:53]` `[18:49]`.

## 5 · Estande Deasy/Collibra: por que RAG de POC quebra em produção

- Com 40 arquivos funciona; com 80.000, *"I can't discover the files that I need, I don't know where the sensitive data is, I can't trust the quality"* `[00:32]`
- **O número pra gravar: 30% de arquivos ruins → até 80% do contexto contaminado.** *"If 30% of your files are stale or duplicative... up to 80% of your actual context your agent uses is filled with stale information"* `[13:24]`. **Limpar o corpus dobra o recall** `[14:15]` — independente do caso de uso.
- Verdade muda com o tempo: *"today a person says this, tomorrow a person says that — the truth changes over time"* `[12:06]` — manutenção contínua ou a base envelhece.
- Tag só vale entregue onde o agente consome (CSV/JSON, SDK ou de volta na fonte) `[00:35]`. E a dor universal: *"the non-technical people are the ones that need the data and they can never find it"* `[04:11]`

## 6 · Estande de knowledge graphs: o grafo como camada de conhecimento

- Grafo não é visualização: *"a layer on top of everything that you publish... and this layer operates your content"* `[00:28]` — com algoritmos (PageRank) rodando sobre os dados pra busca e ranking `[02:56]`.
- *"Tables are one data model, this is another — this is for relationships"* `[03:21]`. Casos: recomendação (Netflix), **resolução de identidade** (a mesma pessoa com nomes diferentes) `[07:35]`.
- Dá pra começar de graça (community edition/open source) `[09:09]`.

## 7 · MCP Apps: separe dados de UI ou o modelo para de pensar

- **Anti-padrão descoberto:** se o tool de busca já renderiza UI, o modelo faz UMA busca e para — *"oh, I guess the results are already displayed. I'm not going to do a deep dive"* `[02:21]`. Em texto puro ele faz 10-15 buscas e cruza tudo `[01:53]`.
- **A regra de ouro:** *"separate your data processing from your UI rendering"* `[02:45]` — busca é tool de texto; um render tool separado recebe só os IDs escolhidos `[03:56]`.
- *"Rendering is a side effect... a result of the model exploring the data"* `[06:46]`. Tools pequenos e componíveis > um tool gigante `[07:20]`.

---
**Íntegras (parciais, áudio de salão):** [[workshops-expo-2-completo]]
