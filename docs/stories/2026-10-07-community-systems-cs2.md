# Story CS2 — Integração e liberação dos sistemas da comunidade

Status: candidata local preparada; integração remota pendente. Pedido de Gabriel: “próximo”, após entrega local CS1.

## Resultado

Integrar o código já verificado à linha apropriada de cada repositório, preparar artefatos exatos sobre o runtime vigente e liberar somente o que tenha compatibilidade e autorização demonstráveis. Uma dependência sem piloto aprovado não é liberada por arrasto. Não confundir aprovação técnica com aprovação humana de uma contribuição ou resultado de membro.

## Aceite

- [x] Conferir branches, versões, PRs, autoridade e runtime atuais.
- [x] Fixar CS1 em commits verificáveis, preservando checkouts principais.
- [x] Preparar integração/release de cliente sem arrastar candidata não aprovada.
- [x] Capturar runtime vigente e produzir pacote mínimo compatível, quando acessível.
- [x] Executar checks aplicáveis ao delta e revisar rollout.
- [ ] Abrir/atualizar PRs com diffs e dependências explícitas.
- [ ] Liberar e validar produção dentro da autorização; se faltar autoridade/aceite externo, deixar candidato concreto e registrar a dependência exata.
- [ ] Registrar hashes, arquivos e estado final, sem segredos ou PII.

## Sequência

Auditoria read-only de membro e Railway em paralelo. Depois, integração de código e ensaio da atualização; publicação do backend depende do cliente e da compatibilidade dos serviços vivos. A publicação do Funil exige autor e revisor reais distintos pelo fluxo do produto. Nenhuma mensagem a membros está autorizada por esta mesa.

## File List

- `.agents/skills/atualizar/SKILL.md`
- `.cerebro/motor.manifest`
- `.claude/skills/atualizar/SKILL.md`
- `CHANGELOG.md`
- `COMECE-AQUI.md`
- `README.md`
- `VERSION`
- `docs/guides/community-release.md`
- `docs/guides/community-systems.md`
- `docs/releases/1.39.0.md`
- `docs/stories/2026-10-07-community-systems-cs2.md`
- `scripts/build-funil-community-package.mjs`
- `scripts/community-mcp-config.mjs`
- `scripts/community-mcp.mjs`
- `scripts/community.mjs`
- `scripts/install-system.mjs`
- `scripts/lib/community-contribution.mjs`
- `scripts/stage-community-release.mjs`
- `scripts/test-community-all.mjs`
- `scripts/test-community-install.mjs`
- `scripts/test-community-mcp.mjs`
- `scripts/test-community-package.mjs`
- `scripts/test-community-release-staging.mjs`
- `scripts/test-community-release.mjs`
- `scripts/test-pilot-1380.mjs`

## Verificação

Cliente candidato 1.39.0 sobre CS1 6a3321c e base PR12 ff1d40e (1.38.0). Novo envelope Funil V2 requer 1.39.0; os 99 arquivos/879.219 bytes do RC permanecem intactos. Hash canônico: 3bb960c3acbd9462aa0843d0eee665d2109e1c8ab90020340fa32f13169049b4.

74 scripts de teste passaram em macOS/Node26; npm test passou. Runner com Funil real: 18 checks de pacote, quatro CLI, 13 MCP, quatro staging, quatro sistemas legados e grants. Sintaxe de 163 módulos verificada. O repositório não fornece scripts npm lint/typecheck; esses comandos não foram declarados aprovados. Lint direcionado dos módulos de staging/MCP passou no revisor.

Instalação nova e atualização 1.38→1.39 passaram com três guias, duas notas e sete sentinelas privadas preservadas, incluindo credencial, workspace, skill e contribuições. CLAUDE personalizado e canal de origem preservados; reaplicação idempotente. Regressão de atualização desde 1.36.1 passou. Os CLIs agora funcionam também sob alias de diretório (/var→/private/var).

Ensaio integrado com handler real, migração/RPC em PGlite e identidades sintéticas distintas passou: staging original→revisão local→consentimento→envio→curadoria→instalação A→melhoria selecionada→curadoria→instalação B. Rejeições de autoaprovação, hash alterado, publicação prematura e acesso revogado passaram. Nenhum serviço de produção foi chamado; zero ciclos de mercado.

## Dependências de liberação

PR12 permanece dependência candidata com aceite de piloto/Telegram por Gabriel. Este delta não autoriza integrar a base sem esse aceite. O novo PR deve ser empilhado sobre codex/pacote-1380-20260927 e retargetado após integração da base. Checks Linux/Windows/macOS do SHA final precisam ser conferidos separadamente.

Servidor preparado offline contra baseline vivo: sete alterações permitidas, 250 arquivos preservados, Calls intacto. Migração, deploy, tag e release não executados. Distribuir cliente compatível e coordenar a obrigatoriedade de credencial dos clientes antigos antes de expor V2. Novo canal oficial gabrielzucco/cerebro-inevita; atualização preserva canal local.

O pacote original entra como proposta privada. A pessoa autora confirma seu hash; outra pessoa curadora revisa antes de publicar. Duas instalações da mesma pessoa não são revisão independente. A aprovação de conteúdo não é comprovação de resultado real.

## Integração remota em 07 de outubro

CS1 e CS2 fixadas em commits 6a3321c e 788addc. O GitHub recusou três tentativas de push com Internal Server Error; a criação do PR também devolveu erro interno. A branch remota e o PR do membro ainda não estão confirmados. O PR da plataforma #298 existe; CI do a4c9f5 passou, mas a rodada de 39c38df2 encerrou sem jobs e o pedido de rerun recebeu HTTP500. Isso não representa falha de teste executado nem validação do SHA final.

A revisão independente encontrou um estado local enganoso: existência de approval.json/submission.json era tomada como status válido. Leitura corrigida para conferir candidato, hash, resumo/consentimento e recibo; envio já recusava consentimento copiado. Testes dirigidos cobrem registro de outro candidato, malformado, hash divergente e recibo sem aprovação. O recibo externo desta entrega registra o resultado final dos testes e do artefato extraído do commit.
