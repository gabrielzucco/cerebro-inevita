# Story — Contrato canônico de ativação do Company Brain

## Contexto

O produto já provou em E2E que contexto salvo pode voltar numa segunda execução, mas o onboarding
ainda chamava o recorte de ativação de “primeiro Sistema”. Isso misturava quatro objetos: instalação
da pasta, orientação do negócio, ativação do Cérebro Base e implantação do primeiro Sistema de
negócio. Também fazia `Context Pack` competir com o termo canônico CONFIGURAÇÃO e permitia confundir
fonte registrada com fonte conectada.

## Decisões congeladas

- **Mapa da empresa** começa amplo e raso em V0; recortes ficam estreitos e profundos pelo uso.
- **Registrar fonte não é conectar fonte:** ponteiro, finalidade, autoridade e acesso podem existir
  sem abrir, copiar, indexar ou sincronizar conteúdo.
- **Cérebro Base** é o metassistema de ativação. O gate fecha em `usar → reutilizar` (T4).
- O primeiro **Sistema de negócio** é escolhido depois de T4; o Architect pode diagnosticar antes,
  mas não finge implantação.
- **CONFIGURAÇÃO** é o termo da casa; `Context Pack` permanece alias externo/de compatibilidade.
- V0→V3 mede evidência; T0→T4 mede ativação. T4 não implica V3.
- Layout v3 acrescenta aliases canônicos sem órfãr os caminhos v2 existentes.

## Acceptance criteria

- [x] `/comecar` separa orientação, ativação do Cérebro Base e primeiro Sistema de negócio.
- [x] O sprint suporta entrada por resultado ou por rastro e converge em uso + reutilização.
- [x] Layout v3 expõe `activationBrief`, `configuration` e `activationContract` mantendo aliases v2.
- [x] Cérebro Base produz `cerebro-base-ativado`, não `primeiro-sistema-verificado`.
- [x] `/arquiteto` mantém V0→V3 como régua epistêmica e trata T4 como gate separado.
- [x] Starter EN explica a mesma arquitetura sem depender do corpus português.
- [x] Validador, testes determinísticos e E2E de dois usos passam.
- [x] `.obsidian/graph.json` e `Sem título.md` permanecem intocados.

## Tasks

- [x] Atualizar vocabulário e contratos de entrada.
- [x] Atualizar Cérebro Base e aliases de layout.
- [x] Sincronizar skills Claude/Agents e starter EN.
- [x] Atualizar guards de validação.
- [x] Rodar regressão e E2E de dois usos.

## Validation receipt

- `node scripts/validate-product.mjs`: passou com 6 superfícies, 3 Sistemas e 29 arquivos de skills
  sincronizados.
- `scripts/test-*.mjs`: 10 suítes passaram, cobrindo Architect, starter EN, relógio T0–T4,
  descoberta/registro de fontes, grants, instalação, brief vivo, experimentos, protocolo e update.
- E2E real em pasta gerada, com quatro sessões Codex frescas:
  1. orientação V0 antes de abrir fontes, observação estreita, CONFIGURATION e primeiro output;
  2. decisão humana promoveu mapa a V2 e primeiro uso a T3, sem V3 nem Sistema de negócio;
  3. `raw/` foi removida e o segundo output reutilizou mapa, Activation Brief e CONFIGURATION,
     parando no gate humano;
  4. confirmação humana fechou T4 e ativou o Cérebro Base, preservando V2, V3 não reivindicado,
     nenhuma conexão, automação, regra reutilizável ou Sistema de negócio.
- O E2E revelou drift da capability para o nome do caso de uso. O contrato foi endurecido para
  `cerebro-base` + `ativar-recorte-operacional` + `cerebro-base-ativado`, com guards no validador e
  no teste do starter.
- ZIP v1.23.0 reconstruído e inspecionado em `dist/company-brain-starter-en.zip`.
- `git diff --check`: passou.

## File List

- `.agents/skills/arquiteto/SKILL.md`
- `.agents/skills/comecar/SKILL.md`
- `.agents/skills/company-brain-sprint/SKILL.md`
- `.agents/skills/company-brain-sprint/references/output-contract.md`
- `.cerebro/layout.json`
- `.claude/skills/arquiteto/SKILL.md`
- `.claude/skills/comecar/SKILL.md`
- `.claude/skills/company-brain-sprint/SKILL.md`
- `.claude/skills/company-brain-sprint/references/output-contract.md`
- `CHANGELOG.md`
- `CLAUDE.md`
- `COMECE-AQUI.md`
- `GLOSSARIO.md`
- `VERSION`
- `dist/company-brain-starter-en.zip`
- `docs/stories/2026-08-19-company-brain-activation-contract.md`
- `profiles/company-brain-starter-en/.cerebro/layout.json`
- `profiles/company-brain-starter-en/AGENTS.md`
- `profiles/company-brain-starter-en/START-HERE.md`
- `profiles/company-brain-starter-en/systems/first-system/brief.md`
- `scripts/test-company-brain-starter.mjs`
- `scripts/validate-product.mjs`
- `sistemas/cerebro-base/capability.json`
- `sistemas/cerebro-base/contract.json`
- `sistemas/cerebro-base/evals.md`
- `sistemas/cerebro-base/manifest.md`
- `sistemas/cerebro-base/pipeline.md`
- `skills/_CATALOGO.md`
