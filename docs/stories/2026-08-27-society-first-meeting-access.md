# Story — Society First Meeting Access

## Objetivo

Deixar a prateleira da Society pronta para o primeiro encontro com capacidades reais da INEVITA,
sem promover pilotos a Sistemas validados e sem prometer instalação pública automática.

## Critérios de aceite

- [x] Briefing Comercial, Calls em Decisões, Radar de Voz e Leitura Diária do Funil aparecem no catálogo.
- [x] Os quatro itens comunicam acesso da Society por implantação assistida.
- [x] Cada item novo publica Manifest, Release, System Contract e Capability Contract válidos.
- [x] Fontes são declaradas por papel semântico e não por IDs privados da INEVITA.
- [x] A página distingue acesso antecipado de validação concluída.
- [x] Nenhuma fonte, output, prompt, segredo ou dado privado entra nos pacotes.
- [x] Testes focados e validação do produto passam.

## Tarefas

- [x] Publicar os três pacotes adicionais no laboratório da Society.
- [x] Ajustar a linguagem da prateleira para acesso de membros.
- [x] Cobrir o inventário e a promessa de acesso em teste.
- [x] Validar o catálogo e registrar evidências.

## Evidência de validação

- `node scripts/test-society-catalog-v0.mjs` — passou com 4 capacidades visíveis.
- `node scripts/test-release-manifest-v1.mjs` — passou.
- `node scripts/test-install-system.mjs` — passou nos quatro pacotes, incluindo Source Bindings e preservação de privados.
- `node scripts/test-console-server.mjs` — passou com endpoint autenticado e os quatro IDs publicados.
- `node scripts/test-install-system-grant.mjs` — passou.
- `node scripts/validate-product.mjs` — passou: 22 envelopes, 3 Sistemas e 33 arquivos de Skills.
- `node --check console/app.js` — passou.
- `git diff --check` — passou.

## File List

- `docs/stories/2026-08-27-society-first-meeting-access.md`
- `console/app.js`
- `scripts/test-society-catalog-v0.mjs`
- `scripts/test-console-server.mjs`
- `scripts/test-install-system.mjs`
- `comunidade/inevita/_CATALOGO.md`
- `comunidade/inevita/sistemas-disponiveis/briefing-comercial-inteligente/manifest.json`
- `comunidade/inevita/sistemas-disponiveis/briefing-comercial-inteligente/release.json`
- `comunidade/inevita/sistemas-disponiveis/calls-decisoes/`
- `comunidade/inevita/sistemas-disponiveis/radar-de-voz/`
- `comunidade/inevita/sistemas-disponiveis/leitura-diaria-funil/`
