# Story — Cockpit da Primeira Missão e fronteira Cérebro × Sistemas

## Contexto

O produto já inicia por um trabalho real e fecha a ativação do Cérebro Base em T4, mas a
experiência visual publicada não representa essa arquitetura. A primeira abertura cai num control
plane vazio, a superfície `Sistemas` inclui `Cérebro Base` ao lado de Sistemas de negócio e o
cockpit mais completo — com uma área própria para Memória, Recuperação, Aprendizado, Arquitetura e
Atualizações — permanece numa branch não publicada.

O usuário precisa perceber três objetos diferentes sem aprender o vocabulário interno: está
ativando o Cérebro por meio de uma primeira missão, o Cérebro mantém e recupera contexto, e
Sistemas instalados transformam esse contexto em resultados de negócio.

## Decisões congeladas

- **Primeira Missão é um estado transitório da home**, não um Sistema nem um destino permanente de
  navegação.
- **Cérebro Base permanece como metassistema interno** para preservar contratos, telemetria privada
  e compatibilidade, mas sua superfície pública é `Cérebro`.
- **Sistemas mostra somente Sistemas de negócio.** Ocultar por CSS não é suficiente; o read model
  precisa expor a classificação explicitamente.
- **T4 encerra a Primeira Missão.** Antes de T4, a home orienta o próximo passo; depois de T4, a
  home volta a ser `Hoje` e a ativação permanece como recibo no Cérebro.
- **O cockpit rico é a base visual canônica.** Context Snapshot e os fixes do release atual devem
  sobreviver à integração.
- **Sem fonte conectada não é bloqueio.** Texto, fala, upload ou arquivo autorizado podem ser a
  fonte-semente; integração persistente continua vindo depois de valor.
- **Estado visual vem de artefatos canônicos.** A interface não cria um segundo onboarding state.

## Acceptance criteria

- [x] O cockpit rico está integrado ao produto atual sem perder Context Snapshot, contratos,
      atualização segura ou o handshake de instalação do release mais recente.
- [x] Uma instalação sem T4 abre em `Primeira Missão`, com linguagem humana para trabalho,
      fonte-semente, primeiro resultado, julgamento e reutilização.
- [x] Uma instalação com T4 abre em `Hoje`; o recibo da ativação aparece na área `Cérebro`.
- [x] `Cérebro Base` é classificado como `brain-native` e não aparece em `Sistemas`, contagens,
      filtros de área ou catálogo de Sistemas de negócio.
- [x] Calls em Decisões e outros Sistemas de negócio continuam aparecendo e abrindo normalmente.
- [x] A área `Cérebro` apresenta capacidades nativas, memória, recuperação, aprendizado,
      arquitetura, saúde e atualizações sem fingir instrumentação inexistente.
- [x] Rotinas nativas do Cérebro e rotinas de Sistemas permanecem distinguíveis por classificação.
- [x] O produto continua operável sem Console e a abertura do cockpit não executa modelo, conecta
      fonte nem envia conteúdo à INEVITA.
- [x] Release/starter, schemas, documentação e testes refletem a nova taxonomia.
- [x] Validação de produto, testes unitários relevantes e replay visual desktop/mobile passam.

## Tasks

- [x] Reconciliar `origin/main`, Context Snapshot e a branch do cockpit rico.
- [x] Introduzir classificação canônica de superfície para Sistemas.
- [x] Projetar o estado de ativação T0→T4 no read model do Console.
- [x] Implementar a tela transitória de Primeira Missão e o recibo pós-T4 no Cérebro.
- [x] Atualizar catálogo, contratos, starters e documentação.
- [x] Cobrir fresh install, ativação parcial, T4 e regressão de Sistemas de negócio.
- [x] Rodar testes, build e QA visual.

## Evidência de validação

- `npm test`
- `npm run build:console`
- `node scripts/test-cockpit-first-mission.mjs`
- `node scripts/test-runtime-storage-migration.mjs`
- `node scripts/test-install-activation.mjs`
- `node scripts/test-update-safety.mjs`
- `node scripts/test-console-server.mjs`
- `node scripts/test-graph-read-model.mjs`
- `node scripts/test-company-brain-protocol-v2.mjs`
- `node scripts/test-context-snapshot-runtime.mjs`
- `node scripts/test-company-brain-taxonomy-v1.mjs`
- `node scripts/test-company-brain-starter.mjs`
- Replay visual: fresh desktop; fresh mobile em `390×844` sem overflow horizontal; T4 abrindo em
  `Hoje`; recibo da ativação em `Cérebro`; Arquitetura com grafo e Console sem erros.
- O pacote não declara scripts `lint` ou `typecheck`; a validação executável disponível é a lista
  acima, somada ao bundle de produção.

## File List

- `docs/stories/2026-09-02-cockpit-primeira-missao-e-fronteira-cerebro-sistemas.md`
- `VERSION`
- `CHANGELOG.md`
- `.gitignore`
- `.cerebro/private-ignore.manifest`
- `.agents/scripts/activate.mjs`
- `.agents/scripts/ping.mjs`
- `.claude/scripts/ping.sh`
- `.claude/scripts/update.sh`
- `.agents/skills/comecar/SKILL.md`
- `.claude/skills/comecar/SKILL.md`
- `.agents/skills/atualizar/SKILL.md`
- `.claude/skills/atualizar/SKILL.md`
- `AGENTS.md`
- `CLAUDE.md`
- `GEMINI.md`
- `console/app.js`
- `console/styles.css`
- `scripts/console-server.mjs`
- `scripts/lib/console-read-model.mjs`
- `scripts/lib/system-taxonomy.mjs`
- `scripts/lib/company-brain-protocol-v2.mjs`
- `scripts/lib/canvas-layout-runtime.mjs`
- `scripts/lib/runtime-storage.mjs`
- `scripts/test-cockpit-first-mission.mjs`
- `scripts/test-runtime-storage-migration.mjs`
- `scripts/test-install-activation.mjs`
- `scripts/test-update-safety.mjs`
- `scripts/test-console-server.mjs`
- `scripts/test-company-brain-taxonomy-v1.mjs`
- `scripts/test-company-brain-starter.mjs`
- `scripts/validate-product.mjs`
- `scripts/post-update.mjs`
- `scripts/update.mjs`
- `sistemas/cerebro-base/contract.json`
- `sistemas/cerebro-base/manifest.md`
- `sistemas/calls/contract.json`
- `sistemas/next-best-gtm/contract.json`
- `sistemas/_CATALOGO.md`
- `templates/sistema/contract.json`
- `protocol/system-surface.schema.json`
- `protocol/README.md`
- `README.md`
- `COMECE-AQUI.md`
- `GLOSSARIO.md`
- `profiles/company-brain-starter-en/START-HERE.md`
