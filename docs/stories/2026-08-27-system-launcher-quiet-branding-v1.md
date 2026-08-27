# Story — System Launcher quiet branding V1

## Contexto

O Launcher transformou o slot de identidade dos Sistemas em decoração dominante: cada card ganhou
gradiente, filete vertical e bordas coloridas. Isso compete com o conteúdo, fragmenta a casca do
Cockpit e faz categoria parecer branding.

O Company Brain continua dono da superfície. A personalidade de cada Sistema aparece na aplicação
própria e, no Launcher, somente por um asset real fornecido pelo criador. Enquanto esse asset não
existe no contrato, a interface usa um monograma neutro e não inventa marca.

## Acceptance criteria

- [x] Todos os cards compartilham a mesma superfície, borda, raio e comportamento de hover.
- [x] Nenhum card usa gradiente, filete lateral ou borda colorida por categoria.
- [x] Vendas, Marketing e demais funções aparecem apenas como metadado discreto.
- [x] O slot de identidade permanece pronto para receber imagem ou marca real, mas usa monograma
      neutro enquanto o contrato não declara um asset.
- [x] `Abrir` e `Inspecionar` usam a mesma gramática constitucional; cor de categoria não vira CTA.
- [x] O Launcher preserva leitura compacta, foco visível e funcionamento em desktop e mobile.

## Fora deste corte

- Campo de upload, Experience Manifest ou schema de branding.
- Publisher, foto do criador ou julgador sem referência contratual.
- Redesign do workspace interno do Sistema.
- Redesign da página Cérebro, Canvas ou Society.

## File List

- `docs/stories/2026-08-27-system-launcher-quiet-branding-v1.md`
- `console/styles.css`

## Verificação

- `node scripts/test-company-brain-product-cut-v1.mjs`
- `node scripts/test-system-launcher-workspace.mjs`
- `npm test`
- QA visual no Company Brain real em `http://127.0.0.1:4782`, desktop e mobile.

Resultado: testes estruturais e `npm test` verdes. QA real em 1440×1000 e 375×812 confirmou
superfície e borda idênticas nos cards, categoria em texto neutro, ausência de filete/gradiente,
filtro Marketing retornando os três Sistemas corretos, zero erro de console e zero overflow móvel.
