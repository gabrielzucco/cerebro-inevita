# Story — Company Brain Product Polish V1

## Contexto

O Cockpit já reúne a verdade local do Cérebro, mas as páginas `Hoje`, `Cérebro`,
`Sistemas` e `Skills` colocam explicação, estado operacional e prova técnica na mesma
camada. O resultado é correto, porém cansativo de escanear e pouco claro para alguém
que não construiu o protocolo.

## Objetivo

Fazer a primeira camada responder, em poucos segundos, o que existe, o que está pronto
e qual é a próxima ação. Detalhes constitucionais continuam acessíveis em subpáginas,
drawers e inspetores.

## Acceptance criteria

- [x] `Hoje` prioriza poucas decisões e rotinas; o restante começa recolhido.
- [x] A visão geral do `Cérebro` explica que capacidades nativas já vêm instaladas e
      são consumidas por Sistemas, sem exigir comando manual.
- [x] Cada capacidade mostra apenas estado, promessa, uma prova curta e uma porta para
      a superfície dona dos detalhes.
- [x] `Skills` usa catálogo compacto; descrição completa e referências técnicas ficam
      no inspetor.
- [x] `Sistemas` abre com ativos primeiro e permite filtrar por estágio sem esconder os
      demais Sistemas do Cérebro.
- [x] A primeira aba do workspace de Sistema funciona como apresentação do Sistema antes
      dos números operacionais.
- [x] Testes, lint sintático e QA visual não regridem.

## Decisões estacionadas

- Área responsável `Marketing`: exige migração explícita dos três System Contracts hoje
  classificados como `commercial + marketing`; não será inferida por nome.
- Origem do Sistema (`nativo do Cérebro`, `da empresa`, `da Society/terceiro`): precisa
  de proveniência de instalação canônica. Publisher e estágio de instalação não substituem
  essa dimensão.
- Imagem e screenshot do Sistema: só entram quando declarados por Experience Manifest ou
  artefato de catálogo; o Console não inventa mídia.

## File List

- `console/app.js`
- `console/index.html`
- `console/styles.css`
- `scripts/test-company-brain-product-polish-v1.mjs`
- `scripts/test-company-brain-product-cut-v1.mjs`
- `scripts/test-company-brain-launcher-hierarchy-v1.mjs`
- `scripts/validate-product.mjs`
- `docs/design-reviews/2026-08-27-company-brain-product-polish-baseline.md`
- `docs/stories/2026-08-27-company-brain-product-polish-v1.md`
