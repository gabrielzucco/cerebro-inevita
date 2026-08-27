# Story — Company Brain experience finish V1

## Contexto

O Launcher passou por duas leituras extremas: primeiro transformou função empresarial em decoração
colorida; depois removeu a cor sem recuperar hierarquia. O resultado atual comprime quatro Sistemas
por linha e corta nome e resultado — justamente o que o membro precisa reconhecer antes de abrir.

A página Cérebro também tenta explicar a empresa inteira como relatório técnico. Ela repete os KPIs
da operação, lista as 15 Fontes que já possuem superfície própria, enterra os quatro conceitos-âncora
e não oferece a visão do grafo inteiro pedida pelo founder. Este corte recupera a sobriedade da
primeira versão do Company Brain e preserva os ganhos posteriores: categorias empresariais, busca,
dono operacional, aplicação externa, workspace deduplicado e Canvas lazy.

## Acceptance criteria

- [ ] O Launcher usa a primeira versão sóbria como baseline: uma superfície, uma borda e nenhuma
      cor de categoria aplicada à casca.
- [ ] A grade mostra no máximo três Sistemas por linha no desktop corrente, sem cortar o nome e sem
      transformar o resultado em fragmento ilegível.
- [ ] Cada card preserva categoria empresarial, status, dono operacional, prontidão, último Run,
      Fontes e as duas portas constitucionais (`Inspecionar` e aplicação própria quando existir).
- [ ] Ausência de imagem, publisher ou julgador continua explícita; o monograma é apenas fallback de
      identidade, nunca branding inventado.
- [ ] A página Cérebro não repete o resumo operacional de `Hoje` nem a tabela completa de `Fontes`.
- [ ] Exatamente os quatro conceitos-âncora reais orientam a primeira leitura; decisões recentes
      permanecem disponíveis sem competir com eles.
- [ ] Atenção, recuperação, Context Snapshot, execução, julgamento e aprendizado formam um fluxo
      legível com contagens observadas e declaradas já presentes no read model.
- [ ] O Cérebro mostra uma visão leve do grafo inteiro derivada de `/api/graphs/brain`, e o mapa
      interativo completo continua no Canvas lazy — sem criar outra casa da verdade.
- [ ] Saúde e governança aparecem como orientação compacta e apontam para as superfícies donas dos
      detalhes, em vez de despejar tarefas internas no Cérebro.
- [ ] Desktop e mobile preservam foco, leitura e ausência de overflow horizontal.
- [ ] Replay/trace e carregamento lazy do Canvas continuam funcionando como no corte anterior.
- [ ] Testes estruturais novos cobrem a arquitetura da página e a suíte existente permanece verde.

## Fora deste corte

- Experience Manifest, Release Manifest, Runtime Binding genérico ou Brain SDK.
- Upload de branding, publisher, criador ou responsável por julgamento sem contrato próprio.
- Mudar Source Contract, System Contract, Run Record ou Judgment Receipt.
- Substituir o Canvas G6 ou carregar seu bundle pesado dentro da página Cérebro.
- Reexecutar Sistemas a partir do replay visual de trace.

## File List

- `docs/stories/2026-08-27-company-brain-experience-finish-v1.md`
- `docs/design-reviews/2026-08-27-company-brain-experience-v1.md`
- `console/app.js`
- `console/styles.css`
- `scripts/test-company-brain-experience-finish-v1.mjs`

## Verificação

- `node --check console/app.js`
- `node scripts/test-company-brain-experience-finish-v1.mjs`
- `node scripts/test-company-brain-product-cut-v1.mjs`
- `node scripts/test-system-workspace-dedup-v1.mjs`
- `node scripts/test-console-server.mjs`
- `npm test`
- QA visual real em `http://127.0.0.1:4782`, desktop e mobile.

