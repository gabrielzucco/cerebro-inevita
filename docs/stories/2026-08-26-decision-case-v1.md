# Story — Decision Case V1: o martelo humano na fonte canônica

## Contexto

O Runs Explorer fechou a linha do tempo das execuções e deixou explícito o que ficava de fora:
"Decision Case com veredito escrito no vault (mesa futura, própria)". Esta é a mesa.

Até aqui o Console mostrava a fila única de decisão (`gera_fila_decisao.py` → `_FILA-DECISAO.json`)
como leitura — e parava. O martelo acontecia fora, e o registro dependia de alguém lembrar de
escrever a nota, com a evidência que tinha na cabeça no momento. A fila girava sem deixar rastro
auditável de *por que* girou.

Decision Case fecha o ciclo sem inverter a autoridade: **o Console prepara o caso; o humano decide.**
O Console reúne o item, resolve a evidência com proveniência carimbada, monta a nota inteira e
mostra o diff exato. Escrever só acontece depois que a pessoa confirma aquele diff — e o que se
escreve é byte a byte o que ela leu.

Fonte canônica de uma decisão neste cérebro: `01-nucleo-privado/decisoes/`, a casa de
`tipo: decisao` no schema do vault (`CASAS_POR_TIPO` em `valida_vault.py`). A nota é o único
artefato canônico que o caso escreve; recibo, snapshot e histórico ficam no runtime privado.

## Acceptance criteria

- [x] **Autoria humana**: `approved_by` obrigatório nas três ações; ref de agente/bot/console/modelo
      é recusada (`human-authorship-required`), e o recibo exige `authorship: human`. O rascunho
      que o Console entrega é estrutura — `draft.decision_text` é string vazia, sempre.
- [x] **Evidência**: pelo menos uma referência além do próprio item da fila
      (`evidence-beyond-queue-required`); referência que não abre no disco derruba o caso
      (`evidence-not-found`). Tipos aceitos: `decision-queue`, `routine-receipt`,
      `judgment-receipt`, `run-record`, `experiment`, `note` (só `01-nucleo-privado/`, nunca a
      zona de terceiros).
- [x] **Proveniência**: cada evidência sai carimbada como `observed` (artefato deixado por
      execução), `declared` (contrato ou nota humana) ou `inferred` (candidato que o Console
      apontou por casamento de texto e o humano aceitou). O carimbo é derivado do artefato, não
      aceito do payload. A nota publica a tabela com ref, proveniência, caminho e sha256.
- [x] **Preview do diff**: `POST .../preview` resolve tudo, monta a nota e devolve diff unificado
      (LCS real) + `plan_digest` + `decided_at`. Não escreve nada — asserção no teste unitário e
      no HTTP.
- [x] **Confirmação explícita**: `POST .../apply` exige sessão, CSRF, `confirm: true` e o mesmo
      `plan_digest`. Qualquer campo alterado depois do preview responde `preview-stale`; preview com
      mais de 15 min responde `preview-expired`. Na UI, mexer em qualquer campo mata a simulação.
- [x] **Idempotência**: caso já aplicado devolve `already-applied` com o recibo existente e não
      toca em disco. A nota é criada com abertura exclusiva (`wx`) — nunca sobrescreve.
- [x] **Recibo auditável**: evento imutável em `.cerebro/runtime/receipts/decisions/<case-id>/`,
      com schema fechado e validador. Guarda referência, proveniência e impressão; **nunca** o texto
      da decisão (`decision_text_recorded: false`, só o digest e a contagem de caracteres).
- [x] **Rollback**: `POST .../rollback` guarda cópia privada em `.cerebro/runtime/decisions/`,
      apaga a nota e grava o evento `rolled-back` com `reason_code` de conjunto fechado. Se a nota
      mudou depois do martelo, para em `rollback-conflict` e não apaga nada. Reverter duas vezes é
      idempotente; caso revertido volta a ser decidível.
- [x] Gate de PII e segredo no texto e no título antes de qualquer escrita (e-mail, telefone, CPF,
      chave/token) — a nota nasce compatível com `valida_vault.py`.
- [x] Veredito é `decided` · `dropped` · `deferred`; adiar exige data explícita de revisão no
      futuro (a regra de envelhecimento do vault: resolve, mata ou adia com data — sem terceira
      opção silenciosa).
- [x] Nenhuma ação externa: `external_action_executed: false` em todas as respostas e recibos.
- [x] View `Decisões` no grupo Julgamento/Rotinas/Execuções, com fila, caso, formulário, evidência,
      diff colorido, bloco de registrado e reversão — e as fronteiras escritas na tela.

## Fora deste corte

- Fechar o item na origem (painel, `_ESCALAR.md`, experimento). A fila é derivada: o item some
  quando a fonte dele muda. O caso registra o martelo; quem apaga o item da origem continua sendo
  quem escreve na origem.
- Casos que não nascem da fila única (decisão avulsa sem item aberto).
- Editar nota de decisão existente. V1 só cria e reverte — `update` já está previsto no diff e no
  schema (`before_digest`), mas não tem caminho de escrita.
- Publicar recibo do caso no `_PAINEL.md` ou no histórico do painel.

## Resultado

Rodado ao vivo contra um cérebro sanitizado (fila com 2 itens, painel e recibo de rotina como
candidatos a evidência):

1. A view lista os casos com estado (`Espera martelo` · `Registrado no vault` · `Revertido`),
   idade e a casa canônica pronta.
2. O caso abre com o item, os candidatos a evidência já carimbados (`observado` para o item da
   fila e o recibo de rotina, `declarado` para a nota do painel) e o campo do martelo vazio.
3. Simular devolveu o diff de 45 linhas do arquivo
   `01-nucleo-privado/decisoes/2026-08-26-decision-case-entra-agora-com-martelo-humano.md`,
   sem tocar no disco.
4. Registrar criou a nota exatamente igual ao diff (1863 bytes, sha256 conferido na leitura de
   volta) e o recibo `applied` com as duas evidências e suas impressões.
5. Registrar de novo devolveu `already-applied` sem segundo arquivo nem segundo evento.
6. Reverter apagou a nota, guardou a cópia privada em
   `.cerebro/runtime/decisions/<case-id>/` e deixou o evento `rolled-back` com
   `reason_code: wrong-evidence`. O caso voltou para "Revertido" e ficou decidível de novo.

O EXP-DEMO-001 citado no título de um dos itens virou candidato `inferido` e **não** entrou na
lista de candidatos porque o contrato não existia naquele cérebro — candidato que não abre não é
candidato.

## Revisão 26/08 — 5 P1 corrigidos

A revisão pós-implementação bloqueou o landing com 5 P1; todos corrigidos e cobertos por teste:

1. **Ordem causal**: eventos ganharam `sequence` declarada (1, 2, 3…), verificada na gravação
   contra o histórico em disco (`decision-case-sequence-conflict` em corrida) e usada na
   ordenação — timestamp empatava com relógio congelado e o desempate por UUID era aleatório
   (a suíte HTTP ficava vermelha ~50% dos runs; 8 runs seguidos verdes após o fix). Filename do
   recibo agora é prefixado pela sequência.
2. **Rollback compensado** (não atômico a queda de processo): o recibo de reversão é validado ANTES
   do unlink; se a gravação falhar depois, a nota volta dos bytes em memória. Queda do processo entre
   o unlink e o recibo não é coberta — o snapshot gravado antes da remoção é a recuperação; os bytes
   nunca se perdem. Teste força EACCES no diretório de recibos e prova
   que a nota reaparece e o estado continua `applied`.
3. **Autoria**: o cliente não autodeclara mais `authored_by_human: true` — virou checkbox
   explícito, desmarcado por padrão, com texto honesto sobre a garantia real (asserção humana
   auditável, não autenticação; o Console local não tem sistema de identidade). Documentado no
   `protocol/README.md`.
4. **Validador estrito**: `kind` em enum fechado, `path` tipado (string ≤512 ou null), `bytes`
   inteiro ≥0, `queue_key` ≤512, `sequence` obrigatória — os payloads exatos da revisão
   (`kind: "anything"`, `path: 42`, `bytes: "not-a-number"`) agora falham no teste.
5. **Fronteira por realpath**: evidência `note:` e o alvo da reversão validam o realpath contra a
   fronteira real — symlink-dir dentro do núcleo apontando para fora do cérebro ou para
   `02-dados-terceiros/` é recusado (teste com dois symlinks de escape).

Também: `review_on` exige data de calendário real (2026-02-30 não vira março) e os cards de caso
respondem a Enter/Space no handler global de `role="button"`.

### Re-revisão 26/08 — 2 P1 + 3 P2 corrigidos

1. **TOCTOU da sequência (P1)**: o filename do recibo virou a própria sequência (`0001.json`…) e a
   gravação usa `link(2)` exclusivo — dois processos em corrida nunca conseguem dois recibos N+1;
   o perdedor cai em `sequence-conflict` e compensa. Teste prova o nome determinístico e o
   fail-stop quando o histórico contém recibo ilegível.
2. **Fronteira antes da leitura (P1)**: em evidência `note:`, o realpath é provado ANTES de
   qualquer stat/read/hash do alvo — recusar depois de ler já é ter lido.
3. **`recorded_at` estrito (P2)**: `isInstant` exige o formato exato de `toISOString` com
   round-trip; `"0"` e `2026-02-30T…` agora falham (no teste).
4. **Checkbox sem corrida input/change (P2)**: `authored` saiu do handler de `input` (que gravava
   `"on"` como string e podia renderizar antes do `change`); o `change` é o dono único.
5. **Wording (P2)**: "atômico" rebaixado para **compensado** no código, no protocolo e nesta story,
   com o snapshot pré-remoção documentado como recuperação para queda de processo.

### Re-re-revisão 26/08 — 2 P1 + 1 P2 corrigidos

1. **Leitura no realpath provado (P1)**: depois de validar a fronteira, a evidência `note:` era
   lida pelo caminho lexical original — um symlink de diretório trocado entre validação e leitura
   levaria o `readFileSync` para outro lugar. Agora `fileEvidence` lê o `realNote` provado e
   exibe o caminho lógico (`displayPath`). Teste com symlink interno legítimo prova que o digest
   é do conteúdo no realpath e o path exibido é o que a pessoa escolheu.
2. **Limpeza do tmp best-effort (P1)**: depois do `link(2)`, o recibo está publicado; se o
   `unlink` do tmp lançasse, o chamador compensaria desfazendo a nota com o recibo final já de
   pé. A limpeza virou try/catch engolido — tmp órfão é lixo inofensivo, nunca motivo de
   compensação.
3. **Render no toggle de autoria (P2)**: desmarcar o checkbox invalidava o preview no estado mas
   não renderizava — o diff antigo e o botão ficavam na tela com `preview === null` por trás.
   O handler agora renderiza.

**Nota de processo**: o commit `8b2810b` varreu, no `validate-product.mjs`, a linha da migração de
traces de outra mesa (editada entre a leitura e o commit — o risco exato documentado em
mesas-paralelas). A migração em si está em commit próprio (`82e006c`, da outra mesa); com mesa
paralela ativa, reescrever histórico seria pior que registrar o acoplamento aqui.

## File List

- `scripts/lib/decision-case.mjs` — protocolo e runtime do caso: fila, evidência com proveniência,
  render da nota, diff unificado, plano/digest, apply idempotente, rollback com snapshot e o
  validador do recibo
- `protocol/decision-case-receipt.schema.json` — envelope V1 do recibo
- `protocol/examples/decision-case-receipt.v1.json` — exemplo sanitizado
- `protocol/README.md` — envelope na lista, linha na tabela de compatibilidade e seção
  "Decision Case — o martelo humano na fonte canônica"
- `scripts/console-server.mjs` — `GET /api/decision-cases`, `GET /api/decision-cases/:id`,
  `POST .../preview`, `POST .../apply`, `POST .../rollback`; `assertAuthenticatedPost` extraído de
  `assertMutation` (preview não é mutação e não pede confirmação)
- `scripts/validate-product.mjs` — schema, exemplo, lib e teste no harness
- `scripts/test-decision-case.mjs` — suíte do protocolo (recusas, preview sem escrita, diff exato,
  idempotência, recibo sem texto, conflito de reversão, redecisão)
- `scripts/test-console-server.mjs` — round-trip HTTP real do caso
- `console/app.js` — view `cases` (fila, caso, formulário, evidência, diff, registrado, reversão),
  estado do formulário, invalidação da simulação e labels do vocabulário do martelo
- `console/styles.css` — bloco Decision Case + `.case-path`/`.case-hint`
- `console/index.html` — `cases` no grupo de views da nav e bump de cache (hoje `?v=7`)
- `docs/stories/2026-08-26-decision-case-v1.md` — esta story

## Verificação

- `npm test` verde · `node scripts/test-decision-case.mjs` verde ·
  `node scripts/test-console-server.mjs` verde · suíte inteira (`scripts/test-*.mjs`) verde antes
  do commit.
- Verificado ao vivo no navegador contra um cérebro sanitizado servido pelo próprio
  `console-server.mjs`: lista, caso, formulário com estado preservado entre renders, evidência com
  proveniência, diff colorido, registro, idempotência, reversão e histórico do caso.
- Corrigido na verificação visual: caminho de arquivo aparecia em caixa alta (herdado de `.micro`),
  o que mente sobre um path case-sensitive — passou a usar `.case-path`.
