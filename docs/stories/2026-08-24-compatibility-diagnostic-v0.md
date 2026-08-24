# Story — Compatibility Diagnostic V0

## Contexto

O Company Brain já possui contratos de Fonte e Sistema, recuperação V2, Context Snapshot, Runs,
rotinas, julgamento, experimentos, handoffs e Canvas. A instalação, porém, ainda não possui uma
identidade protocolar completa nem uma leitura única que responda se uma pasta está começando do
zero, apenas organiza contexto, contém um cérebro parcial ou já é compatível com os Sistemas da
INEVITA.

Este corte cria o Brain Manifest V1 e um diagnóstico determinístico, local e somente leitura. O
diagnóstico deriva evidências dos arquivos existentes; não abre conteúdo bruto, não conecta Fontes,
não migra nada e não transforma presença de pastas em execução observada.

## Decisões congeladas

- O Manifest identifica protocolo, perfil, referências e capacidades; não duplica o inventário de
  Fontes, Sistemas, Runs ou bindings.
- Identidade da instalação continua em `.cerebro/id`; o Manifest guarda apenas `identity_ref`.
- O scanner olha somente marcadores técnicos e envelopes canônicos. Conteúdo humano não é lido.
- Compatibilidade e maturidade são dimensões diferentes: uma instalação pode ser compatível com o
  protocolo e ainda não ter Fonte, Sistema ou Run real.
- O score é a razão transparente entre checks atendidos e aplicáveis; não é avaliação subjetiva.
- Migração permanece `preview → diff → confirmação`; este corte não escreve no cérebro analisado.
- O Canvas continua como superfície operacional. Compatibilidade entra antes dele no onboarding.

## Acceptance criteria

- [x] Brain Manifest V1 possui schema fechado, exemplo válido e manifesto canônico no produto e no
      starter.
- [x] Manifest aponta para versão, identidade, layout, entrypoints, runtime, privacidade e envelopes
      suportados sem listar objetos operacionais.
- [x] Referências técnicas do Manifest precisam existir como arquivos reais; identidade ausente só
      é permitida no starter ainda não ativado.
- [x] Scanner classifica `new`, `organized-context`, `partial-brain` ou `inevita-compatible`.
- [x] Scanner retorna checks com estado, razão e referências, além de `preserve`, `adapt`, `add` e
      `do_not_touch`.
- [x] Presença de contrato conta como declarado; somente recibo/Run válido conta como observado.
- [x] Scanner não lê arquivos de conteúdo e não altera o alvo analisado.
- [x] Console expõe o diagnóstico no read model e numa tela `Compatibilidade` sem conteúdo privado.
- [x] Starter aparece compatível com o protocolo, porém ainda não operacional.
- [x] Cérebro interno legado é reconhecido sem duplicação e mostra explicitamente o gap de Manifest.
- [x] Testes unitários, integração do Console, validação de produto e build passam.

## Tarefas

- [x] Protocolo e manifestos
- [x] Scanner e CLI read-only
- [x] Read model e Console
- [x] Testes e dogfood
- [x] Documentação e recibo

## Evidências

- Produto local: `inevita-compatible`, estágio `contracted`, 2 System Contracts declarados e
  nenhum Run local fabricado.
- Starter: Manifest V1 válido, classificado como compatível e `foundation`; zero Fontes, Sistemas
  prontos ou Runs até a ativação real.
- Cérebro interno legado: `partial-brain`, estágio `operational`, 13 Fontes, 14 Sistemas com
  Retrieval V2, 2 Runs com Context Snapshot e somente Funil + Calls prontos para trabalhar.
- Scanner provado contra quatro rotas de entrada e fixture com arquivo humano sem permissão de
  leitura; o diagnóstico permaneceu somente técnico e não mutou o alvo.
- Manifest `full` com `.cerebro/id` ausente agora regride para `partial-brain`; starter pode seguir
  compatível em `foundation` com identidade ainda `unassigned` até a ativação local.
- QA em Chromium local a 1280 px: nove checks, zero overflow horizontal, navegação de volta ao
  Canvas preservada e referências extensas compactadas sem perder a prova no read model.
- Suíte completa passou, incluindo protocolo, starter, Compatibility Doctor e integração do
  Console com sessão/CSRF.

## File List

- `docs/stories/2026-08-24-compatibility-diagnostic-v0.md`
- `.cerebro/manifest.json`
- `profiles/company-brain-starter-en/.cerebro/manifest.json`
- `protocol/brain-manifest.schema.json`
- `protocol/examples/brain-manifest.v1.json`
- `protocol/README.md`
- `scripts/lib/compatibility-diagnostic.mjs`
- `scripts/compatibility-diagnostic.mjs`
- `scripts/lib/console-read-model.mjs`
- `scripts/protocol-validate.mjs`
- `scripts/validate-product.mjs`
- `scripts/test-compatibility-diagnostic.mjs`
- `scripts/test-console-server.mjs`
- `console/index.html`
- `console/app.js`
- `console/styles.css`
- `package.json`
