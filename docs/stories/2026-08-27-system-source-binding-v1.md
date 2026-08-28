# Story — System Source Binding V1

## Objetivo

Formalizar a relação privada entre um papel de Fonte exigido por um Sistema e um Source Contract
existente na instalação, permitindo reutilizar a mesma Fonte entre vários Sistemas sem duplicar
conector, credencial, conteúdo ou casa da verdade.

## Critérios de aceite

- [x] O binding liga exatamente `system_ref + system_version + role` a um `source_ref`.
- [x] Source Contract continua canônico e não é reescrito durante bind.
- [x] Um Source Contract pode atender vários Sistemas, cada um com binding e grant próprios.
- [x] `ready` exige Source Contract ativo, compatibilidade de modo, aprovação humana e Access Grant válido.
- [x] Papel ausente, versão divergente, Fonte incompatível, grant expirado/revogado ou escopo errado bloqueiam `ready`.
- [x] O plano lista apenas metadata e candidatos mecânicos; não finge compatibilidade semântica.
- [x] Binding, aprovação e grant permanecem privados e reference-only.
- [x] Schema, exemplo, CLI, validador integral e testes cobrem caminho feliz e falhas adversariais.

## Decisões

- Connector Binding resolve transporte e custódia; não prova que a Fonte serve a um papel.
- Source Contract descreve um recorte semântico reutilizável; não nasce de novo por Sistema.
- System Source Binding materializa a aresta local `papel → Fonte` sem carregar a Fonte.
- Access Grant continua sendo a autorização efetiva; binding não substitui ACL nem consentimento.
- `authorized_consumers` do Source Contract é uma allowlist estrutural opcional; vazio permite que
  grants decidam os consumidores, sem reescrever a Fonte a cada instalação.
- A mesma Fonte não tem limite artificial de consumidores. Ambiguidade só existe quando o mesmo
  Sistema possui mais de um binding para o mesmo papel.

## Evidência de validação

- `node scripts/test-system-source-binding-v1.mjs` — passou com reuso, falhas adversariais,
  ambiguidade, plano reference-only e bloqueio de traversal.
- `node scripts/test-install-system.mjs` — passou com pacote em `unbound`, dois papéis obrigatórios
  e zero bindings prontos antes do comissionamento.
- `node scripts/test-install-system-grant.mjs` — passou fora do sandbox local, usando apenas
  loopback para o Registry fake.
- `node scripts/protocol-validate.mjs system-source protocol/examples/system-source-binding.v1.json`
  — passou.
- `npm test` — passou com 22 envelopes, 3 Sistemas e 33 Skills.
- Regressão completa: todas as suítes da entrega passaram. Duas suítes legadas de workspace
  continuam vermelhas porque a UI anterior renomeou `Visão geral` para `Sobre` sem atualizar as
  expectativas; achado estacionado fora desta mesa.

## File List

- `docs/stories/2026-08-27-system-source-binding-v1.md`
- `protocol/system-source-binding.schema.json`
- `protocol/examples/system-source-binding.v1.json`
- `scripts/lib/system-source-binding.mjs`
- `scripts/system-source-binding.mjs`
- `scripts/test-system-source-binding-v1.mjs`
- `scripts/protocol-validate.mjs`
- `scripts/validate-product.mjs`
- `protocol/README.md`
- `CHANGELOG.md`
