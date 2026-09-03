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
A camada protocolar foi implementada em v1.27.0. O engine mínimo de runtime entrou em v1.28.0
e o substrato de Rotinas em v1.29.0. A entrega v1.30.0 abre a primeira superfície local do
Console: Rotinas, migração segura de agendas legadas e dogfood do funil diário. A v1.31.0 fecha
o próximo elo: o output privado vira item de uma Caixa de Julgamento, sem contaminar o ledger nem
autorizar ação externa por inferência. A v1.32.0 fecha o loop de correção supervisionada: uma
solicitação de ajuste pode gerar exatamente um novo Run ligado àquele julgamento, os dois outputs
podem ser comparados por leitura local explícita e um resultado corrigido aprovado pode virar
candidato de aprendizado — nunca alteração automática do motor.

O corte local seguinte fecha a costura que ainda faltava entre protocolo e execução: a Rotina V1
declara quais recortes do artefato do coletor correspondem a cada papel do System Contract V2; o
runtime valida isso antes do provider, persiste o artefato privado por hash e grava o Run Record V2.
O Console lê somente o Context Snapshot reference-only e permite revogar Access Grants para Runs
futuros. Este corte permanece local até ser publicado junto com o funil completo.

O dogfood interno seguinte não cria outro Cérebro nem reorganiza o vault: um importador
determinístico lê os manifestos humanos existentes, produz somente contratos privados em
`.cerebro/` e liga uma vertical executável já existente ao Sistema de portfólio correspondente.
O Console passa a distinguir `mapped`, `configured` e `active`, impedindo que mapa, recuperação
declarada e operação com recibo apareçam como a mesma coisa.

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

- o servidor V0 é opcional e vinculado apenas a `127.0.0.1` por padrão;
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

### Corte executável v1.30.0 — Rotinas

- servidor stdlib local vinculado somente a `127.0.0.1`, com sessão HttpOnly, CSRF e nenhuma
  credencial, prompt, output ou erro cru em URL/log/API;
- read model reconstruível derivado de Routine Contracts, Executor Bindings, Access Grants,
  estados e recibos canônicos; apagar cache nunca apaga verdade operacional;
- shell plural de Áreas, Sistemas, Fontes e Rotinas, com a primeira operação completa concentrada
  em Rotinas;
- ações explícitas `rodar agora`, `ativar`, `pausar` e `retomar`, todas com confirmação humana e
  recibo; abrir a página nunca consome assinatura nem executa trabalho;
- `Routine Migration Readback V1` privado registra a agenda legada observada, o risco de relógio
  duplo e a evidência humana de pausa; ativação e retomada são negadas enquanto o cutover não
  estiver liberado;
- o cofre interno é instalado como cérebro legado compatível por marcador explícito, sem duplicar
  arquivos, sem mover fontes e sem se declarar um starter novo;
- `funil-diario-cerebro` entra aprovado, porém desativado, com saída em runtime privado até o
  primeiro replay e o julgamento humano; a agenda antiga do Claude não é pausada por inferência.

O read model usa reason codes, não copy otimista: `legacy-schedule-not-paused`,
`executor-authentication-required`, `routine-disabled`, `routine-paused`, `ready-manual-run` e
`active`. Uma Fonte local/agent-direct aparece como `receipt-audited`; a UI nunca promove sua
garantia para `runtime-enforced`.

### Corte executável v1.31.0 — Caixa de Julgamento

- output continua conteúdo privado e não entra em Routine Run Receipt, `/api/console`, log,
  telemetria ou payload da Society; a UI só o abre por uma rota local autenticada e por gesto
  explícito do dono;
- a rota aceita somente `receipt_id` válido, resolve o `output_ref` registrado e bloqueia caminho
  fora de `routineOutputs`, arquivo ausente, run não concluído, binário e payload acima do teto;
- `Judgment Receipt V1` é evento privado e imutável: liga decisão, ator opaco, instante, verdict e
  intenção de ação ao Routine Run Receipt sem copiar o output;
- verdicts fechados: `approved`, `changes-requested` e `rejected`; comentário é uma nota privada
  opcional no aprovado e obrigatória nos demais;
- `action_intent` pode ser `none` ou `propose-action`; propor ação cria somente intenção local —
  não publica, não cria task, não muda Fonte e não reexecuta modelo;
- decisões posteriores não apagam as anteriores: a vista atual usa o evento mais recente e o
  histórico permanece auditável;
- a Caixa lista outputs pendentes primeiro, permite abrir o resultado e registrar julgamento com
  confirmação humana. Abrir resultado ou navegar não consome assinatura.

### Corte executável v1.32.0 — Loop de correção supervisionada

- somente o julgamento atual `changes-requested`, com nota humana, habilita `Reexecutar com
  correção`; cada Judgment Receipt autoriza no máximo um rerun e uma nova tentativa exige novo
  julgamento sobre o novo output;
- o runtime recompila o prompt em memória com a correção privada, envia por `stdin` ao mesmo
  executor e registra no novo Routine Run Receipt apenas a referência do julgamento — nunca a
  nota ou o prompt compilado;
- `Correction Run Receipt V1` liga baseline, julgamento e novo Run por referências imutáveis,
  declara a fronteira do provider e não carrega output, prompt, nota, segredo ou erro cru;
- comparação abre baseline e candidato somente por rota local autenticada e gesto explícito; os
  dois conteúdos continuam fora de `/api/console`, logs, recibos e INEVITA;
- somente um Run de correção atualmente `approved` pode criar `Learning Candidate V1`; o candidato
  referencia a evidência sem copiar conteúdo e nasce `1/3`, `not-eligible-for-replay`;
- criar candidato não muda prompt, contrato, Fonte, rotina ou ação externa. Três ocorrências
  comparáveis, replay e nova aprovação humana continuam obrigatórios para promover uma mudança.

### Corte local candidato — Context Snapshot no runtime

- `source_selections` liga cada Fonte do System Contract V2 a JSON Pointers válidos do artefato
  determinístico produzido pelo Collector Binding;
- Fonte obrigatória, recorte obrigatório ausente, Fonte não declarada, artefato fora do Cérebro,
  payload inválido ou redirecionamento por symlink bloqueiam o provider;
- o artefato completo fica privado e content-addressed no runtime; Run Record V2 recebe apenas hash,
  ponteiros, janela, filtros, frescor, lacunas e garantia;
- Routine Run Receipt e Run Record são ligados por `run_id` e referências explícitas; rerun de
  correção aponta para o Judgment Receipt sem copiar a nota;
- Execuções mostram o contexto selecionado sem abrir o artefato. Governança revoga o grant apenas
  para o futuro e não apaga recibos ou outputs passados;
- fixture sanitizada cobre três Fontes, dois Runs, julgamento, correção e revoke antes do provider.

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
- [x] A UI nunca chama arquivo local de `runtime-enforced`; cada acesso mostra garantia real.
- [x] A casca renderiza várias Áreas, Sistemas, Fontes e Rotinas sem hardcode de singleton.
- [x] Migração legada com risco de relógio duplo bloqueia ativação e retomada até existir readback
      humano reference-only de que a agenda anterior foi pausada.
- [x] Abrir e navegar no Console não executa modelo; mutações exigem sessão local, CSRF,
      confirmação e deixam o estado/recibo canônico como única verdade.
- [x] Judgment Receipt V1 possui schema fechado, exemplo sanitizado e validador determinístico;
      output, prompt, segredo e erro cru são proibidos no envelope.
- [x] Output privado só pode ser aberto por sessão local a partir do `output_ref` do recibo; path
      traversal, symlink para fora, run incompleto, arquivo grande/binário e receipt ausente falham.
- [x] `/api/console` continua reference-only; abrir a Caixa ou o output não chama modelo e não
      adiciona conteúdo privado ao read model.
- [x] Julgamentos são eventos imutáveis, preservam histórico e expõem apenas o estado atual no
      read model; mudança/rejeição exigem nota.
- [x] `propose-action` deixa intenção local explícita e nunca executa ação externa, publica output,
      cria task ou altera a Fonte.
- [x] O dono consegue abrir o output real do funil e registrar um julgamento pelo Console.
- [x] Correction Run Receipt V1 e Learning Candidate V1 possuem schemas fechados, exemplos
      sanitizados e validadores determinísticos.
- [x] `changes-requested → rerun` usa a nota privada somente em memória/stdin, registra linhagem
      reference-only e bloqueia segundo rerun para o mesmo Judgment Receipt.
- [x] O Console compara baseline × candidato por leitura local explícita, sem colocar os conteúdos
      no read model, e o novo output volta à Caixa de Julgamento.
- [x] Um Run corrigido aprovado cria candidato `1/3` por confirmação explícita, sem alterar o motor;
      rejeitado, pendente ou Run sem correção não pode virar candidato.
- [x] A Rotina compila `source_selections` em Context Snapshot, falha antes do provider quando um
      recorte obrigatório não existe e não coloca valores recuperados no Run Record.
- [x] O Console abre o Context Snapshot por sessão local e revoga Access Grant com efeito futuro;
      o E2E prova que o Run seguinte é negado antes do modelo.
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
- [x] Manifestos humanos existentes podem virar contratos por preview + confirmação, sem mover,
      copiar ou editar Fonte, manifesto ou pasta do Cérebro.
- [x] Alias explícito preserva o System Contract e os recibos da vertical ativa sem criar um 15º
      Sistema de portfólio ou sobrescrever contrato não gerenciado.
- [x] O Console diferencia `mapped`, `configured` e `active`, exibe o próximo gate e reconstrói o
      mapa plural do cérebro interno com 14 Sistemas, três Áreas e Fontes compartilhadas.

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
- superfícies completas de Hoje, Society ou Analytics além dos cortes operacionais de Rotinas e Julgamento;
- execução automática da intenção de ação, integração com ClickUp/WhatsApp ou publicação do output;
- edição manual do output ou promoção automática de candidato para mudança do motor;
- migração automática das rotinas atuais de Codex, Claude, launchd ou GitHub Actions;
- daemon/serviço instalado no sistema operacional; o worker V1 é invocado por comando/tick;
- suporte genérico a qualquer provider ou uso de sessão web por scraping.

## Tasks

- [x] Fechar nomes canônicos e compatibilidade no Glossário/protocolo.
- [x] Especificar schemas, exemplos e migrations dos quatro deltas.
- [x] Estender validators e harness anti-slop com dual-read.
- [x] Especificar e implementar provider de segredos, enforcement e degradação do runtime.
- [x] Implementar Routine Contract, Executor Binding, Routine Run Receipt e worker local.
- [x] Construir o fluxo vertical de Rotinas do Console sobre contratos reais.
- [x] Implementar Routine Migration Readback V1 e gate de cutover no runtime/CLI.
- [x] Implementar servidor local e read model reconstruível da superfície Rotinas.
- [x] Migrar `funil-diario-cerebro` desativado e sem segundo relógio no cofre interno.
- [x] Especificar e validar Judgment Receipt V1.
- [x] Implementar leitura segura e explícita do output privado.
- [x] Implementar eventos imutáveis de julgamento e estado atual derivado.
- [x] Construir a Caixa de Julgamento e testar com o output real do funil.
- [x] Especificar e validar Correction Run Receipt V1 e Learning Candidate V1.
- [x] Implementar rerun corrigido, comparação privada e candidato de aprendizado no Console.
- [x] Criar fixture sanitizado multi-Fonte e E2E de dois Runs.
- [x] Ligar Collector, Retrieval Contract, Context Snapshot e Run Record V2 no runtime de Rotinas.
- [x] Expor seleção de contexto e revogação futura no Console sem abrir bruto.
- [x] Implementar importação aditiva e idempotente dos manifestos humanos para System/Source
      Contracts, com preview e garantias de uma única pasta.
- [x] Migrar localmente o mapa do cérebro interno sem publicar release, mantendo apenas a vertical
      do funil como ativa.
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
- `README.md`
- `VERSION`
- `dist/company-brain-starter-en.zip`
- `docs/stories/2026-08-23-company-brain-console-local-control-plane.md`
- `profiles/company-brain-starter-en/.cerebro/layout.json`
- `profiles/company-brain-starter-en/.gitignore`
- `protocol/README.md`
- `protocol/access-grant.schema.json`
- `protocol/access-receipt.schema.json`
- `protocol/collector-binding.schema.json`
- `protocol/examples/access-grant.v1.json`
- `protocol/examples/access-receipt.v1.json`
- `protocol/examples/executor-binding.v1.json`
- `protocol/examples/collector-binding.v1.json`
- `protocol/examples/routine-contract.v1.json`
- `protocol/examples/routine-run-receipt.v1.json`
- `protocol/examples/routine-migration.v1.json`
- `protocol/examples/judgment-receipt.v1.json`
- `protocol/examples/correction-run-receipt.v1.json`
- `protocol/examples/learning-candidate.v1.json`
- `protocol/examples/run-record.v2.json`
- `protocol/examples/source-contract.v1.json`
- `protocol/examples/system-contract.v2.json`
- `protocol/run-record-v2.schema.json`
- `protocol/executor-binding.schema.json`
- `protocol/routine-contract.schema.json`
- `protocol/routine-run-receipt.schema.json`
- `protocol/routine-migration.schema.json`
- `protocol/judgment-receipt.schema.json`
- `protocol/correction-run-receipt.schema.json`
- `protocol/learning-candidate.schema.json`
- `protocol/source-contract.schema.json`
- `protocol/system-contract-v2.schema.json`
- `scripts/lib/company-brain-protocol-v2.mjs`
- `scripts/lib/console-read-model.mjs`
- `scripts/lib/context-snapshot-runtime.mjs`
- `scripts/lib/access-runtime.mjs`
- `scripts/lib/model-executors.mjs`
- `scripts/lib/routine-protocol.mjs`
- `scripts/lib/routine-runtime.mjs`
- `scripts/lib/judgment-protocol.mjs`
- `scripts/lib/legacy-system-import.mjs`
- `scripts/lib/correction-loop.mjs`
- `scripts/lib/secret-provider.mjs`
- `scripts/lib/system-protocol.mjs`
- `scripts/protocol-validate.mjs`
- `scripts/runtime-access.mjs`
- `scripts/runtime-secret.mjs`
- `scripts/routine-runtime.mjs`
- `scripts/console-bootstrap.mjs`
- `scripts/console-server.mjs`
- `scripts/import-system-manifests.mjs`
- `scripts/source-contract.mjs`
- `scripts/system-run.mjs`
- `scripts/test-access-runtime.mjs`
- `scripts/test-company-brain-protocol-v2.mjs`
- `scripts/test-company-brain-starter.mjs`
- `scripts/test-routine-runtime.mjs`
- `scripts/test-judgment-protocol.mjs`
- `scripts/test-correction-loop.mjs`
- `scripts/test-console-server.mjs`
- `scripts/test-context-snapshot-runtime.mjs`
- `scripts/test-legacy-system-import.mjs`
- `scripts/validate-product.mjs`
- `console/app.js`
- `console/index.html`
- `console/styles.css`
