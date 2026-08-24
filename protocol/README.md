# Protocolo do Cérebro INEVITA

O protocolo permite que Sistemas diferentes convivam sem perder observabilidade, proveniência ou
autoridade humana. Ele padroniza as bordas; não substitui o julgamento da empresa e não carrega
conteúdo bruto.

## Os nove envelopes

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
- `routine-run-receipt.schema.json`: recibo privado de cada tentativa, com status, reason code e
  referências de entrada/saída, mas sem prompt, output ou erro cru. Se o binding nem existe, o
  adapter fica honestamente `unresolved` e a execução é negada antes de ler o prompt.

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

## Compatibilidade sem mentira

| Envelope | V1 | V2 |
|---|---|---|
| System Contract | válido e imutável; leitura mostra `retrieval-not-declared` | válido; Retrieval Contract obrigatório |
| Run Record | válido e imutável; leitura mostra `context-not-recorded` | válido; Context Snapshot obrigatório |
| Source Contract | V1 | — |
| Access Grant | V1 | — |
| Routine Contract | V1 | — |
| Executor Binding | V1 privado | — |
| Routine Run Receipt | V1 privado | — |

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
node scripts/protocol-validate.mjs routine-receipt protocol/examples/routine-run-receipt.v1.json
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

O runtime opcional desta versão é um engine local com CLI e biblioteca de conectores confiáveis;
ainda não é o servidor nem a interface do Console. Arquivos e agente continuam funcionando sem
ele. Quando o Sistema exige `runtime-enforced`, o engine aplica o Access Grant antes de entregar a
credencial ao conector e deixa um Access Receipt privado em `.cerebro/runtime/receipts/access/`.

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

```bash
node scripts/routine-runtime.mjs install caminho/routine-contract.json --confirm
node scripts/routine-runtime.mjs binding executor-codex-local --adapter=codex-cli \
  --host=host-owner-local --workspace-ref=company-brain-local --workspace=. \
  --model=gpt-5.6-sol --permission=read-only --confirm
node scripts/routine-runtime.mjs run funil-diario-cerebro --confirm
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
