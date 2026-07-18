# Mudanças do cérebro INEVITA

## v1.8.0 — 2026-07-17 · “um cérebro, vários agentes”
- **O cérebro não exige mais Claude Pro/Max:** Claude Code, Codex, Gemini CLI e Antigravity operam o mesmo cofre; quem não usa nenhum começa pelo caminho gratuito.
- **Agent Skills portáveis:** `.agents/skills` segue o padrão aberto e é gerado deterministicamente a partir das skills da casa; `AGENTS.md` e `GEMINI.md` adaptam a entrada sem duplicar o método.
- **Telemetria multiplataforma:** `ping.mjs` substitui a dependência de Bash, registra o runtime sem enviar conteúdo e preserva o opt-out.
- **Primeira vitória coerente:** a pessoa pergunta ao acervo com fonte e minutagem antes de entregar contexto próprio; os nomes de ferramenta ficam na instalação, não na promessa.

## v1.7.0 — 2026-07-16 · "o Vale primeiro"
- **O `/comecar` agora entrega o que você veio buscar, na hora**: o cérebro do Vale responde de primeira (com fonte e minutagem), sem entrevista, sem cadastro do teu negócio. Você levou duas coisas — o cérebro do Vale (pronto) e o cérebro do TEU negócio (nasce vazio) — e a comunicação agora deixa isso claro desde o oi.
- **O teu contexto entra quando VOCÊ quiser**: quando uma pergunta tocar o teu caso, o cérebro oferece o contraste ("te respondo genérico, ou me conta em 3 linhas e respondo pro TEU caso"). Nada de menu de dor genérica — o teu negócio nas tuas palavras, sempre.
- **Passe de acesso (opcional)**: quem instala pelo link da área Cérebro na INEVITA ganha um `.cerebro/member-id` (código opaco — não é nome nem e-mail) que liga a instalação ao teu acesso e **desliga os lembretes de ativação pra quem já ativou**. Fica só na tua máquina; desfazer = apagar o arquivo. Transparência no COMECE-AQUI.

## v1.6.2 — 2026-07-16 · "ninguém trava no meio"
- **`/comecar` sem pergunta aberta**: toda pergunta agora vem com opções numeradas (responde 1, 2, 3…), "não sei" é resposta válida (a IA assume o caminho provável e segue), uma pergunta por vez, e você pode parar quando quiser — o progresso fica salvo e o `/comecar` continua de onde parou.
- **Sem troca de ambiente no meio**: se a IA que te atende já lê a pasta (Claude/ChatGPT/Gemini, app ou desktop), ela conduz o onboarding ali mesmo — ninguém mais é mandado pro terminal no meio do caminho. O Claude Code segue sendo o modo turbo, não um pré-requisito.

## v1.6.1 — 2026-07-15
- **E-mail de resgate (opcional)**: o `/comecar` pergunta uma vez qual e-mail você usou pra resgatar o cérebro e guarda em `.cerebro/acesso-email` (só na tua máquina) — é como tua instalação fica ligada ao teu acesso e às futuras atualizações/benefícios. Não quer? É só não informar, ou apagar o arquivo.

## v1.6.0 — 2026-07-14 · "teu conhecimento vira visual"
- **Skill nova: `frameworks-visuais`** — transforma qualquer nota do teu cérebro num framework visual (Excalidraw dark e clean). Nota rica vira história em atos com pictogramas; conceito pontual usa arquétipos prontos (pipeline, curva, matriz, funil, pirâmide, ciclo, anatomia, contraste). É só pedir "gera um framework visual da nota X". Precisa do plugin Excalidraw no Obsidian (Community plugins).
- A skill **estrutura o que a nota diz, nunca inventa** — todo texto do canvas é rastreável à fonte.
- **Telemetria anônima de uso** (transparência total): o cérebro passa a mandar um ping quando você usa um comando — só um código aleatório desta instalação + nome do evento + versão + SO. **Nunca sai conteúdo, arquivo, nome ou e-mail.** Desligar: crie `.cerebro/sem-telemetria`. O código está aberto em `.claude/scripts/ping.sh`.

## v1.5.1 — 2026-07-09
- **Vocabulário v2 chegou na operação**: motor ancora em [harness], frescor em [context rot], perguntas-canário em [evals/golden patterns]; citação-bandeira do PayPal corrigida pro verbatim real ("competitive advantage"); estatística da Deasy agora com fonte e minutagem (demo no expo `[13:24]`).
- **Ponte 4 movimentos ↔ 5 verbos** no METODO.md e no `/metodo` (mesmo método, dois zooms).
- **`/reindex` ganhou o passo 50/50** (ensinar o sistema toda semana) e **`/atualizar` declara a portabilidade** (teu contexto em arquivo aberto, nunca refém).
- **Conserto do motor.manifest**: as 5 skills dos relógios, o GLOSSARIO e o METODO-COMPLETO agora chegam a todo mundo via atualização automática (antes, quem já tinha clonado não recebia).

## v1.5.0 — 2026-07-09
- **METODO-COMPLETO.md**: o método inteiro num documento só — fundamentos → mapa → ciclo → contrato → melhores práticas → resultados → pra onde vai. Condensado das palestras do AI Engineer World's Fair 2026, toda citação com fonte e minutagem. Comece por ele; o `/metodo` aplica.

## 1.4.0 — 2026-07-09 · "Expo completo — a trilha do contexto"
- **Expo vol. 3** (7 palestras inéditas + íntegras): WTF Is the Context Layer ("context is also IP"), Agent Memory vs Learning (promoção supervisionada, 7000→1000 chunks), AI in GTM at Notion (63% uplift, "own the context layer, rent everything else"), Prompt/Memory/Weights ("the model is the easy part"), LLM Knowledge Bases ("the daily paper but your own"), GTM Orchestration, Why We Killed Our Multi-Agent Pipeline — + ecos de 5 sessões parciais.
- **Resgates do expo**: workshop completo de product discovery (54 min, Mom Test na prática), a imersão numa big tech de pagamentos (context plugin: 91% menos erros), compound engineering (regra 50/50) e por que o Claude Code explodiu.
- `/reindex` agora entrega **o jornal da tua semana** (manchete, o que andou, o que travou, a pergunta aberta) — o entregável visível do ritual.
- `/guardar` com **freio de rótulos**: tag/tema novo só com tua aprovação (vocabulário sem freio vira ruído).
- METODO: **as 4 memórias** (trabalho/episódica/semântica/procedural — por que a estrutura é assim) e a **regra da mesa** (uma janela = um trabalho; o chat é mesa, não memória).

## 1.3.5 — 2026-07-08 (setup sem fricção — extraído da call de teste)
- COMECE-AQUI: bloco "o que você precisa / NÃO precisa" — mata o medo de API/chave (só precisa da conta Claude). Nasceu do Vini batendo no paywall do Groq no teste.
- Porta "explorar o acervo" do `/comecar` agora leva a um índice de topo real (`conhecimento/_INDICE.md`), não a catálogos espalhados — o corredor tinha 4 portas sem mapa.

## 1.3.4 — 2026-07-08 (armadilhas de material bruto)
- Regra da sequência no `/guardar` e no `/call`: a unidade de sentido é a PEÇA, não o arquivo — fragmento/CTA solto puxa os irmãos antes de julgar.
- `/call` blindado contra 4 armadilhas de transcrição automática: citação-refutação, número ambíguo, nome trocado pelo whisper, compromisso condicional.

## 1.3.3 — 2026-07-08 (bateria de QA com material real + glossário)
- `/call` em call longa (60+ min): oferece segunda passada — átomos principais + reserva de candidatos (a cauda tem ouro).
- `/call` detecta formato aula/live: rota dupla — átomos operacionais + destilado-nota no topo do bruto.
- `GLOSSARIO.md` novo: os 17 termos da casa, uma linha cada, com o termo do Vale que ancora. Termo novo só entra por lá.

## 1.3.2 — 2026-07-08 (fricções do teste real de onboarding)
- `/comecar` agora tem DUAS portas: montar teu contexto ou explorar o acervo primeiro (índice).
- A skill avisa logo de cara: cada resposta já vira contexto gravado (as perguntas são construção, não custo).
- Catálogos trancados mostram como entrar.
- COMECE-AQUI: aviso pra reabrir o Claude Code dentro da pasta (skills carregam na abertura).

## 1.3.1 — 2026-07-07
- `/metodo` agora ensina os relógios (dia/semana/mês) e a regra "guardar tudo ≠ dar tudo pra IA".
- `/comecar`: mínimo pra vitória explícito (dor + 1 fonte rica, ou 2 rasas) e roteamento pra `gente/`.

## 1.3.0 — 2026-07-07 · "O método ganhou relógios"
- **5 skills novas** — o ciclo completo: `/daily` (o dia em 10 min, memória quente), `/call` (reunião vira átomos em 48h), `/reindex` (o ritual da semana), `/revisar` (frescor mensal — nota morta se marca `superado`, nunca se deleta) e `/teste` (o Teste do Cérebro: tuas 5 perguntas-canário, evoluindo de **em branco → estagiário → sócio**).
- **O Mapa do Negócio** (`meu-negocio/mapa.md`): o negócio numa página + A métrica principal — o conselho nº 1 de quem constrói no Vale ("mapeamento + uma métrica resolve 90%"). O `/comecar` agora o preenche.
- **O eixo pessoa** (`meu-negocio/gente/`): uma página por cliente/parceiro/concorrente-chave — `/call` e `/daily` alimentam.
- **O eixo tempo** (`meu-negocio/dailies/`): rollup diário + resumo da semana (que nasce das dailies, nunca de reler tudo).
- **Frescor**: notas ganham `confirmado:` e `status: superado` — porque a verdade muda, e nota velha fingindo estar viva envenena resposta (30% de notas velhas ou duplicadas contaminam até 80% do contexto — demo da Deasy no expo `[13:24]`, que mediu: limpar dobrou o recall).
- METODO.md: os relógios (dia/semana/mês), quando tratar o quê, e a saúde do cérebro.

## 1.2.7 — 2026-07-07
- **Expo vol. 2**: GEPA — o sistema que otimiza o próprio contexto ("quanto melhor o modelo, mais vale o teu contexto"); Aiden, o agente que venceu o desafio da OpenAI ("o humano sobe na stack, não sai dela"); ACP — o padrão pra comandar agentes; MCP Tasks; Deasy ("30% de arquivos ruins contaminam 80% do contexto — limpar dobra o recall"); knowledge graphs; MCP Apps (separe dados de UI).

## 1.2.6 — 2026-07-07
- **Workshops do expo** (9 gravações de sala): skills como conhecimento executável, "Claude Beige"/anti-slop, "julgamento é o ativo caro", thinking in public (YC/PG), agent experience (Stripe/Metronome), sites generativos, design ops com agentes.
- **🗺️ O mapa da conversa do evento** — a síntese: as 6 camadas em volta do modelo (contexto, skills, agentes, curadoria, eficiência, pessoa).

## 1.2.5 — 2026-07-01
- +5 palestras do AI Experience: **Kyle Mistele** (Loop Engineering), **Dex Horthy** (Harness não basta), **Vaibhav Gupta** (Fighting slop), **Niels Rogge** (automatizar o próprio trabalho), **Kieran Klaassen** (Compound Engineering). Destilado + íntegra cada.

## 1.2.4 — 2026-06-30
- Mecanismo de atualização revisado (auto-update validado de ponta a ponta).

## 1.2.3 — 2026-06-30
- O método agora tem nome: **Engenharia de Contexto** (ancorado no termo do Karpathy/OpenAI) — na era da IA, o que vence não é o prompt, é o contexto certo.

## 1.2.2 — 2026-06-30
- `/comecar`: quando o site vem raso (SPA/Framer, o caso mais comum), pede proativamente uma **call ou anúncio** — fonte mais rica. Validado num teste real (viverdeia.ai).

## 1.2.1 — 2026-06-30
- `METODO.md` visível na raiz — o método (4 movimentos + átomo) virou documento legível, não só o que a IA usa por baixo.

## 1.2.0 — 2026-06-30
- **Atualização automática:** o cérebro se atualiza sozinho ao abrir (motor + conhecimento da comunidade) — teu contexto nunca é tocado.
- **Teu contexto começa vazio:** o `meu-negocio/` é template em branco; o `/comecar` preenche com o TEU negócio. O cérebro é só teu.

## 1.1.0 — 2026-06-30
- **O Método do Cérebro** (validado por pesquisa): os 4 movimentos — organizar por uso, capturar em átomos, conectar leve, buscar citando.
- **Átomo** como unidade: afirmação + citação literal + sentido + elos. A IA opera átomos citados, nunca o bruto (anti-alucinação).
- Onboarding (`/comecar`) entra **pela dor** e trata o que você já tem.
- Novas skills: `/metodo` (ensina) e `/guardar` (captura assistida em átomo).
- 4º horizonte: `meu-negocio/arquivo/`.

## 1.0.0 — 2026-06-29
- Primeira versão: onboarding por ingestão (`/comecar`), começando pelo teu site.
- Conhecimento do Vale embutido (PayPal, Geoffrey Moore) pra cruzar com o teu caso.
- Captura com proteção de PII (nada pessoal vai pro git).
- Atualização: `/atualizar` traz melhorias sem tocar no teu contexto.
