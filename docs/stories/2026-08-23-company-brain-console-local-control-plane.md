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
A camada protocolar foi implementada em v1.27.0. O engine mínimo de runtime entra em v1.28.0;
o substrato de Rotinas entra na entrega seguinte; servidor e Console continuam fora.

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
- **Rotina é objeto do Cérebro:** Sistema define o resultado; Rotina declara quando, onde e com
  qual executor/modelo rodá-lo. Agenda escondida no fornecedor não é fonte de verdade.
- **Assinatura via cliente oficial:** o runtime pode chamar um CLI já autenticado pelo dono; nunca
  copia OAuth, converte assinatura em API key ou promete compatibilidade sem adapter verificável.

## Modelo plural

```text
Company Brain
├── Áreas (navegação humana: Marketing, Vendas, Operação...)
├── Sistemas (resultados executáveis)
├── Fontes (casas de verdade compartilhadas)
├── Rotinas (gatilho, host/workspace, executor, contexto, destino e política operacional)
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

### 5. Routine Contract V1 — schema novo

Contrato canônico e compartilhável por Rotina, sem prompt privado, token ou caminho absoluto:

- `routine_id`, versão, estado e `system_ref`;
- gatilho manual ou calendário estruturado com timezone e política de execução perdida;
- referências opacas de host, workspace e Executor Binding;
- modelo/effort solicitados, sem alegar disponibilidade antes do readback do executor;
- referência do prompt/contexto, Access Grants e modo de permissão;
- destino local reference-only;
- timeout, retry, idempotência e concorrência;
- aprovação exigida antes do primeiro agendamento e antes de ações externas.

### 6. Executor Binding V1 — privado

Binding local em `.cerebro/runtime/executors/`, sempre fora do Git:

- adapter fechado: `codex-cli` ou `claude-code` nesta versão;
- binário resolvido localmente, argumentos de política permitidos e workspace real;
- tipo de autenticação declarado como `provider-session`; nunca token ou credencial;
- status observado (`ready`, `missing`, `authentication-required`, `degraded`) e heartbeat;
- modelos permitidos são observação local e podem mudar conforme o plano do dono.

O binding não prova inferência local: o contexto selecionado atravessa o provider escolhido.

### 7. Routine Run Receipt V1 — schema novo

Cada tentativa deixa recibo privado, reference-only e sem prompt/output/erro cru:

- Rotina, Sistema, binding, adapter e modelo solicitados, sem fingir verificar o modelo efetivo;
- instante agendado, início, fim, status e reason code;
- referências do Access Receipt, Run Record, input e output;
- timeout/retry e decisão sobre próxima ocorrência;
- fronteira de dados declarando que conteúdo foi enviado ao provider, nunca à INEVITA.

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

- o V0 entregue é engine + CLI, sem servidor; quando houver servidor, será vinculado apenas a
  `127.0.0.1` por padrão;
- sessão local autenticada e sem segredo em URL, log, contrato ou Run Record;
- provider de segredos do sistema operacional; plaintext no Git é falha crítica;
- conectores declaram capacidades e passam pelo mesmo gate de Access Grant;
- acesso negado e revogação deixam recibo reference-only;
- ausência ou falha do runtime degrada para file-only mode quando o trabalho não exige conexão;
- nenhuma telemetria de produto recebe conteúdo, fonte, output, consulta, erro cru ou decisão.
- o worker chama apenas adapters fechados, envia prompt por `stdin`, limita cwd/timeout e nunca
  entrega OAuth ao processo filho;
- o scheduler mantém estado privado reconstruível; pausar no contrato impede novos Runs e uma
  execução já consumada não é desfeita.

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

- [x] Source Contract V1, System Contract V2, Run Record V2 e Access Grant V1 possuem schemas
      versionados, exemplos sanitizados e validadores determinísticos.
- [x] Leitores aceitam contratos/runs V1 e V2; V1 permanece válido e não é reescrito sem
      confirmação.
- [x] O harness reprova segredo, bruto, grant sem aprovador, garantia incompatível com a custódia,
      snapshot sem proveniência e retrieval sem fallback/parada.
- [x] O registro atual de fontes possui preview/diff de migração para Source Contract, sem abrir,
      copiar ou alterar a Fonte.
- [x] File-only mode continua entregando `/comecar`, `/arquiteto`, `/sistematizar` e `/operar` sem
      Node ou Console.
- [x] Runtime local pode negar um acesso externo não concedido, revogar um acesso futuro e deixar
      recibo sem persistir a credencial.
- [x] Routine Contract V1 e Routine Run Receipt V1 possuem schemas fechados, exemplos sanitizados
      e validadores determinísticos; prompt, output, erro cru e segredo reprovam.
- [x] Executor Binding privado detecta Codex/Claude local sem armazenar OAuth e o worker passa o
      prompt por stdin, nunca argv.
- [x] O harness prova `rodar agora → concluir → agendar/due → pausar`, retry idempotente, timeout,
      binding ausente/auth requerida e recibo sem conteúdo.
- [x] Nenhum adapter ou teste consome a assinatura real; execução E2E usa processo fake injetado.
- [ ] A UI nunca chama arquivo local de `runtime-enforced`; cada acesso mostra garantia real.
- [ ] A casca renderiza várias Áreas, Sistemas e Fontes sem hardcode de singleton.
- [ ] Uma vertical de Marketing usa ao menos três papéis de Fonte, gera Run Record V2 com Context
      Snapshot, recebe julgamento humano e produz um segundo Run comparável.
- [ ] Em menos de dois minutos, o dono consegue visualizar o contrato, abrir o contexto usado e
      revogar a conexão futura.
- [ ] Cache/índice do Console pode ser apagado e reconstruído sem perder estado canônico.
- [x] Nenhum conteúdo privado é enviado à INEVITA; telemetria e Society preservam os contratos
      atuais de consentimento.
- [x] O starter EN, update, schemas V1, sistemas existentes, CI Linux/Windows e E2Es atuais não
      regridem.
- [x] `.obsidian/graph.json`, `Sem título.md` e o draft local de Cockpit permanecem intocados.

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
- implementação do Console, servidor local ou conectores reais nesta entrega do runtime mínimo.
- migração automática das rotinas atuais de Codex, Claude, launchd ou GitHub Actions;
- daemon/serviço instalado no sistema operacional; o worker V1 é invocado por comando/tick;
- suporte genérico a qualquer provider ou uso de sessão web por scraping.

## Tasks

- [x] Fechar nomes canônicos e compatibilidade no Glossário/protocolo.
- [x] Especificar schemas, exemplos e migrations dos quatro deltas.
- [x] Estender validators e harness anti-slop com dual-read.
- [x] Especificar e implementar provider de segredos, enforcement e degradação do runtime.
- [x] Implementar Routine Contract, Executor Binding, Routine Run Receipt e worker local.
- [ ] Construir o fluxo vertical do Console sobre contratos reais.
- [ ] Criar fixture sanitizado multi-Fonte e E2E de dois Runs.
- [ ] Dogfood interno e implantação externa assistida.
- [ ] Registrar as métricas e decidir continuar, corrigir ou matar o Console.

## Validation plan

- testes unitários por schema e migração;
- contract tests V1↔V2 e fixtures negativos;
- E2E file-only sem Node;
- E2E managed mode com fonte externa fake, segredo efêmero, deny e revoke;
- E2E de Rotina com adapters fake, prompt em stdin, agenda, pausa e recibos sanitizados;
- E2E visual do fluxo vertical com múltiplos Sistemas/Fontes listados;
- replay do primeiro caso e segundo Run comparável;
- `scripts/validate-product.mjs`, `scripts/test-*.mjs`, build do starter e `git diff --check`.

## File List

- `.github/workflows/ci.yml`
- `.cerebro/layout.json`
- `.cerebro/motor.manifest`
- `.agents/skills/fonte/SKILL.md`
- `.claude/skills/fonte/SKILL.md`
- `CHANGELOG.md`
- `GLOSSARIO.md`
- `METODO-SISTEMAS.md`
- `VERSION`
- `dist/company-brain-starter-en.zip`
- `docs/stories/2026-08-23-company-brain-console-local-control-plane.md`
- `profiles/company-brain-starter-en/.cerebro/layout.json`
- `profiles/company-brain-starter-en/.gitignore`
- `protocol/README.md`
- `protocol/access-grant.schema.json`
- `protocol/access-receipt.schema.json`
- `protocol/examples/access-grant.v1.json`
- `protocol/examples/access-receipt.v1.json`
- `protocol/examples/executor-binding.v1.json`
- `protocol/examples/routine-contract.v1.json`
- `protocol/examples/routine-run-receipt.v1.json`
- `protocol/examples/run-record.v2.json`
- `protocol/examples/source-contract.v1.json`
- `protocol/examples/system-contract.v2.json`
- `protocol/run-record-v2.schema.json`
- `protocol/executor-binding.schema.json`
- `protocol/routine-contract.schema.json`
- `protocol/routine-run-receipt.schema.json`
- `protocol/source-contract.schema.json`
- `protocol/system-contract-v2.schema.json`
- `scripts/lib/company-brain-protocol-v2.mjs`
- `scripts/lib/access-runtime.mjs`
- `scripts/lib/model-executors.mjs`
- `scripts/lib/routine-protocol.mjs`
- `scripts/lib/routine-runtime.mjs`
- `scripts/lib/secret-provider.mjs`
- `scripts/lib/system-protocol.mjs`
- `scripts/protocol-validate.mjs`
- `scripts/runtime-access.mjs`
- `scripts/runtime-secret.mjs`
- `scripts/routine-runtime.mjs`
- `scripts/source-contract.mjs`
- `scripts/system-run.mjs`
- `scripts/test-access-runtime.mjs`
- `scripts/test-company-brain-protocol-v2.mjs`
- `scripts/test-company-brain-starter.mjs`
- `scripts/test-routine-runtime.mjs`
- `scripts/validate-product.mjs`
