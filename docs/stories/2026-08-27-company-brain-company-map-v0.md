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

- [ ] `Mapa da empresa` e `Anatomia atual` podem ser comparados na mesma página sem duplicar rotas.
- [ ] O modo novo abre por padrão e a preferência de comparação permanece apenas nesta máquina.
- [ ] O mapa usa casas reais do Cérebro e funções empresariais reconhecíveis, nunca os clusters
      internos `crescimento`, `fundacao` e `produto-comunidade`.
- [ ] Negócio, Mercado, Marketing, Produto & Entrega, Comunidade e Operação & Tecnologia mostram
      objetos reais com contagem e última mudança, sem abrir conteúdo privado ou PII.
- [ ] A busca filtra somente o mapa já carregado; a interface não finge pergunta sem endpoint de
      retrieval ligado ao produto.
- [ ] Fontes aparecem como panorama de origem, autoridade e observação, com porta para a superfície
      dona da configuração.
- [ ] `Precisa de cuidado` contém somente saúde da memória: lacunas, Fonte nunca observada,
      destilação pendente ou conflito — nunca tarefas do ClickUp.
- [ ] Dailies aparecem como rotina de captura de mudança e decisão, não como gerenciador de tarefa.
- [ ] O método fica legível como fluxo de estado `Fonte → Bruto → Processado → Destilado → Contexto
      vigente → Sistema → Julgamento → Aprendizado`, sem sugerir que contagens distintas são funil.
- [ ] Sistemas permanecem no Launcher; no Cérebro aparecem apenas como consumidores e produtores de
      contexto.
- [ ] O grafo inteiro continua disponível no Canvas e não é carregado pelo modo novo.
- [ ] Desktop e mobile ficam sem overflow, sem mosaico genérico de cards e sem nova carga pesada.
- [ ] Teste estrutural novo cobre o modo comparável; testes da Anatomia atual continuam verdes.

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

- Pendente.
