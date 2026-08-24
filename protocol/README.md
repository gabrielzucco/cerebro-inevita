# Protocolo do Cérebro INEVITA

O protocolo permite que Sistemas diferentes convivam sem perder observabilidade, proveniência ou
autoridade humana. Ele padroniza as bordas; não substitui o julgamento da empresa e não carrega
conteúdo bruto.

## Os dezessete envelopes

- `capability-contract.schema.json`: o know-how portátil que pode circular pela Society.
- `source-contract.schema.json`: a casa da verdade, escopo, autoridade, modos e garantia de uma
  Fonte, sempre reference-only.
- `system-contract.schema.json` / `system-contract-v2.schema.json`: a Capability ligada ao
  resultado, fontes, entidades, permissões, pipeline, eval e política de aprendizado da empresa;
  V2 acrescenta o Retrieval Contract.
- `run-record.schema.json` / `run-record-v2.schema.json`: o recibo estruturado da execução; V2
  acrescenta o Context Snapshot exato do que foi selecionado por referência.
- `access-grant.schema.json`: a concessão local que autoriza sujeito, Fontes, Sistemas, ações,
  prazo e garantia. Não é o grant de download de pacote da Society.
- `access-receipt.schema.json`: o recibo reference-only de allow, deny, falha, revogação ou
  degradação; registra se a credencial estava presente, ausente ou sequer foi consultada.
- `routine-contract.schema.json`: quando, onde e com qual executor um Sistema roda, quais grants
  consulta, onde entrega e quais políticas de timeout, retry e idempotência aplica.
- `executor-binding.schema.json`: binding privado entre a Rotina e um cliente oficial local
  (`codex` ou `claude`) já autenticado pelo dono; nunca contém OAuth ou API key.
- `collector-binding.schema.json`: binding privado para uma preparação determinística confiável
  (`python3` ou `node` por argv fechado) produzir um snapshot antes da interpretação do modelo.
- `routine-run-receipt.schema.json`: recibo privado de cada tentativa, com status, reason code e
  referências de entrada/saída, mas sem prompt, output ou erro cru. Se o binding nem existe, o
  adapter fica honestamente `unresolved` e a execução é negada antes de ler o prompt.
- `routine-migration.schema.json`: readback privado da agenda legada, do risco de relógio duplo e
  da evidência humana de pausa antes do cutover; nunca carrega o payload da agenda antiga.
- `judgment-receipt.schema.json`: evento privado e imutável que liga o julgamento humano ao run,
  sem copiar output ou executar a intenção de ação.
- `correction-run-receipt.schema.json`: liga baseline, julgamento e novo Run por referência; a
  correção atravessa o provider somente em memória e não entra no envelope.
- `learning-candidate.schema.json`: registra que um Run corrigido e aprovado virou candidato
  `1/3`, sem copiar conteúdo nem alterar automaticamente o motor.
- `execution-trace-event.schema.json`: evento privado, ordenado e append-only do caminho real do
  Run. Registra estados e referências, nunca prompt, output, payload ou erro cru. Skill concluída
  exige evidência de leitura bem-sucedida e hash. `chain_id` costura execuções; eventos de Modelo
  e Conector só existem quando observados e carregam o nível de assurance disponível.
- `experiment-contract.schema.json`: pré-registro congelado de uma mudança controlada, ligado ao
  Sistema palco, Sistemas de leitura, braços, métrica, guardrails, janela e regra de decisão.
- `experiment-state.schema.json`: estado privado pós-congelamento, com emendas, Runs ligados,
  chains de handoff atravessadas, medição, martelo e referência da mudança que voltou para o
  Sistema.
- `handoff-contract.schema.json`: declara que um Sistema produtor entrega um artefato versionado
  a um Sistema consumidor, com schema, versões aceitas, trigger e gate de aceitação. A aresta
  entre Sistemas só existe quando este contrato existe; Fonte compartilhada não é conexão.
- `handoff-receipt.schema.json`: prova de um handoff real — `chain_id` genérico de runtime, Run
  produtor, artefato com hash e schema validado, resultado do gate, Run consumidor e modo
`replay` ou `live` (replay nunca se apresenta como execução original). Reference-only.

Run Record V2 pode declarar `chain_id`, `mode`, `experiment_ref` e `handoff_refs`. A chain é
genérica: existe para qualquer pipeline entre Sistemas; Experimento apenas aponta para ela quando
há uma mudança controlada. Handoff Contract acende no Canvas somente quando o runtime encontra um
Handoff Receipt aceito e compatível com os dois Runs, os dois Traces, o schema, a versão e o hash
do artefato.

Os artefatos que atravessam handoffs têm schema próprio em `protocol/artifacts/` (por exemplo
`creative-brief.schema.json` e `funnel-reading.schema.json`); o System Contract V2 declara em
`artifacts.produces/consumes` a interface de máquina, enquanto `result.output_type` segue como
descrição humana.

O conteúdo privado continua na casa de verdade do dono. Os envelopes usam IDs, referências locais
e marcadores de versão/frescor. Um Run Record pode apontar para um output, fragmento ou correção,
mas nunca copia seu conteúdo para o ledger.

## Invariante

```text
capability compartilhável
+ contexto e bindings locais
+ recuperação declarada
+ execução observável
+ julgamento humano
= Sistema proprietário sem fragmentação
```

Todo Sistema pode ter implementação própria. Para entrar no control plane, precisa declarar
`system_id`, versão, resultado, entidades, fontes, Capability, permissões, eval e aprendizado. Um
Sistema V2 também declara prioridade, seleção, frescor, conflito, fallback, parada, orçamento e
proveniência da recuperação. Toda execução V2 deixa o Context Snapshot correspondente.

## Brain Manifest V1 + diagnóstico de compatibilidade

`.cerebro/manifest.json` identifica uma instalação compatível sem virar inventário paralelo. Ele
declara versão do Manifest, perfil, referências para versão/identidade/layout, entrypoints,
fronteira de runtime e privacidade e versões de envelopes aceitas. Fontes, Sistemas, Runs,
bindings e estados continuam nas suas casas canônicas.

Compatibilidade exige integridade referencial: versão, layout e entrypoints precisam existir como
arquivos locais reais, sem symlink. Perfis `full` e `legacy-compatible` também precisam possuir a
identidade privada apontada por `identity_ref`; o starter pode permanecer `unassigned` até a
ativação criar `.cerebro/id` fora do Git.

O diagnóstico é local e somente leitura:

```bash
node scripts/compatibility-diagnostic.mjs --root=/caminho/do/cerebro
```

Ele classifica `new`, `organized-context`, `partial-brain` ou `inevita-compatible` e separa isso
do estágio `foundation`, `contracted` ou `operational`. Uma instalação starter pode ser compatível
e ainda não possuir uma Fonte ou um Run; um vault legado pode operar Sistemas reais e ainda dever
formalizar seu Manifest. O scanner lê apenas marcadores técnicos, contratos e recibos: não abre
conteúdo humano, não conecta Fonte e não migra o alvo.

O plano sempre preserva o que já é canônico e mantém migração em
`preview → diff → confirmação`.

## Compatibilidade sem mentira

| Envelope | V1 | V2 |
|---|---|---|
| System Contract | válido e imutável; leitura mostra `retrieval-not-declared` | válido; Retrieval Contract obrigatório |
| Run Record | válido e imutável; leitura mostra `context-not-recorded` | válido; Context Snapshot obrigatório |
| Source Contract | V1 | — |
| Access Grant | V1 | — |
| Routine Contract | V1 | — |
| Executor Binding | V1 privado | — |
| Collector Binding | V1 privado | — |
| Routine Run Receipt | V1 privado | — |
| Routine Migration Readback | V1 privado | — |
| Judgment Receipt | V1 privado | — |
| Correction Run Receipt | V1 privado | — |
| Learning Candidate | V1 privado | — |
| Execution Trace Event | V1 privado | — |

Os readers são dual-read. Os writers antigos continuam V1 e não injetam campos nos schemas
fechados. O runner file-only recusa executar um System Contract V2 porque ainda não consegue
produzir o Context Snapshot: aceitar e omitir seria um recibo falso. Migração é sempre preview →
diff → confirmação; o registro legado permanece disponível como rollback.

Os hashes dos schemas V1 são travados pelo harness para impedir alteração acidental:

- `system-contract-v1`: `21121ad06dbc219030972b990fdbd83307e7d42d052abc50bd7861a553de423a`
- `run-record-v1`: `14562c240d6049b7066a2979cacfde06e91c90beddc2fef30f80c6049fe8ff80`

## Níveis de garantia

- `runtime-enforced`: o runtime possui custódia exclusiva da credencial/ação e pode negar ou
  revogar acesso futuro.
- `receipt-audited`: o agente consegue acessar diretamente; o contrato limita e o Run registra,
  mas não existe ACL preventiva.
- `exported`: uma cópia saiu da custódia. O contrato declara que ela é irreversível e não promete
  revogação retroativa.

Fonte local nunca pode declarar `runtime-enforced`. Segredo, token, transcrição, corpo ou conteúdo
bruto em qualquer contrato/snapshot reprova no validador; use somente `credential_ref`,
`selected_refs`, `detail_ref` e recibos locais.

## CLI opcional

O protocolo continua funcionando somente por arquivos. Quando Node estiver disponível, os helpers
validam os mesmos contratos:

```bash
node scripts/protocol-validate.mjs source protocol/examples/source-contract.v1.json
node scripts/protocol-validate.mjs system protocol/examples/system-contract.v2.json
node scripts/protocol-validate.mjs run protocol/examples/run-record.v2.json
node scripts/protocol-validate.mjs grant protocol/examples/access-grant.v1.json
node scripts/protocol-validate.mjs receipt protocol/examples/access-receipt.v1.json
node scripts/protocol-validate.mjs routine protocol/examples/routine-contract.v1.json
node scripts/protocol-validate.mjs executor protocol/examples/executor-binding.v1.json
node scripts/protocol-validate.mjs collector protocol/examples/collector-binding.v1.json
node scripts/protocol-validate.mjs routine-receipt protocol/examples/routine-run-receipt.v1.json
node scripts/protocol-validate.mjs routine-migration protocol/examples/routine-migration.v1.json
node scripts/protocol-validate.mjs judgment protocol/examples/judgment-receipt.v1.json
node scripts/protocol-validate.mjs correction protocol/examples/correction-run-receipt.v1.json
node scripts/protocol-validate.mjs learning protocol/examples/learning-candidate.v1.json
node scripts/protocol-validate.mjs trace protocol/examples/execution-trace-event.v1.json
node scripts/system-contract.mjs register caminho/contract.json --confirm
```

O registro simples atual migra de forma aditiva. Sem `--confirm`, o comando mostra o contrato
anterior, o posterior, o caminho de saída e a estratégia de rollback; ele não abre a Fonte:

```bash
node scripts/source-contract.mjs migrate-registry
node scripts/source-contract.mjs migrate-registry --confirm
```

A migração cria `.cerebro/contracts/sources/<source-id>.json`, nunca reescreve
`conexoes/configuradas/fontes.json` e bloqueia conflito com contrato já existente.

## Runtime local mínimo

O runtime opcional é um engine local com CLI e biblioteca de conectores confiáveis. Arquivos e
agente continuam funcionando sem ele. Quando o Sistema exige `runtime-enforced`, o engine aplica o
Access Grant antes de entregar a credencial ao conector e deixa um Access Receipt privado em
`.cerebro/runtime/receipts/access/`.

```bash
node scripts/runtime-secret.mjs status
node scripts/runtime-secret.mjs set os-keychain:minha-fonte
node scripts/runtime-secret.mjs has os-keychain:minha-fonte
node scripts/runtime-access.mjs install caminho/access-grant.json --confirm
node scripts/runtime-access.mjs check grant-id --subject=sistema-id --system=sistema-id \
  --source=fonte-id --action=read-data --mode=read
node scripts/runtime-access.mjs revoke grant-id --approved-by=role-owner --confirm
node scripts/runtime-secret.mjs delete os-keychain:minha-fonte --confirm
```

- macOS usa Keychain; Linux usa Secret Service (`secret-tool`); Windows usa DPAPI do usuário;
- o segredo nunca é aceito em argumento de linha de comando e não entra em grant, recibo ou log;
- `credential_ref` de acesso gerenciado precisa ser namespaced, como `os-keychain:fonte`;
- não existe comando genérico de execução: só um conector confiável chama `executeWithGrant`, e
  resultado que tente devolver a própria credencial é bloqueado;
- revogar impede usos futuros daquele grant, mas não apaga uma credencial que outros grants podem
  compartilhar;
- sem provider, `runtime-enforced` é negado; `receipt-audited` e `exported` degradam honestamente
  para file-only, sem prometer ACL ou revogação retroativa.

## Rotinas e assinatura do dono

Rotina não é um segundo Sistema. O Sistema define o resultado; a Rotina define gatilho,
placement, executor, contexto, destino e política operacional. O contrato pode circular sem
conteúdo. Binding, estado, outputs e recibos ficam em `.cerebro/runtime/`, fora do Git.

O worker V1 chama somente os clientes oficiais `codex exec` e `claude -p`. Ele usa a sessão que o
dono já autenticou no próprio cliente: não copia OAuth, não transforma assinatura em API key e não
promete modelo fora do plano. O prompt entra por `stdin`, nunca em `argv`; `cwd`, permissão e
timeout vêm do contrato. O conteúdo necessário atravessa o provider escolhido, mas nunca a
INEVITA.

Quando a Rotina declara `extensions.preparation`, o runtime primeiro executa um Collector Binding
local confiável, sem shell e sem guardar stdout. O coletor determinístico acessa as Fontes já
concedidas e grava um snapshot por referência; só então o modelo recebe a instrução para interpretar
esse snapshot. Falha, timeout ou output ausente impedem a chamada ao modelo.

Para um System Contract V2, `extensions.preparation.source_selections` liga cada `source_ref` aos
JSON Pointers do artefato agregado que pertencem àquele papel e, opcionalmente, ao ponteiro de
frescor. O runtime valida todos os recortes obrigatórios antes do provider, guarda uma cópia privada
content-addressed em `.cerebro/runtime/context-artifacts/` e conclui com Run Record V2. O ledger
recebe somente hash/referência, ponteiros, filtros, janela, frescor, lacunas e garantia — nunca os
valores recuperados. Uma seleção `receipt-audited` prova o rastro do contrato, não uma ACL que o
agente local não possui.

```bash
node scripts/routine-runtime.mjs install caminho/routine-contract.json --confirm
node scripts/routine-runtime.mjs binding executor-codex-local --adapter=codex-cli \
  --host=host-owner-local --workspace-ref=company-brain-local --workspace=. \
  --model=gpt-5.6-sol --permission=read-only --confirm
node scripts/routine-runtime.mjs run funil-diario-cerebro --confirm
node scripts/routine-runtime.mjs collector-install caminho/collector-binding.json --confirm
node scripts/routine-runtime.mjs migration-install caminho/routine-migration.json --confirm
node scripts/routine-runtime.mjs migration-pause-confirm funil-diario-cerebro \
  --evidence=readback:agenda-antiga-pausada --approved-by=role-owner --confirm
node scripts/routine-runtime.mjs activate funil-diario-cerebro \
  --evidence=routine-receipt:RECIBO --approved-by=role-owner --confirm
node scripts/routine-runtime.mjs due
node scripts/routine-runtime.mjs tick
node scripts/routine-runtime.mjs pause funil-diario-cerebro --approved-by=role-owner --confirm
```

Ativar exige um run manual concluído da mesma versão. Pausa impede ocorrências futuras; não desfaz
uma execução consumada. O slot agendado é idempotente e a concorrência é `forbid`. Nesta versão,
um Access Grant `runtime-enforced` sem conector dedicado continua negado; a sessão do modelo não
recebe a credencial.

Rotina importada de Claude, Codex, launchd, cron ou GitHub Actions nasce desativada. Quando existe
risco de relógio duplo, ativar ou retomar falha com `legacy-schedule-not-paused` até o dono registrar
um readback reference-only da pausa legada. O runtime não declara que pausou uma agenda que não
controla.

## Console local de Rotinas

O Console V0 é uma vista derivada dos mesmos arquivos. Vincula somente em `127.0.0.1`, cria uma
sessão efêmera HttpOnly e exige CSRF em toda mutação. `/api/console` continua reference-only; o
output privado só é servido por rota autenticada quando o dono abre explicitamente um run. Abrir,
navegar e atualizar recompila o estado sem chamar modelo. Não há telemetria de conteúdo nem banco
concorrente.

O Canvas Operacional usa três escalas sobre a mesma gramática: `/api/graphs/brain` compila Áreas,
Sistemas, Fontes e Rotinas; `/api/graphs/systems/:system-id` mostra o contrato operacional;
`/api/graphs/runs/:receipt-id` sobrepõe o Execution Trace. Cada resposta contém `nodes`, `edges` e
`states` sem abrir conteúdo privado. Runs anteriores ao protocolo aparecem como `reconstructed`;
Runs instrumentados aparecem como `recorded`. `PUT /api/graphs/layouts/:layout-key` persiste apenas
coordenadas locais com sessão, CSRF e confirmação; não altera topologia.

O runtime registra acesso, coleta, recuperação, capability, output, eval e julgamento. Uma skill
declarada no Routine Contract só ganha evento `skill/completed` quando o cliente oficial reporta
uma leitura local bem-sucedida daquele caminho. Gates registrados executam antes do Run Record
final e guardam somente IDs, booleanos, contagem de problemas e hash de evidência.

A tela de Execuções abre o Context Snapshot reference-only sem abrir o artefato privado nem chamar
modelo. A tela de Governança revoga Access Grants com confirmação explícita e CSRF; o efeito é
somente futuro, preserva o rastro passado e bloqueia o provider antes do próximo Run.

### Experimentos como objeto transversal

Experimento não é uma Fonte nem um Run. O contrato define a pergunta e a régua antes do dado; o
estado operacional registra o que aconteceu depois. Um Experimento pode atravessar vários Sistemas
e ligar vários Runs por `entity_refs[{ "role": "experiment", "id": "EXP-..." }]`.

O Console mantém hipótese, mudança, regra e veredito fora do read model resumido. A lista recebe
somente referências, contagens e estados; `/api/experiments/:id` faz a leitura privada explícita.
Se o martelo existe mas nenhuma `learning.ref` aponta para uma mudança versionada, a última etapa
permanece como lacuna. O painel não transforma uma frase de veredito em configuração por inferência.

Ledgers legados podem ganhar projeção privada sem trocar de casa da verdade:

```bash
node scripts/import-legacy-experiments.mjs \
  --root=/caminho/do/cerebro \
  --registry=.automacao/experimentos_funil.json

# depois do readback do preview
node scripts/import-legacy-experiments.mjs \
  --root=/caminho/do/cerebro \
  --registry=.automacao/experimentos_funil.json \
  --confirm
```

O importador não edita nem remove o ledger humano e marca congelamentos antigos como
`legacy-attested`; somente um freeze novo pode afirmar hash temporal verificável.

A Caixa de Julgamento grava eventos imutáveis em `.cerebro/runtime/judgments/`. Aprovar, pedir
ajuste ou rejeitar não altera a Fonte nem o output. `propose-action` registra apenas intenção local:
criar task, publicar, enviar mensagem ou reexecutar continua exigindo outro contrato e outro gesto.

Quando o julgamento atual pede ajuste, o dono pode autorizar um único rerun para aquele Judgment
Receipt. A nota privada é anexada ao prompt apenas em memória e enviada por `stdin` ao mesmo
provider; o novo Routine Run Receipt registra somente a referência do julgamento. Um Correction
Run Receipt liga baseline e resultado e libera a comparação local explícita. Se o novo output for
aprovado, outro gesto pode criar um Learning Candidate `1/3`. Isso ainda não muda o Sistema: três
casos comparáveis, replay e novo martelo continuam obrigatórios.

```bash
node scripts/console-server.mjs
# em um cofre legado, primeiro veja o preview e confirme a compatibilidade local:
node scripts/console-bootstrap.mjs --root=/caminho/do/cofre
node scripts/console-bootstrap.mjs --root=/caminho/do/cofre --confirm
node scripts/console-server.mjs --root=/caminho/do/cofre
```

O bootstrap legado não cria outro Cérebro: instala marcador/layout no próprio cofre e exclui
`.cerebro/contracts/` e `.cerebro/runtime/` apenas no clone local (`.git/info/exclude`). Conflito
com configuração existente interrompe o processo; nada é sobrescrito silenciosamente.

## Harness

`node scripts/test-company-brain-protocol-v2.mjs`, `node scripts/test-access-runtime.mjs` e
`node scripts/test-routine-runtime.mjs` provam os dois sentidos:

- exemplos bons dos quatro deltas passam;
- System Contract e Run Record V1 continuam válidos e não ganham contexto inventado;
- campo desconhecido, bruto, segredo, grant sem aprovador, garantia sem custódia, retrieval sem
  fallback/parada e snapshot sem proveniência reprovam;
- preview não escreve; confirmação cria uma vez; repetição não duplica; arquivo da Fonte e registro
  legado permanecem byte a byte intactos.
- grant válido executa uma vez; escopo negado e revogação nunca chamam o conector; falha e tentativa
  de exfiltração deixam recibo sanitizado; nenhum segredo persiste no sandbox.
- o E2E de Rotinas usa processos fake injetados: prova `run now → complete → activate → due →
  pause`, retry, slot idempotente, timeout, cliente ausente, autenticação requerida e os dois
  adapters sem consumir nenhuma assinatura real.
- o E2E do Console prova três papéis de Fonte, Context Snapshot sem bruto, correção com segundo Run
  e revogação futura bloqueando o modelo; o teste dedicado rejeita ponteiro obrigatório ausente,
  Fonte não declarada e diretório de artefatos redirecionado por symlink.
- os testes de trace, evaluator e graph read model provam ordem append-only, ausência de payload,
  skill observada versus apenas declarada, quatro gates de Calls e distinção entre caminho
  `recorded` e `reconstructed`.
