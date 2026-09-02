# Story — Canvas de execução legível

## Contexto

O Run real `analisar funil · EXP-007 · Replay` abre com todos os nós reduzidos a miniaturas: a cadeia fica dividida nas extremidades do viewport e o centro permanece vazio. O comando “Ver mapa inteiro” privilegia conter toda a extensão das arestas, mas destrói a legibilidade do fluxo.

## Objetivo

Abrir e reenquadrar o Canvas de execução em uma escala operacional legível, mantendo o restante do grafo acessível por pan e zoom.

## Critérios de aceitação

- [x] A execução abre com o fluxo principal visível e os rótulos dos nós legíveis em desktop.
- [x] O reenquadramento respeita um zoom mínimo específico para execução; nunca reduz o grafo a miniaturas.
- [x] Quando o grafo ultrapassa o viewport, o foco prioriza a capacidade executada e mantém o restante acessível por pan/zoom.
- [x] O comportamento de Cérebro e Sistema não regride.
- [x] Existe teste automatizado para a política de enquadramento legível.
- [x] Build, validação de produto e teste do Console passam.

## Tarefas

- [x] Isolar a política de zoom/foco do Canvas.
- [x] Aplicar a política na abertura e no botão de reenquadramento.
- [x] Validar no Run real `EXP-007` e registrar evidência visual.

## Evidência

- Run real validado: `analisar funil · EXP-007 · Replay`.
- 21 nós renderizados dentro do painel após “Ver mapa inteiro”.
- Menor largura observada no viewport de 1536 px: 138 px.
- Console do navegador: sem erros.

## File List

- `docs/stories/2026-08-24-run-canvas-readable-layout.md`
- `console/canvas.js`
- `console/canvas-layout-policy.js`
- `console/canvas.bundle.js`
- `scripts/test-canvas-layout-readability.mjs`
- `scripts/validate-product.mjs`
