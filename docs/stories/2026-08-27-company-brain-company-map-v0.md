# Story — Company Brain: Mapa vivo da empresa V0

## Contexto

A página `Cérebro` atual tenta explicar a empresa por conceitos-âncora, topologia de Sistemas e
Fontes e um fluxo abstrato de contexto. O founder não reconhece a empresa nessa leitura: o grafo
repete o Canvas, as áreas são técnicas e a página não responde onde vivem ofertas, decisões,
founders, produção, Ads, comunidade, operação, projetos, Sistemas, Skills e dados de terceiros.

Este corte cria uma alternativa comparável sem apagar a versão atual. O Cérebro passa a testar a
tese de **mapa vivo da empresa**: aquilo que a empresa sabe, de onde vem e quais rotinas mantêm esse
contexto vivo. Tarefa operacional continua no ClickUp; somente cuidado da memória aparece aqui.

## Acceptance criteria

- [x] `Mapa da empresa` e `Anatomia atual` podem ser comparados na mesma página sem duplicar rotas.
- [x] O modo novo abre por padrão e a preferência de comparação permanece apenas nesta máquina.
- [x] O mapa usa casas reais do Cérebro e funções empresariais reconhecíveis, nunca os clusters
      internos `crescimento`, `fundacao` e `produto-comunidade`.
- [x] Estratégia & Negócio, Marketing & Vendas, Produto & Entrega, Comunidade, Pesquisa & Referências
      e Operação & Tecnologia mostram objetos reais com contagem e última mudança, sem abrir
      conteúdo privado ou PII.
- [x] A busca filtra somente o mapa já carregado; a interface não finge pergunta sem endpoint de
      retrieval ligado ao produto.
- [x] Fontes aparecem como panorama de origem, autoridade e observação, com porta para a superfície
      dona da configuração.
- [x] `Precisa de cuidado` contém somente saúde da memória: lacunas, Fonte nunca observada,
      destilação pendente ou conflito — nunca tarefas do ClickUp.
- [x] Dailies aparecem como rotina de captura de mudança e decisão, não como gerenciador de tarefa.
- [x] O método fica legível como fluxo de estado `Fonte → Bruto → Processado → Destilado → Contexto
      vigente → Sistema → Julgamento → Aprendizado`, sem sugerir que contagens distintas são funil.
- [x] Sistemas permanecem no Launcher; no Cérebro aparecem apenas como consumidores e produtores de
      contexto.
- [x] O grafo inteiro continua disponível no Canvas e não é carregado pelo modo novo.
- [x] Desktop e mobile ficam sem overflow, sem mosaico genérico de cards e sem nova carga pesada.
- [x] Teste estrutural novo cobre o modo comparável; testes da Anatomia atual continuam verdes.

## Fora deste corte

- Responder perguntas com modelo ou conectar o retrieval canônico ao Console.
- Criar Company Map Contract ou congelar schema de domínios e objetos.
- Ler, indexar ou exibir conteúdo de `02-dados-terceiros/`; somente metadados agregados locais.
- Substituir ClickUp, Fontes/Governança, Launcher, Canvas ou Caixa de Julgamento.
- Criar tarefas, conectar nova Fonte ou executar Sistema a partir do mapa.

## File List

- `docs/stories/2026-08-27-company-brain-company-map-v0.md`
- `docs/design-reviews/2026-08-27-company-brain-company-map-v0.md`
- `scripts/console-server.mjs`
- `console/app.js`
- `console/styles.css`
- `scripts/test-company-brain-company-map-v0.mjs`

## Verificação

- Comparação manual: o seletor alterna os dois modos na mesma rota e a Anatomia só busca o grafo
  quando é aberta.
- Mapa real: 31 objetos em seis domínios, 17 Sistemas, 15 experimentos, 15 Fontes e duas rotinas.
- Busca manual por `Ads`: dois objetos filtrados em Marketing & Vendas; nenhuma chamada a modelo.
- Mobile `375 × 812`: `scrollWidth 360` para `innerWidth 375`; navegação recolhida sem texto vazando.
- Leitura do mapa no servidor local: aproximadamente 37 ms sobre o vault atual.
- `node scripts/test-company-brain-company-map-v0.mjs` — verde.
- `node scripts/test-company-brain-orientation-v1.mjs` — verde.
- `node scripts/test-company-brain-launcher-hierarchy-v1.mjs` — verde.
- `node scripts/test-company-brain-product-cut-v1.mjs` — verde.
- `node scripts/test-system-workspace-dedup-v1.mjs` — verde.
- `node scripts/test-canvas-layout-readability.mjs` — verde.
- `node scripts/test-console-server.mjs` — verde.
- `npm test` — verde: 19 envelopes, três Sistemas e 33 arquivos de Skills sincronizados.
- O projeto não declara scripts `lint` ou `typecheck` no `package.json`.
