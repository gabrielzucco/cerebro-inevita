# Story — Launcher e workspace constitucional dos Sistemas

## Contexto

O Company Brain Console já possui catálogo de Sistemas, workspace por `system_ref`, Canvas nas
escalas Cérebro/Sistema/Run, Runs Explorer, Julgamento e Governança. A Golden Journey do GTM não
autoriza uma segunda casca de produto: o frontend especializado abre como aplicação própria;
o Console mantém somente a projeção operacional e governada daquela instalação.

O corte transforma a lista atual em Launcher e re-hospeda no design system existente a
arquitetura de informação validada no protótipo: duas portas (`Abrir aplicação` e
`Inspecionar operação`), cinco superfícies constitucionais e três leituras do backend do Sistema.
Nenhuma métrica pode ser inventada, e abrir ou inspecionar nunca executa modelo.

## Acceptance criteria

- [x] `Sistemas` é destino próprio da navegação principal, preservando `Estrutura` para Áreas,
      Fontes e Experimentos.
- [x] O Launcher agrupa Sistemas pela Área e mostra somente dados derivados do read model:
      identidade, estágio, versão, Fontes, Runs, pendências de julgamento e última execução.
- [x] Cada Sistema oferece duas ações distintas:
      - `Abrir aplicação`, somente quando existe `interface_ref`, em navegação externa segura;
      - `Inspecionar operação`, que abre o workspace local sem executar modelo.
- [x] O workspace usa a casca, os tokens e a gramática visual atuais do Console; a cor de Sistema
      identifica o objeto, não substitui a marca nem recolore a casca.
- [x] O workspace possui exatamente as superfícies `Visão geral`, `Canvas`, `Execuções`,
      `Julgamento` e `Governança`.
- [x] `Canvas` possui três leituras derivadas de dados reais:
      `Contrato`, `Estado atual` e `Último Run`; cada uma permite abrir a escala correspondente
      no Canvas completo sem copiar conteúdo privado.
- [x] `Visão geral` separa métricas de Operação, Contexto, Confiança e Valor. Ausência de prova
      aparece como `não medido`, `não julgado` ou `sem prova`, nunca como zero otimista.
- [x] Execuções, Julgamento e Governança reutilizam os dados e handlers existentes filtrados pelo
      `system_ref`; não nasce ledger, cache ou casa de verdade nova.
- [x] O layout permanece legível em desktop e mobile, com foco visível e ações acessíveis por
      teclado.
- [x] Teste estrutural impede regressão para card inteiro clicável sem as duas ações, abas antigas
      ou métricas misturadas.

## Fora deste corte

- Experience Manifest, Release Manifest, Runtime Binding genérico ou Brain SDK.
- Instalar, atualizar, reverter ou desinstalar Sistemas.
- Embutir o frontend do GTM dentro do Console.
- Alterar System Contract, Run Record, Judgment Receipt, Canvas engine ou API do workspace.
- Publicar o Console, o GTM ou qualquer dado na Society.

## File List

- `docs/stories/2026-08-26-systems-launcher-workspace-v0.md`
- `console/index.html`
- `console/app.js`
- `console/styles.css`
- `scripts/test-system-launcher-workspace.mjs`
- `scripts/validate-product.mjs`

## Verificação

- `node --check console/app.js`
- `node scripts/test-system-launcher-workspace.mjs`
- `node scripts/test-console-server.mjs`
- `node scripts/test-canvas-layout-readability.mjs`
- `npm test`
- Revisão visual no Console real em desktop e viewport mobile: duas portas visíveis, cinco
  superfícies, três modos do Canvas, zero overflow horizontal e zero erro no navegador.
- O pacote não declara scripts de lint ou typecheck; `npm run` foi conferido e lista somente
  `build:console` e `diagnose` além de `test`.
