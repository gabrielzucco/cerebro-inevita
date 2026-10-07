# Sistemas da comunidade: operação local

Esta é a **candidata local CS1**, sobre o cliente Cérebro 1.38.0. Este guia não declara o backend liberado em produção, um sistema publicado nem uma contribuição humana aprovada. Os testes usam instalações e identidades sintéticas; aprovação técnica, instalação e contribuição representam **zero ciclos reais e zero prova de mercado**.

O cliente precisa de Node.js 18 ou mais recente. O Funil usa Python 3.9 ou mais recente para o próprio método; a instalação não executa Python, scripts ou skills do pacote. Os comandos remotos abaixo só devem ser usados com um ambiente autorizado e compatível. Não foram executados contra produção nesta entrega.

## Compatibilidade e ordem de atualização

Atualize o **cliente do membro antes de exigir o novo contrato no backend**. O cliente precisa dos serviços `community-*`, do instalador V2, das regras de privacidade e do envio da credencial de instalação. Copiar apenas um comando novo para um Cérebro antigo não constitui uma atualização compatível.

Conserve `.cerebro/id`, `.cerebro/install-credential` e o contexto privado durante a atualização pelo processo oficial. Não gere outra identidade para contornar um erro de acesso. A credencial permanece local e não deve ser copiada para argumentos, chat, configuração MCP ou logs.

Na liberação, coordene cliente e backend de distribuição: identidade de instalação existente, ações de catálogo/grant/recibo/contribuição e envelope V2. Mantenha suporte ao envelope schema1 de Calls. O acesso é decidido pela plataforma em cada ação; um `member_id` informado pelo cliente não concede autoridade. Não há uma tag de produção nova autorizada por este guia.

O wrapper atual do Funil usa `funil-e-crescimento`, system ID `sistema-funil-inevita`, canal `pilot` e visibilidade `validation-lab`. O acesso `public` no contrato de release significa o público autorizado da comunidade; o manifesto legado usa `society_members`. Ambos os contadores de prova real começam em zero. O produto founding `funil-vivo` não é substituído por inferência.

## Ajuda, catálogo e detalhes

Execute na raiz do Cérebro que contém estes scripts:

```sh
node scripts/community.mjs --help
node scripts/community.mjs list
node scripts/community.mjs show --slug=funil-e-crescimento
```

`--help` não lê credenciais, usa rede ou escreve. `list` e `show` consultam o serviço. A raiz padrão é a instalação que contém o script; para uma raiz diferente, defina explicitamente `CEREBRO_INSTALL_ROOT` no processo. Nenhum desses comandos instala algo globalmente.

O endpoint padrão é o serviço `cerebro-system-distribution` da plataforma. `CEREBRO_DISTRIBUTION_URL` permite um endpoint explicitamente configurado. Use HTTPS; fixtures HTTP locais exigem uma opção de teste específica, descrita ao final. Não forneça uma URL desconhecida: o serviço recebe o vínculo da instalação.

## Conferir e instalar

Primeiro consulte a versão e o hash atuais:

```sh
node scripts/community.mjs install --slug=funil-e-crescimento
```

Sem `--confirm`, o resultado tem `status: preview`, `writes: false` e `grant_consumed: false`. Esta é uma prévia dos metadados da release: não baixa o bundle, não valida ainda todos os arquivos ou conflitos locais e não cria identidade de instalação.

Depois de revisar a release, substitua o marcador pelo `release.package_sha256` exibido e confirme:

```sh
node scripts/community.mjs install \
  --slug=funil-e-crescimento \
  --sha256=HASH_DA_RELEASE_REVISADA \
  --runtime=codex \
  --confirm
```

A aplicação reconfere a release, solicita/resgata o grant, valida o pacote e chama o instalador compartilhado com o CLI oficial e o MCP. Hash diferente bloqueia a instalação. Ao solicitar outra tentativa, revise o estado: o download pode ter consumido o grant antes de uma falha local. O fluxo `community install` solicita nova autorização, preservando a instalação íntegra já existente.

O resultado V2 inclui `refs`, `entrypoint`, `first_task`, `status: installed` e `remote_receipt`. O estado de operação do sistema continua `package_added`: fontes ainda precisam ser configuradas e o primeiro trabalho precisa de revisão humana.

A distribuição V2 fica organizada assim, com caminhos relativos à raiz do Cérebro:

```text
sistemas/outros-instalados/<slug>/
  releases/<versao>-<hash>/
    bundle/                 árvore original, byte a byte
    contracts/              contratos externos ao bundle
    package.json            envelope exato
    installation.json       recibo técnico local
  manifest.json             wrapper operacional
  release.json
  contract.json
  capability.json
  manifest.md               orientação de entrada
  workspace/                destino reservado ao trabalho privado
.cerebro/sistemas/<slug>.json
```

O instalador reserva a localização do workspace, mas não o inicializa. Abra o `entrypoint` retornado e siga `first_task` e o método do pacote para revisar/inicializar o trabalho. No Funil, conserve o bundle original e faça alterações de trabalho no workspace. A instalação não copia `AGENTS.md`, `CLAUDE.md` ou skills para as configurações globais do membro. Acrescenta somente regras privadas ausentes ao `.gitignore` do destino.

Schema1 continua passando pelo writer legado do instalador oficial. A transação com staging e bundle integral descrita acima pertence ao V2; não atribua essa garantia nova a todo o writer legado.

## Preparar uma melhoria sem enviar

A preparação parte de um bundle V2 instalado e lê somente os caminhos escolhidos dentro de `source-dir`. O arquivo selecionado precisa existir no pacote-base e ter uma alteração. O exemplo abaixo pressupõe que `workspace/metodo/oferta.md` já foi editado e revisado localmente. A versão `0.2.1-rc.1` é ilustrativa, não uma versão declarada publicada.

Confira a prévia:

```sh
node scripts/community.mjs prepare \
  --slug=funil-e-crescimento \
  --source-dir=sistemas/outros-instalados/funil-e-crescimento/workspace \
  --file=metodo/oferta.md \
  --version=0.2.1-rc.1 \
  --summary="Abrir pela situação concreta e reaproveitar revisões anteriores."
```

Acrescente `--confirm` ao mesmo comando para salvar o candidato privado. Repita `--file=<caminho>` para cada arquivo adicional aprovado para seleção. O resumo aceita até 2.000 caracteres. Sem `--confirm`, nenhum candidato é salvo: não use o ID da prévia nas próximas operações.

O resultado confirmado contém `candidate_id`, `package_sha256` e `package_ref`. Os arquivos ficam em `comunidade/minhas-contribuicoes/propostas/<candidate_id>/`. A alternativa `--base-package=<envelope-relativo>` substitui `--slug` quando a base V2 foi fornecida explicitamente por arquivo local.

O candidato contém o **bundle público completo mais as alterações selecionadas**, não apenas um diff. Não há varredura recursiva do workspace. Contexto, peças de clientes, dados e credenciais não são selecionáveis implicitamente. A detecção de segredos e PII óbvios ajuda a bloquear erros, mas não substitui a revisão do conteúdo.

Nesta versão, a composição não adiciona/remove caminhos da base. No Funil, `copy/` e `originais/` permanecem intactos; os metadados gerados não são patches selecionáveis. O inventário é recalculado. A nova versão identifica a distribuição e os contratos; o motor do RC mantém a versão interna `0.2.0-rc.1`, exigida pelo seu validador. Alterar a versão interna requer trabalho explícito no contrato do motor. Uma nova contribuição fica em piloto, com zero evidência real herdada.

## Revisar, autorizar e enviar separadamente

Substitua os marcadores pelos valores retornados na preparação confirmada:

```sh
node scripts/community.mjs review --candidate=ID_DO_CANDIDATO
```

`review` mostra a seleção, arquivos gerados, tamanhos, hashes de antes/depois e `package_ref`. Não gera um diff textual completo. Inspecione o conteúdo completo do envelope local indicado antes de autorizar; seus arquivos estão representados em base64. A lista de hashes, sozinha, não substitui essa leitura editorial.

Depois da revisão, autorize **esse hash exato**:

```sh
node scripts/community.mjs approve \
  --candidate=ID_DO_CANDIDATO \
  --sha256=HASH_DO_CANDIDATO_REVISADO \
  --confirm
```

Isso grava `approval.json` e retorna `approved_for_submission`; ainda não envia. A autorização inclui o resumo revisado. Mudanças no payload ou no resumo invalidam a autorização anterior. Prepare um novo candidato para outra revisão.

O envio exige outra decisão explícita:

```sh
node scripts/community.mjs send \
  --candidate=ID_DO_CANDIDATO \
  --sha256=HASH_DO_CANDIDATO_REVISADO \
  --confirm
```

Sem `--confirm`, `approve` e `send` exibem prévias; `send` continua exigindo uma autorização local válida. No envio confirmado, a plataforma reconfere o acesso e recebe a proposta privada. O cliente usa o ID do candidato como chave de idempotência e grava `submission.json` quando recebe o recibo. `submitted` não significa revisão aceita nem publicação.

A revisão da comunidade e a publicação exigem outro membro com autoridade de revisor na plataforma. O CLI e o MCP do membro não oferecem comandos de curadoria/publicação. Uma aprovação editorial sintética não é aprovação humana de Gabriel nem prova de mercado.

## Consultar o estado

```sh
node scripts/community.mjs review --candidate=ID_DO_CANDIDATO
node scripts/community.mjs contributions
node scripts/community.mjs contribution --id=ID_DA_CONTRIBUICAO_NA_PLATAFORMA
```

O ID local do candidato e o ID remoto da contribuição têm funções diferentes. `review` consulta a preparação local. Os dois últimos comandos consultam a plataforma; a resposta respeita a identidade e a permissão atuais. O detalhe remoto pode incluir o envelope autorizado para revisão, enquanto o MCP projeta apenas metadados.

Não existe um subcomando separado de status da instalação. Consulte o JSON local `.cerebro/sistemas/<slug>.json`, os `refs` retornados e `installation.json`. Uma consulta a `show` informa a release do catálogo, não comprova a integridade da instalação local.

## MCP local

Gere a configuração no computador que possui esse Cérebro:

```sh
node scripts/community-mcp-config.mjs --root="/caminho/completo/do/seu/cerebro"
```

O gerador apenas imprime JSON com `mcpServers.inevita-comunidade`. Revise e acrescente a entrada à configuração existente do cliente, conservando outros servidores. Nenhuma configuração global é alterada pelo comando. O servidor usa Node e `scripts/community-mcp.mjs` em stdio; não é o MCP empresarial nem um servidor HTTP local.

Peça à IA para listar, detalhar e planejar a instalação. Após a aprovação do hash, ela pode instalar. Preparar contribuição, conferir o candidato, autorizar e enviar continuam sendo decisões separadas. As ferramentas chamam os mesmos serviços do CLI; não oferecem shell, leitura arbitrária de arquivos ou publicação no catálogo. Veja [o guia do MCP](community-mcp.md) para configuração, protocolo e nomes das ferramentas.

## Conflitos, locks e recibos

| Situação | Comportamento e próximo passo |
| --- | --- |
| `release_changed`, `package_hash_mismatch` | Refaça a prévia e revise a versão/hash atuais. Não substitua o hash automaticamente. |
| `installed_contract_modified_conflict`, `installed_wrapper_modified_conflict` | A edição local é preservada. Compare o wrapper com `releases/.../contracts/` e resolva a personalização antes de outra instalação. Não apague sua edição para forçar a atualização. |
| `installed_file_mismatch`, `installed_contract_mismatch` | A árvore distribuída diverge do envelope. Inspecione a alteração e preserve trabalho local; o retry não trata o estado JSON como prova suficiente. |
| `unmanaged_system_conflict`, `existing_system_requires_migration` | Já há conteúdo sem o estado V2 correspondente, ou migração necessária. Não existe migração automática nesse comando. |
| `installation_in_progress` | Existe lock com processo ativo. Aguarde a operação e confira o estado antes de repetir. |
| `installation_interrupted_review_required`, `release_directory_exists` | Pode haver lock, staging ou release órfã. Preserve-os e inspecione PID, estado, contratos e recibos antes de uma reparação manual. O comando não limpa automaticamente uma execução interrompida. |
| `remote_receipt: pending` | Os arquivos podem estar instalados. Confira o estado e o recibo locais, refaça a prévia e repita `community install` da release revisada. O acesso é revalidado; não apague o workspace. |
| `approval_required`, `candidate_hash_mismatch`, `approval_hash_mismatch` | Confira o candidato íntegro e registre nova autorização quando necessário; não reutilize a autorização de outro conteúdo. |
| Falha no envio/resposta | Consulte `contributions` antes de repetir `send` com o mesmo candidato; a idempotência evita duplicar uma submissão igual. |
| Vínculo inválido ou acesso negado | Recupere a ativação/acesso na plataforma. Não copie credenciais e não invente outro `member_id`. |

Falhas síncronas de escrita V2 têm rollback testado. Encerramento abrupto do processo não possui journal de recuperação automática. O lock fica em `sistemas/outros-instalados/.<slug>.install.lock` e staging em `.community-stage-*`; não há `--force` ou comando de desbloqueio seguro automático.

O recibo remoto confirmado é persistido fora do bundle. No fluxo avançado do instalador oficial com grant já consumido, o retry V2 verifica os bytes locais antes de tentar o recibo; o `community install` obtém uma autorização nova. Ambos dependem da política atual do servidor.

## Verificação local e limites desta entrega

Na raiz do repositório:

```sh
npm test
npm run test:community
npm run test:community -- --funil="/caminho/completo/funil-0.2.0-rc.1"
```

`npm test` executa a validação do produto e o runner da comunidade. Com `--funil`, o runner também compara os 99 arquivos do RC original byte a byte, conserva o ZIP e verifica o inventário recomposto. Usa fixtures isoladas, sem publicar, enviar contribuições reais ou usar segredos de membros. Python é executado somente por essa verificação explícita do RC.

Para fixtures de rede, o CLI aceita `CEREBRO_COMMUNITY_ALLOW_LOCALHOST=1`; o processo MCP aceita `CEREBRO_COMMUNITY_ALLOW_LOCALHOST=true`. O runner configura seus próprios testes. Não habilite essas exceções na configuração normal. Os scripts `lint` e `typecheck` não estão definidos no `package.json` desta base.

Os testes locais não substituem a revisão final da integração, a coordenação de atualização cliente/backend ou uma decisão de liberação em produção. Nenhum resultado técnico deste guia conta como uso real aprovado por um membro.
