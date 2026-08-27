# Story — Society Local Catalog V0

## Objetivo

Transformar a Society do Cockpit em um catálogo local, legível e honesto dos Sistemas publicados pela rede, com ficha pré-instalação e sem confundir pacote em validação com Sistema validado.

## Critérios de aceite

- [x] A Society lê apenas pacotes reais em `comunidade/inevita/sistemas-disponiveis/`.
- [x] Sistemas validados e Sistemas em validação aparecem como estados distintos.
- [x] A ficha mostra resultado, primeiro valor, requisitos, privacidade, permissões e prova de validação.
- [x] O estado de instalação usa igualdade exata do `system_id`, sem inferência por nome.
- [x] O pacote piloto não oferece instalação pública: o CTA comunica acesso por seleção.
- [x] Experience Manifest é consumido quando publicado e cai em identidade neutra quando ausente.
- [x] Nenhum conteúdo privado, telemetria bruta, prompt, output ou fonte é enviado ao navegador.
- [x] Busca, filtros e navegação card → ficha → catálogo funcionam no navegador.
- [x] O Catálogo V0 não cria Registry remoto, avaliações, cobrança, criadores fictícios ou instalação simulada.

## Tarefas

- [x] Criar read model local e testes.
- [x] Expor endpoint autenticado `/api/society`.
- [x] Construir prateleira e ficha pré-instalação no Cockpit.
- [x] Validar a experiência navegável e o corte de privacidade.
- [x] Atualizar validação do produto e recibo da mesa.

## Evidência de validação

- `node scripts/test-society-catalog-v0.mjs` — passou.
- `node scripts/test-console-server.mjs` — passou com endpoint autenticado e privacidade reference-only.
- `node scripts/validate-product.mjs` — passou: 21 envelopes, 3 Sistemas e 33 arquivos de Skills.
- `node --check console/app.js` e `node --check scripts/lib/society-catalog-read-model.mjs` — passaram.
- QA em `http://127.0.0.1:4782/` — filtros, busca, ficha, retorno e CTA desabilitado verificados; zero erro de console.
- Viewport `375x812` — `scrollWidth === innerWidth`, sem overflow horizontal.
- O projeto não declara scripts `lint` ou `typecheck`; `npm run lint` e `npm run typecheck` não existem.

## Fora do V0

- Registry remoto e sincronização de catálogo.
- Instalação mutante dentro do Cockpit.
- Página pública na web da Society.
- Avaliações, preço, ranking, comentários e benchmarks comparativos.
- Imagem de capa, criador e responsável por julgamento sem contrato publicado.
- Evolução formal de Release Manifest e System Contract.

## File List

- `docs/stories/2026-08-27-society-local-catalog-v0.md`
- `scripts/lib/society-catalog-read-model.mjs`
- `scripts/test-society-catalog-v0.mjs`
- `scripts/console-server.mjs`
- `scripts/test-console-server.mjs`
- `console/app.js`
- `console/styles.css`
- `scripts/validate-product.mjs`
- `comunidade/inevita/sistemas-disponiveis/briefing-comercial-inteligente/manifest.json`
