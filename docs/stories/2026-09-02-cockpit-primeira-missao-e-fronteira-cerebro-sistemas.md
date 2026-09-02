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

- [ ] O cockpit rico está integrado ao produto atual sem perder Context Snapshot, contratos,
      atualização segura ou o handshake de instalação do release mais recente.
- [ ] Uma instalação sem T4 abre em `Primeira Missão`, com linguagem humana para trabalho,
      fonte-semente, primeiro resultado, julgamento e reutilização.
- [ ] Uma instalação com T4 abre em `Hoje`; o recibo da ativação aparece na área `Cérebro`.
- [ ] `Cérebro Base` é classificado como `brain-native` e não aparece em `Sistemas`, contagens,
      filtros de área ou catálogo de Sistemas de negócio.
- [ ] Calls em Decisões e outros Sistemas de negócio continuam aparecendo e abrindo normalmente.
- [ ] A área `Cérebro` apresenta capacidades nativas, memória, recuperação, aprendizado,
      arquitetura, saúde e atualizações sem fingir instrumentação inexistente.
- [ ] Rotinas nativas do Cérebro e rotinas de Sistemas permanecem distinguíveis por classificação.
- [ ] O produto continua operável sem Console e a abertura do cockpit não executa modelo, conecta
      fonte nem envia conteúdo à INEVITA.
- [ ] Release/starter, schemas, documentação e testes refletem a nova taxonomia.
- [ ] Validação de produto, testes unitários relevantes e replay visual desktop/mobile passam.

## Tasks

- [ ] Reconciliar `origin/main`, Context Snapshot e a branch do cockpit rico.
- [ ] Introduzir classificação canônica de superfície para Sistemas.
- [ ] Projetar o estado de ativação T0→T4 no read model do Console.
- [ ] Implementar a tela transitória de Primeira Missão e o recibo pós-T4 no Cérebro.
- [ ] Atualizar catálogo, contratos, starters e documentação.
- [ ] Cobrir fresh install, ativação parcial, T4 e regressão de Sistemas de negócio.
- [ ] Rodar testes, build e QA visual.

## File List

- `docs/stories/2026-09-02-cockpit-primeira-missao-e-fronteira-cerebro-sistemas.md`

