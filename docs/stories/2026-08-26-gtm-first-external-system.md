# Story — GTM como primeiro Sistema com aplicação própria

## Contexto

O `next-best-gtm` v1.4.3 já existe em produção local: motor canônico, política versionada,
ledger de recomendações/feedback e frontend privado em `~/.inevita/gtm-dashboard`. O Console não
deve reconstruir esse produto nem importar sua fila. Ele deve registrá-lo como Sistema instalado,
abrir sua interface própria e projetar somente contrato, prontidão, Fontes, Runs e confiança.

O histórico externo prova operação do GTM, mas ainda não existe Run Record desse Sistema no ledger
do Company Brain. Portanto o estado inicial é `configurado`, não `ativo`; o próximo gate é executar
e julgar o primeiro Run pelo protocolo constitucional.

## Acceptance criteria

- [x] O GTM entra no catálogo local como System Contract V2 válido, versão `1.4.3`, sem nomear
      GBrain, Supabase ou outro provider no contrato genérico de recuperação.
- [x] O contrato declara somente papéis lógicos já usados pelo Sistema real: sinais de relação,
      comércio/entitlement, feedback/outcomes e prova disponível.
- [x] `Abrir aplicação` aponta para o frontend real em `http://localhost:3300/` e mantém a aplicação
      fora do Cockpit.
- [x] O Launcher mostra pré-diagnóstico por metadados: Fontes exigidas encontradas, ausentes e
      verificáveis somente depois da autorização; ausência nunca vira `pronto`.
- [x] O GTM aparece como `configurado` e declara que o próximo gate é o primeiro Run no ledger do
      Company Brain, sem converter o ledger externo em recibo constitucional.
- [x] O workspace carrega o `contract.json` canônico do pacote em `sistemas/next-best-gtm/`, em vez
      de assumir que todo contrato vive em `.cerebro/contracts/systems/`.
- [x] Contrato, Estado atual e Último Run permanecem honestos quando não há Source Contract, grant
      ou Run Record instalado.
- [x] A jornada `Cockpit → Abrir aplicação GTM` e `Cockpit → Inspecionar operação` funciona no
      navegador sem copiar conteúdo da fila privada.
- [x] Testes cobrem contrato, interface segura, pré-diagnóstico e resolução do contrato empacotado.

## Fora deste corte

- Alterar o motor, a política, o ledger ou o design system do GTM.
- Copiar `queue.json`, contatos, recomendações, PII ou credenciais para o Company Brain.
- Criar Experience Manifest, Release Manifest, Runtime Binding genérico ou Brain SDK.
- Converter runs históricos do GTM em Run Records retroativos.
- Instalação distribuída, atualização, rollback ou publicação na Society.

## File List

- `docs/stories/2026-08-26-gtm-first-external-system.md`
- `sistemas/next-best-gtm/contract.json`
- `sistemas/next-best-gtm/capability.json`
- `sistemas/next-best-gtm/manifest.md`
- `sistemas/next-best-gtm/pipeline.md`
- `sistemas/next-best-gtm/evals.md`
- `sistemas/next-best-gtm/changelog.md`
- `scripts/lib/console-read-model.mjs`
- `scripts/console-server.mjs`
- `console/app.js`
- `console/styles.css`
- `scripts/test-gtm-console-integration.mjs`
- `scripts/validate-product.mjs`

## Verificação

- `node scripts/protocol-validate.mjs system sistemas/next-best-gtm/contract.json`
- `node scripts/test-gtm-console-integration.mjs`
- `node scripts/test-system-launcher-workspace.mjs`
- `node scripts/test-console-server.mjs`
- `node scripts/test-canvas-layout-readability.mjs`
- `npm test`
- Browser desktop: GTM aparece em Crescimento, pré-diagnóstico `0/3`, duas portas distintas,
  frontend real carregado em `localhost:3300` e zero erro no Cockpit ou no GTM.
- Browser mobile: as duas ações e o pré-diagnóstico permanecem visíveis; `scrollWidth` igual a
  `clientWidth`, sem overflow horizontal.
- Canvas: Contrato mostra somente papéis lógicos; Estado atual mostra Fontes sem binding/acesso;
  Último Run mostra `Nenhum Run registrado`.
