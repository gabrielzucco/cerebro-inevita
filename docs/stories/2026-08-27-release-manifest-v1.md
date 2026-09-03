# Story — Release Manifest V1

## Objetivo

Separar a versão distribuível e o gate de publicação da promessa operacional do Sistema, congelando um Release Manifest V1 lido pela Society e pelo instalador reais.

## Critérios de aceite

- [x] Release Manifest V1 é um envelope fechado e validado por schema e código.
- [x] O envelope declara somente versão, compatibilidade, contratos, publicação, validação e privacidade.
- [x] Resultado, Fontes, pipeline, permissões e eval permanecem no System Contract.
- [x] Publisher, marca e superfície permanecem no Experience Manifest opcional.
- [x] Host, URL, workspace e credenciais permanecem no Runtime Binding privado.
- [x] O pacote piloto publica `release.json` e `contract.json` válidos e coerentes entre si.
- [x] A Society prefere os contratos novos e mantém fallback explícito para pacote legado.
- [x] O instalador valida os contratos novos quando presentes e não quebra pacote remoto legado.
- [x] Visibilidade `validated` não pode existir sem publicação e gates quantitativos cumpridos.

## Tarefas

- [x] Criar schema, validator e testes do Release Manifest V1.
- [x] Publicar System Contract e Release Manifest do Briefing Comercial Inteligente.
- [x] Adaptar read model da Society e instalador.
- [x] Atualizar documentação e validação integral.
- [x] Rodar regressões e registrar recibo.

## Evidência de validação

- `node scripts/test-release-manifest-v1.mjs` — passou, incluindo envelope fechado, refs seguras e promoção falsa bloqueada.
- `node scripts/test-society-catalog-v0.mjs` — passou com Release V1 preferido e fallback legado explícito.
- `node scripts/test-install-system.mjs` — passou com `release.json` e `contract.json` instalados e privados preservados.
- `node scripts/test-system-protocol.mjs` e `node scripts/test-experience-manifest-v1.mjs` — passaram.
- `node scripts/test-console-server.mjs` — passou.
- `node scripts/validate-product.mjs` — passou: 21 envelopes, 3 Sistemas e 33 arquivos de Skills.
- QA em `http://127.0.0.1:4782/` confirmou Release `briefing-comercial-inteligente-v0-1-1`, System Contract e duas Fontes na ficha, sem erro de console.

## Fora do V1

- Registry remoto e assinatura criptográfica do pacote.
- Migração de releases em voo.
- Rollback automático e resolução de dependências.
- Preço, licença, billing e entitlement comercial.
- Tema visual ou upload de assets.

## File List

- `docs/stories/2026-08-27-release-manifest-v1.md`
- `protocol/release-manifest.schema.json`
- `scripts/lib/release-manifest.mjs`
- `scripts/test-release-manifest-v1.mjs`
- `comunidade/inevita/sistemas-disponiveis/briefing-comercial-inteligente/release.json`
- `comunidade/inevita/sistemas-disponiveis/briefing-comercial-inteligente/contract.json`
- `scripts/lib/society-catalog-read-model.mjs`
- `scripts/test-society-catalog-v0.mjs`
- `scripts/install-system.mjs`
- `scripts/test-install-system.mjs`
- `scripts/validate-product.mjs`
- `protocol/README.md`
