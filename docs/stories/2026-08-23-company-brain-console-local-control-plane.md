# Story — Company Brain Console como control plane local

## Contexto

O Cérebro já possui ativação T0→T4, Capability Contract, System Contract, Run Record, ledger,
registro simples de fontes e instalação de System Packs. A operação ainda depende de conversa e
arquivos para o dono entender configurações, fontes, permissões, execuções, saúde e decisões.

Sessões reais de ativação mostraram quatro fricções recorrentes: um protótipo existente pode ser
subestimado pelo scan; uma nova pasta pode parecer um segundo Cérebro concorrente; fonte,
repositório semântico, Sistema e cockpit se confundem; e o dono não consegue inspecionar com
clareza qual contexto sustentou um output. A interface precisa tornar o protocolo legível sem
transformar runtime, nuvem ou Obsidian em requisito.

Esta story abre a especificação executável do **Company Brain Console**: casca plural desde o
início, uma vertical real de ponta a ponta e enforcement honesto conforme a custódia do acesso.
Ela não implementa o Console ainda.

## Decisões congeladas

- **Console local:** a primeira interface é servida em `localhost`, sem enviar fontes, outputs,
  erros, decisões ou contexto privado à INEVITA.
- **Protocolo continua suficiente:** arquivos + agente permanecem operáveis sem Node, servidor ou
  Console. Runtime e UI são upgrades opcionais de controle, nunca pedágio de ativação.
- **Plural desde a arquitetura:** Áreas organizam a visão humana; Sistemas e Fontes mantêm relação
  muitos-para-muitos. Nenhum schema ou componente assume singleton.
- **Um resultado prova o V0:** a primeira vertical implementa um Sistema real com o menor conjunto
  coerente de Fontes, não uma demonstração `um Sistema × uma Fonte`.
- **Sem verdade concorrente:** contratos, mapas e configurações permanecem canônicos; o Console
  pode manter somente cache/índice local reconstruível. Bruto continua na casa de verdade.
- **Obsidian não é produto:** nenhuma jornada, claim ou gate depende dele. Continua viewer opcional.
- **Enforcement por custódia:** credenciais e ações exclusivamente mediadas pelo runtime admitem
  bloqueio preventivo e revogação futura. Arquivo local legível pelo agente é governado por contrato
  e auditado no Run Record, sem claim de ACL preventiva. Export é cópia não revogável.
- **Valor antes do Console:** o fluxo atual de `/comecar` continua entregando o primeiro output
  antes de oferecer runtime, telemetria, conta ou interface.
- **Julgamento permanece central:** a UX de Casos/Mesa de Julgamento é uma superfície do mesmo
  Console. Esta story especifica o substrato de contratos, autoridade e execução, não outro produto.

## Modelo plural

```text
Company Brain
├── Áreas (navegação humana: Marketing, Vendas, Operação...)
├── Sistemas (resultados executáveis)
├── Fontes (casas de verdade compartilhadas)
├── Concessões (quem/o que pode fazer o quê, onde e até quando)
├── Runs (execução, contexto usado, eval e decisão)
└── Saúde (vista derivada de contratos, concessões e runs)
```

Uma Área não possui a Fonte. Uma Fonte pode alimentar Sistemas de Áreas diferentes; um Sistema
pode recuperar várias Fontes. A unidade de comissionamento continua sendo o resultado do Sistema.

## Delta do protocolo

### 1. Source Contract V1 — schema novo

Contrato reference-only por Fonte, sem credencial ou bruto. Campos mínimos:

- `source_id`, nome, tipo e estado;
- casa da verdade e autoridade responsável;
- escopo e entidades cobertas;
- sensibilidade e classificação de PII;
- modos permitidos de leitura, escrita e ação;
- frescor, retenção e regra de revogação;
- binding do conector e `credential_ref` opaco, quando existir;
- consumidores autorizados por referência;
- nível de garantia: `runtime-enforced`, `receipt-audited` ou `exported`.

O registro simples atual em `conexoes/configuradas/fontes.json` continua legível e ganha migração
explícita; nenhum caminho ou fonte existente é reescrito silenciosamente.

### 2. Retrieval Contract — bloco do System Contract

O System Contract passa a declarar como compila contexto para aquele resultado:

- papéis e prioridades das Fontes;
- regras de seleção, filtros e janela temporal;
- exigência de frescor;
- conflito, fallback e condições de parada;
- teto de contexto;
- evidência/proveniência obrigatória;
- comportamento quando a Fonte não está disponível.

O contrato nunca carrega o conteúdo recuperado.

### 3. Context Snapshot — bloco do Run Record

Todo Run governado deixa o recibo exato do contexto usado:

- versão do System Contract e do bloco de recuperação;
- `source_ref`s e itens/fragmentos selecionados por referência;
- consulta, filtros, janela e instante de observação;
- versão, hash ou marcador de frescor quando a Fonte oferece;
- lacunas, fallbacks e conflitos acionados;
- modo de garantia aplicado em cada acesso.

O snapshot torna a seleção reproduzível e auditável sem copiar bruto para o ledger.

### 4. Access Grant V1 — schema novo

Não confundir com o grant efêmero que autoriza download de pacote Society. O nome canônico é
**Access Grant** enquanto não houver decisão diferente no Glossário.

- `grant_id`, sujeito e tipo (`system`, `agent`, `role` ou `person`);
- empresa/unidade, Sistemas, Fontes e ações cobertas;
- modo `read`, `propose`, `write-with-approval` ou `external-action`;
- nível de garantia e razão;
- emissão, expiração, revogação e aprovador humano;
- referência de credencial, nunca segredo;
- recibos de uso e de revogação por referência.

V1 promete controle duro somente quando o runtime possui custódia exclusiva. Para arquivo local,
o grant é auditável; para export, a UI informa irreversibilidade.

## Compatibilidade

- `system-contract-v1` e `run-record-v1` permanecem imutáveis.
- Como ambos usam `additionalProperties: false`, retrieval e snapshot entram em novos schemas
  versionados; não serão injetados silenciosamente em V1.
- Leitores do novo control plane aceitam V1 e V2. V1 aparece com estados honestos como
  `retrieval-not-declared` ou `context-not-recorded`, nunca como erro inventado.
- Escritores não promovem V1 para V2 sem diff, confirmação do dono e rollback.
- Starter, skills e Sistemas existentes continuam funcionais em file-only mode.
- O validador e o harness cobrem dual-read, migração explícita e rejeição de campos
  desconhecidos.

## Runtime local opcional

- servidor vinculado apenas a `127.0.0.1` por padrão;
- sessão local autenticada e sem segredo em URL, log, contrato ou Run Record;
- provider de segredos do sistema operacional; plaintext no Git é falha crítica;
- conectores declaram capacidades e passam pelo mesmo gate de Access Grant;
- acesso negado e revogação deixam recibo reference-only;
- ausência ou falha do runtime degrada para file-only mode quando o trabalho não exige conexão;
- nenhuma telemetria de produto recebe conteúdo, fonte, output, consulta, erro cru ou decisão.

## V0 do Console

A casca suporta os destinos `Hoje`, `Mapa/Áreas`, `Sistemas`, `Fontes`, `Execuções`,
`Governança`, `Saúde` e `Society`, mas o V0 implementa um fluxo vertical, não oito produtos.

```text
selecionar Sistema
→ ler requisitos e Fontes
→ conceder o menor acesso
→ ver readback do contrato e nível de garantia
→ executar
→ abrir "contexto usado"
→ julgar/corrigir
→ registrar o aprendizado candidato
→ revogar o acesso futuro
```

A casca lista vários Sistemas e Fontes reais pelos contratos e mostra estados honestos: `mapped`,
`missing-contract`, `awaiting-approval`, `ready`, `active`, `degraded` ou `incompatible`. O estado
não vem de um arquivo editorial curado para parecer saúde operacional.

### Primeira vertical

Dogfood na operação de Marketing da INEVITA, usando dados já conectados e um fixture sanitizado
no repositório:

- resultado: leitura do funil → oportunidade → próximo experimento proposto;
- Fontes por papel: mídia paga, leads/compras, retenção e experimentos anteriores;
- primeira ação externa permanece bloqueada; o output termina em proposta humana;
- o Run mostra exatamente o contexto recuperado e a decisão do dono;
- um segundo Run reutiliza a correção sem reivindicar estabilidade antes da régua existente.

## Acceptance criteria

- [ ] Source Contract V1, System Contract V2, Run Record V2 e Access Grant V1 possuem schemas
      versionados, exemplos sanitizados e validadores determinísticos.
- [ ] Leitores aceitam contratos/runs V1 e V2; V1 permanece válido e não é reescrito sem
      confirmação.
- [ ] O harness reprova segredo, bruto, grant sem aprovador, garantia incompatível com a custódia,
      snapshot sem proveniência e retrieval sem fallback/parada.
- [ ] O registro atual de fontes possui preview/diff de migração para Source Contract, sem abrir,
      copiar ou alterar a Fonte.
- [ ] File-only mode continua entregando `/comecar`, `/arquiteto`, `/sistematizar` e `/operar` sem
      Node ou Console.
- [ ] Runtime local pode negar um acesso externo não concedido, revogar um acesso futuro e deixar
      recibo sem persistir a credencial.
- [ ] A UI nunca chama arquivo local de `runtime-enforced`; cada acesso mostra garantia real.
- [ ] A casca renderiza várias Áreas, Sistemas e Fontes sem hardcode de singleton.
- [ ] Uma vertical de Marketing usa ao menos três papéis de Fonte, gera Run Record V2 com Context
      Snapshot, recebe julgamento humano e produz um segundo Run comparável.
- [ ] Em menos de dois minutos, o dono consegue visualizar o contrato, abrir o contexto usado e
      revogar a conexão futura.
- [ ] Cache/índice do Console pode ser apagado e reconstruído sem perder estado canônico.
- [ ] Nenhum conteúdo privado é enviado à INEVITA; telemetria e Society preservam os contratos
      atuais de consentimento.
- [ ] O starter EN, update, schemas V1, sistemas existentes, CI Linux/Windows e E2Es atuais não
      regridem.
- [ ] `.obsidian/graph.json`, `Sem título.md` e o draft local de Cockpit permanecem intocados.

## O que medir

O Console só prova valor aditivo se melhorar o comportamento além do fluxo conversacional:

- tempo para compreender e aprovar um contrato;
- abertura e uso de `contexto usado` antes do julgamento;
- revogação compreendida e executada sem falsa expectativa retroativa;
- redução de explicações no onboarding;
- decisões pendentes encontradas e resolvidas pela superfície `Hoje`.

## Fora do escopo

- SaaS com contexto privado;
- app desktop empacotado;
- ACL preventiva para agente com acesso direto à pasta;
- feed, marketplace ou matching da Society;
- grafo global;
- editor no-code de Sistemas;
- integração de todas as Fontes;
- oito áreas funcionais completas;
- mudança de site/isca antes do teste real;
- implementação nesta story de abertura.

## Tasks

- [ ] Fechar nomes canônicos e compatibilidade no Glossário/protocolo.
- [ ] Especificar schemas, exemplos e migrations dos quatro deltas.
- [ ] Estender validators e harness anti-slop com dual-read.
- [ ] Especificar provider de segredos, enforcement e degradação do runtime.
- [ ] Construir o fluxo vertical do Console sobre contratos reais.
- [ ] Criar fixture sanitizado multi-Fonte e E2E de dois Runs.
- [ ] Dogfood interno e implantação externa assistida.
- [ ] Registrar as métricas e decidir continuar, corrigir ou matar o Console.

## Validation plan

- testes unitários por schema e migração;
- contract tests V1↔V2 e fixtures negativos;
- E2E file-only sem Node;
- E2E managed mode com fonte externa fake, segredo efêmero, deny e revoke;
- E2E visual do fluxo vertical com múltiplos Sistemas/Fontes listados;
- replay do primeiro caso e segundo Run comparável;
- `scripts/validate-product.mjs`, `scripts/test-*.mjs`, build do starter e `git diff --check`.

## File List

- `docs/stories/2026-08-23-company-brain-console-local-control-plane.md`
