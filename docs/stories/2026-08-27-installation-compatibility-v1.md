# Story — Installation Compatibility V1

## Objetivo

Fazer a ficha de um Sistema publicado na Society diagnosticar, localmente e antes da instalação,
se os papéis exigidos podem ser atendidos pelas Fontes já governadas neste Cérebro. O diagnóstico
orienta o agente e o dono sem ler conteúdo, abrir credenciais ou confundir candidato mecânico com
compatibilidade semântica aprovada.

## Critérios de aceite

- [x] A ficha chama `Ver compatibilidade` antes de oferecer instalação.
- [x] O diagnóstico funciona também quando o pacote ainda não foi instalado.
- [x] Cada papel mostra binding atual, candidatos mecânicos e a decisão humana ainda necessária.
- [x] Fonte ausente, binding ambíguo/inválido e grant expirado ou revogado impedem o estado `ready`.
- [x] A mesma Fonte pode aparecer como candidata ou binding de vários Sistemas sem ser duplicada.
- [x] O catálogo e o CLI expõem somente metadata reference-only; conteúdo e credenciais não são lidos.
- [x] A interface distingue `Fonte ausente`, `Mapeamento necessário`, `Aguardando aprovação` e `Pronto`.
- [x] O próximo passo entregue ao Codex/Claude Code é executável e não finge consentimento humano.
- [x] Testes cobrem caminho feliz, ausência, aprovação pendente, expiração e privacidade.

## Decisões

- Instalar pacote e ativar Sistema continuam estados distintos. A ficha segura a instalação até o
  diagnóstico, mas uma Fonte ausente nunca é mascarada como incompatibilidade do Cérebro inteiro.
- Matching por modo/status é mecânico. A semântica `papel → Fonte` continua dependendo de aprovação
  humana materializada no System Source Binding e no Access Grant.
- O diagnóstico é reconstruído dos contratos locais a cada leitura; não cria um cadastro editorial
  paralelo nem envia inventário para a Society.
- O primeiro consumidor é o Briefing Comercial Inteligente, sem regra especial no motor.

## Evidência de validação

- [x] `node scripts/test-installation-compatibility-v1.mjs` cobre ausência, candidatos,
  versão divergente, aprovação pendente, ready, grant expirado, reuso e CLI pré-instalação.
- [x] `node scripts/test-society-catalog-v0.mjs` cobre o diagnóstico dentro da ficha local.
- [x] `node scripts/test-install-system.mjs` prova `unbound → run bloqueado → bindings/grant ready`;
  a reinstalação preserva os vínculos e o primeiro run herda duas Fontes.
- [x] `node scripts/test-console-server.mjs` passou fora do sandbox com o Console local completo.
- [x] `npm test` passou com 22 envelopes, 3 Sistemas e 33 Skills.
- [x] Regressão completa passou neste corte; permanecem somente duas falhas preexistentes e fora de
  escopo porque a UI anterior renomeou `Visão geral` para `Sobre` sem atualizar as expectativas:
  `test-system-launcher-workspace.mjs` e `test-system-workspace-dedup-v1.mjs`.
- [x] `git diff --check` e o gate do vault passaram; lint/typecheck não existem no `package.json`.

## File List

- `docs/stories/2026-08-27-installation-compatibility-v1.md`
- `scripts/lib/installation-compatibility.mjs`
- `scripts/installation-compatibility.mjs`
- `scripts/lib/society-catalog-read-model.mjs`
- `scripts/system-source-binding.mjs`
- `scripts/install-system.mjs`
- `scripts/system-run.mjs`
- `console/app.js`
- `console/styles.css`
- `scripts/test-installation-compatibility-v1.mjs`
- `scripts/test-society-catalog-v0.mjs`
- `scripts/test-install-system.mjs`
- `scripts/validate-product.mjs`
- `protocol/README.md`
- `CHANGELOG.md`
