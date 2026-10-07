# SS: credencial no cliente Society

Pedido do Gabriel em 28/09/2026. Base `pacote-1380-atual` (`bde2a18`).
Como membro, quero sincronizar usando a credencial privada já emitida para esta
instalação e receber uma orientação útil quando o vínculo precisar de renovação.

- [x] Ler `.cerebro/install-credential` como o ping e enviar somente ao sync.
- [x] Tratar 401, 403 e indisponibilidade sem expor credencial.
- [x] Testar o cliente sem rede, atualizar CHANGELOG 1.38.0.
- [x] Rodar `npm test` e cruzar todos os `scripts/test-*.mjs` com o disco.
- [x] Registrar resultados, compatibilidade e bundle.

## Arquivos

- `scripts/society-sync.mjs`
- `scripts/test-society-sync.mjs`
- `CHANGELOG.md`
- `docs/stories/2026-09-28-society-sync-credential.md`

## Recibo

Branch `codex/society-sync-credential-20260928`; worktree `/private/tmp/SS-member`.
Mesa `20260928-165043-0f4e5bce`. Modelo/esforço recomendados e declarados no contrato
por instrução: `gpt-6-astra/xhigh`. A sessão expõe GPT-6; identificador exato e esforço
efetivo: `nao_verificado`. API, assinatura e custo observado: `nao_verificado`.
Commit: o commit que contém esta story; hash final no relatório SS externo.
Próxima entrega: revisão do dono e integração/publicação manual.

## Implementação e compatibilidade

`scripts/society-sync.mjs` lê e apara `.cerebro/install-credential`, valida os mesmos
43 caracteres URL-safe do ping e envia somente `install_id` e `install_credential`
no POST para o endpoint oficial. Não imprime a credencial, não a envia ao storage,
não usa e-mail/member-id como fallback e não executa ping de diagnóstico.
Sem credencial, orienta atualizar/vincular antes de tentar a rede. HTTP 401 orienta
atualizar/vincular; 403 informa falta de direito; 5xx e exceções ficam sanitizados.
O timeout é liberado no `finally`. Importar o módulo para teste não executa sync.

CHANGELOG mantém a versão 1.38.0 como candidata, sem criar tag/release.
1.34.2 e 1.36.1 foram verificadas nas tags locais: sync não envia credencial, ping
já a conhece. Branch local 1.37.0 também não envia; qualquer 1.37.x com esse cliente
recebe 401, mesmo com arquivo de credencial presente. Não se afirma inspeção de
todas as patch releases. Clientes antigos ignoram a mensagem de atualização no
JSON e mostram aviso genérico de vínculo. Atualizar resolve quando já há credencial
válida; sem ela, é necessário concluir o vínculo pela plataforma.

Proposta: nenhuma carência que aceite só ID. Plataforma primeiro, pacote 1.38.0
corrigido em seguida, na mesma janela aprovada. Conteúdo já baixado e trabalho
local continuam disponíveis. Links novos expiram em 300 s; repetir `/society` se
um lote lento expirar. A publicação continua condicionada aos gates do piloto
1.38.0 e ao OK do dono. Sem estimativa inventada de instalações afetadas.

## Testes e reconciliação do inventário

Node v26.8.1. `npm test`: exit 0, resultado literal:
`✓ protocolo válido · 22 envelopes · 3 sistemas · 38 arquivos de skills sincronizados`.

Inventário de `scripts/test-*.mjs` cruzado com Git e disco: **68 presentes**, sendo
67 anteriores + 1 novo; **0 faltantes**. Todos os 68 foram executados individualmente
com `node arquivo`, evitando a omissão silenciosa de nomes inexistentes pelo runner.
Resultado final: **64 scripts aprovados, 4 bloqueados por porta local, 0 outras falhas**.
Essas são contagens de scripts, não uma soma fictícia de assertions.

Os quatro bloqueados deram `listen EPERM: operation not permitted 127.0.0.1`:

- `scripts/test-cockpit.mjs`
- `scripts/test-console-server.mjs`
- `scripts/test-hermes-activation.mjs`
- `scripts/test-install-system-grant.mjs`

Não contados como regressão; precisam rodar fora do sandbox. A primeira bateria
usou `CEREBRO_TELEMETRY=off` para prevenir telemetria. Isso desabilitou o fluxo
mockado de `test-install-activation.mjs` (esperava `install_completed`, recebeu
`activation_local_only`). Após conferir que todas as chamadas desse teste injetam
fetch falso, repetido sem essa variável: exit 0, `✓ ativação local: instalação,
reconexão, retry e falha sanitizada`. Não houve chamada real de ativação.

Teste novo: `node --test scripts/test-society-sync.mjs`: **tests 14, pass 14, fail 0,
cancelled 0, skipped 0, todo 0**. Sem rede/porta; dependências injetadas. Cobre envio
exato, ausência/invalidez, 401/403/500/503, falha/JSON inválido, segredo ausente dos
logs, download sem credencial e URL expirada.

`node --check` nos 2 scripts e `git diff --check`: exit 0. Não existem scripts npm
lint/typecheck neste pacote. Fixtures ficaram em TMPDIR dentro desta worktree.
Inventário e resultados por arquivo em `.automacao/.escopo-runtime/test-manifest.json`
e `test-results.json` (runtime local, fora do bundle); cópia administrativa no kit
local SS. Os 4 testes de porta e o smoke de publicação continuam pendentes.

## Segurança e entrega

Revisão da plataforma encontrou o ping legado permitindo alterar o dono sem
credencial. Estacionado na mesa da plataforma porque outra função/banco estão
fora do escopo. Esse risco impede afirmar encerramento completo da cadeia de
autorização; detalhes na story da plataforma e relatório SS.

Sem escrita nos checkouts principais, `_PAINEL.md` ou `.cerebro/contracts`; sem
rede, produção, push, PR, release, tag, deploy, SSH ou mensagens. Kit VPS não se
aplica. Bundle e relatório em `~/Desktop/codex-2026-09-27/`. OK do Gabriel ainda é
necessário para integrar/publicar o resultado e para a frente separada do ping.

