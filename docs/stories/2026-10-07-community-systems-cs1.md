# Story CS1 — Sistemas da comunidade

Status: implementação local concluída e verificada. Produção pendente.

## Plano

JTBD: aproveitar um sistema da comunidade e devolver uma melhoria revisada, preservando o contexto privado. Métrica de aceite: ciclo completo entre duas instalações isoladas com 100% dos bytes do pacote preservados. Não há baseline comercial medido ou RICE inventado.

- [x] Auditar bases, autoridade e riscos.
- [x] Definir contrato e dividir trabalho.
- [x] Implementar superfícies deste repositório.
- [x] Integrar catálogo, instalação, contribuição e MCP.
- [x] Testar regressão, autorização e isolamento.
- [x] Revisar código, segurança e experiência.
- [x] Gerar recibo e instruções de operação.

## Critérios e arquitetura

# Comunidade — contrato de integração CS1, 7 outubro 2026

## Resultado e autoridade
Um membro encontra um sistema publicado, instala o pacote íntegro no Cérebro existente, prepara uma melhoria com arquivos explicitamente selecionados, autoriza seu envio, acompanha revisão por outra identidade e outro membro instala a versão publicada. Avaliação técnica sintética não conta como prova real de mercado.

Society/Railway é autoridade única de membros, acesso atual, releases, grants e revisão. Estender `cerebro-system-distribution`. O MCP da comunidade é um adaptador local stdio do Cérebro: chama os mesmos serviços do CLI. Não expõe MCP empresarial nem cria uma segunda autoridade de acesso.

## Identidade
Instalação usa `{install_id, install_credential}` da ativação existente. Servidor deriva membro/comunidade e verifica `cerebro_society_access` em toda ação. Browser usa sessão autenticada. Nenhum member_id, papel ou workspace recebido cria autoridade. Revisor precisa permissão administrativa atual da mesma comunidade; autor não revisa/publica sua contribuição.

## Envelope schema_version=2 (exato)
Campos obrigatórios: `schema_version:2`, `slug`, `system_id`, `version`, `title`, `entrypoint`, `first_task` (string), `files` (objeto caminho → `{encoding:'base64',content:string,sha256:string,bytes:integer}`), `contracts` (objeto nome → JSON ou Markdown como string: manifest.json, release.json, contract.json, capability.json). Opcional `provenance` objeto com `base_package_sha256`, `source` e `changes` (strings). Sem credenciais, grants ou aprovação no envelope.

`files` contém a árvore original, sem prefixo e sem wrapper. Contratos são externos à raiz íntegra do bundle. Funil canônico: slug `funil-e-crescimento`, system_id `sistema-funil-inevita`, versão `0.2.0-rc.1`. Não substituir founding `funil-vivo` por inferência.

SHA-256 do envelope: UTF-8 de JSON estável com chaves de objetos ordenadas recursivamente, arrays na ordem. Base64 canônico. Máximo512 arquivos,4MiB decodificados,6MiB JSON,1MiB por arquivo. Sem paths absolutos/traversal/backslash/controles/case collisions/ancestral arquivo. Arquivos são dados e não são executados ao instalar. `.claude/skills` do kit é permitido dentro do bundle isolado. Nenhum arquivo de workspace privado entra implicitamente.

Schema1 Calls permanece suportado. V2 download usa `{artifact:{url,sha256,bytes},package_sha256}` ou `{package:envelope,package_sha256}` em fixtures. SHA do artefato é dos bytes JSON armazenados; package_sha256 é do JSON canônico. URLs HTTPS e sem encaminhar credenciais; localhost somente configuração explícita de testes.

## Ações POST do endpoint existente
- `list_releases` → `{releases:[{slug,system_id,version,title,maturity,package_sha256,first_task}],can_review:boolean}`. Somente ativas/autorizadas.
- `get_release` +slug → `{release:metadados}`. Sem artefato antes do grant.
- `issue_grant` +slug → contrato já existente `{grant_token,expires_at,distribution_url,release}`. Credencial de instalação ou sessão.
- `redeem_grant` +grant_token,install_id,install_credential → pacote v1 ou artefato v2. Vincular membro/instalação e acesso atual antes de consumir grant; retry definido.
- `installation_receipt` +grant_token,install_id,install_credential,runtime → `{installed:true,release}`. Nunca alterar dono da instalação; retry idempotente.
- `submit_contribution` +`package` (envelope),`package_sha256`,`idempotency_key` (UUID),`summary` (máx2000chars),`share_confirmed:true` → `{contribution:{id,status,package_sha256,slug,system_id,version,title,summary,created_at}}`. Salvar imutável privado, sem URL pública.
- `list_contributions` → `{contributions:[metadados],can_review:boolean}`. Membro vê apenas próprias; revisor vê fila da comunidade.
- `get_contribution` +contribution_id → `{contribution,package?}`. Autor/revisor da comunidade; envelope para revisão explícita, nunca outros membros. Pode usar artefato privado assinado para revisão.
- `review_contribution` +contribution_id,package_sha256,decision (`approved` ou `changes_requested`),notes → `{contribution}`. Aprovação vincula hash exato; autor proibido. Mudança cria novo candidato/ID, não altera bytes.
- `publish_contribution` +contribution_id,package_sha256 → `{contribution,release}`. Revisor autorizado distinto do autor; exige approved mesmohash; publicação atômica de nova release active, anterior retired. Repetição idempotente. Publicação de pacote não altera maturity/contadores de prova para stable/validated.

Erros JSON `{error:codigo}` com status400/401/403/404/409/413; sem tokens/PII/logs de payload.

## Divisão de implementação
- comunidade_autoridade: backend/migration/tests/route package. Ler db-architect, saas-security-auditor, rls-validator. Não tocar frontend.
- funil_primeiro_uso: instalador V2, lib community-package, build wrapper, contribuição prepare/approve/send com seleção explícita e hash, CLI community, testes e privacidade. Exportar API ESM para MCP. Não tocar arquivos community-mcp.
- comunidade_mcp: scripts/community-mcp.mjs + lib/community-mcp*.mjs + testes/configuração/documentação. Consumir client/installer/contribuição do agente acima; colaborar interfaces diretamente. Sem alterações no MCP empresarial.
- root: stories, frontend catálogo/revisão/instrução por sistema, integração entre dois Brains, revisão final e entrega.

## Aceite
- Pacote99 arquivos byte idêntico no primeiro install; contratos fora do bundle; preview zero escrita/consumo de grant; preserva privado/skills/instruções; idempotente.
- A prepara arquivos selecionados e revê hash; envio explícito distinto; revisorC decide/publica exatohash; B encontra/instala nova versão e recebe melhoria, jamais sentinela privada de A.
- Bloquear acesso revogado entre etapas, outra instalação, self-review, hashalterado, draft público, paths inseguros, replayconflitante. Falha de rede/disco conserva estado anterior e permite recibo posterior íntegro.
- MCP usa stdio JSON-RPC protocolo2025-06-18, tools/list apenas comunidade, stdout só protocolo, sem executar pacote ou publicar por conta própria.
- Testes existentes compatíveis, lint/typecheck aplicáveis, revisão código/UX/segurança, recibo distingue código local e operação em produção.


## File List

- `.cerebro/private-ignore.manifest`
- `.gitignore`
- `docs/guides/community-mcp.md`
- `docs/guides/community-systems.md`
- `docs/stories/2026-10-07-community-systems-cs1.md`
- `package.json`
- `scripts/build-funil-community-package.mjs`
- `scripts/community-mcp-config.mjs`
- `scripts/community-mcp.mjs`
- `scripts/community.mjs`
- `scripts/install-system.mjs`
- `scripts/lib/community-client.mjs`
- `scripts/lib/community-contribution.mjs`
- `scripts/lib/community-mcp-protocol.mjs`
- `scripts/lib/community-mcp.mjs`
- `scripts/lib/community-package.mjs`
- `scripts/test-community-all.mjs`
- `scripts/test-community-install.mjs`
- `scripts/test-community-mcp.mjs`
- `scripts/test-community-package.mjs`

## Verificação

- Plataforma: `npm test` com PGlite ativado passou: 209 arquivos, 1.395 testes; 2 arquivos e 22 testes pulados. Outros 3 testes Edge passaram.
- Backend comunidade: 21 testes Deno, typecheck/lint Deno, 9 testes de distribuição/PGlite e 4 testes do empacotador offline passaram.
- Membro: `npm test` e runner `test:community` com RC completo passaram; 17 grupos de pacote, 4 testes de instalação/CLI, 12 de MCP e compatibilidade schema1. Este repositório membro não declara lint/typecheck npm.
- Build Vite passou. Lint global mantém 519 erros e 108 avisos anteriores; TypeScript global mantém 1.203 diagnósticos anteriores. Comparação normalizada contra a mesma base: nenhuma ocorrência nova. Lint focado e `git diff --check` passaram.
- Ciclo real de código com contas sintéticas A/B/revisor: prévia, 99 arquivos íntegros, contribuição selecionada, revisão por hash, publicação, instalação B, privacidade, revogação, idempotência e integridade Python passaram. Nenhuma rede externa foi usada.
- Outro agente usou B, consultou a regra compartilhada e a reaplicou na segunda peça; 117 arquivos anteriores intactos. Pesquisa de mercado continuou bloqueada; zero ciclos reais.
- UI conferida em desktop e 375px; textos inertes, confirmação explícita e remoção de autoridade em cache testados. Revisão independente encontrou três problemas, corrigidos com regressões.
- Recibos finais e patches portáveis estão em `outputs/comunidade-sistemas-cs1.zip` no chat de entrega. Código permanece nas worktrees, sem commit, push, merge ou deploy.

## Limites de liberação

Atualizar o cliente antes de exigir a credencial no resgate legado. Integrar a migration e a função na autoridade Railway com baseline vivo e fonte commitada; validar download público, conta real e outro computador. O pacote original só entra no catálogo após revisão/publicação. Migração integral de Cérebro e descoberta automática de novos sistemas não foram implementadas. Locks interrompidos exigem inspeção manual; URLs já emitidas expiram em até 300 segundos.

