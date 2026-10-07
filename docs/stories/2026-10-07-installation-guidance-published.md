# Instalação e atualização com instruções da versão publicada

## Problema
A versão oficial v1.39.0 foi publicada, mas parte das instruções distribuídas
ainda a chama de candidata não publicada. Os guias também divergem no requisito
de Node e não distinguem suficientemente e-mail cadastrado de credencial válida
para o MCP. Isso pode interromper quem começa hoje ou atualiza uma instalação.

## Critérios
- [x] Corrigir o estado de publicação e apontar a release oficial verificável.
- [x] Explicar os caminhos zero, INEVITA antigo e artesanal, preservando contexto.
- [x] Apresentar comecar como assistente já incluído, com retomada e primeira entrega.
- [x] Distinguir referência ao acervo de cópia aprovada; não atualizar pasta artesanal.
- [x] Usar Node.js 20+ nos guias operacionais deste corte.
- [x] Separar instalação, vínculo seguro, MCP configurado e primeiro uso do sistema.
- [x] Regenerar espelhos pelo script do repo e conferir paridade.
- [x] Validar produto, distribuição dos guias e preservação na instalação/atualização.
- [x] Revisão independente e PR preparado, sem merge, tag ou publicação.
- [x] Preparar metadados 1.39.1 e ensaiar atualização das bases 1.38.0 e 1.39.0.

## File List
- CLAUDE.md
- COMECE-AQUI.md
- README.md
- docs/guides/implantacao-assistida.md
- docs/guides/community-mcp.md
- docs/guides/community-systems.md
- .claude/skills/comecar/SKILL.md
- .claude/skills/atualizar/SKILL.md
- .agents/skills/comecar/SKILL.md
- .agents/skills/atualizar/SKILL.md
- docs/stories/2026-10-07-installation-guidance-published.md
- VERSION
- CHANGELOG.md
- .cerebro/motor.manifest
- comunidade/inevita/atualizacoes/feed.v1.json
- docs/releases/1.39.1.md
- scripts/test-community-release.mjs

## Limites e evidência
Base: main oficial 774cbfa32721f83bb72cd72b550fc9af3557f95d, tag v1.39.0.
Seu arquivo público foi conferido sem autenticação: 615 arquivos idênticos ao Git,
instalação nova e MCP com 20 ferramentas. O commit documental local d1bfca2 está
preservado na branch codex/community-systems-20261007.

Este corte prepara VERSION 1.39.1, mas não altera tag, instalador, updater, ativação, telemetria,
sistemas incluídos ou painel. Não cria teste que apenas espelhe o texto. Os testes
existentes verificam distribuição dos guias, paridade e preservação do contexto.
O gerador canônico recria .agents/skills inteira; foi executado numa cópia scratch,
trazendo só os dois espelhos permitidos, com --check posterior no repositório real.
Mesa 20261007-174205-34099cb8; família GPT-6, variante e esforço não verificados.
Escopo ampliado explicitamente de 10 para 11 arquivos para corrigir a orientação
central de vínculo em CLAUDE.md, sem alterar seu mecanismo de ativação ou telemetria.
Segunda expansão autorizada: 17 arquivos para preparar o patch documental 1.39.1,
com notas, feed, manifesto e ensaio de distribuição existente. Merge e publicação
ficam com a coordenação após revisão e CI; a tag 1.39.0 permanece intacta.

Contrato que permanece: a ativação por claim cria install-credential; e-mail e
ping legados não a criam. Em uma instalação nova, telemetryDisabled retorna
activation_local_only antes da emissão dessa credencial. O MCP remoto exige id,
credencial e Society vigente. A documentação informa esse limite, sem alterar a
preferência do membro ou prometer vínculo que não ocorreu. O piloto humano
completo Hermes/Telegram continua pendente.

## Verificação
- Produto válido: 22 envelopes, 3 sistemas, 39 arquivos de skills em paridade.
- Distribuição: instalação nova e atualização das bases 1.38.0 e 1.39.0; 4 guias e
  3 notas presentes, 7 sentinelas privadas preservadas por base, regra privada do
  CLAUDE preservada, canal inalterado e reaplicação idempotente.
- Preservação: 12/12 testes. Segurança dos caminhos Node e Bash: 10 sentinelas
  preservadas em cada caminho. Feed validado pelo teste existente.
- Sintaxe do teste alterado e git diff --check passaram. Ensaios locais em Node
  26.8.1; CI usa Node 20 em Linux, Windows e macOS, descobrindo todos test-*.mjs.
- package.json não define lint ou typecheck. Não há código operacional alterado.
- npm test passou: validação do produto e suíte agregada da comunidade.
- Revisões independentes dos guias e da distribuição aprovadas, além da revisão
  da coordenação. PR [#14](https://github.com/gabrielzucco/cerebro-inevita/pull/14)
  aberto e anexado. CI do PR, merge, CI integrado e publicação ficam com a coordenação.
- Antes de liberar, aguardar os três jobs do CI e conferir o artefato público
  v1.39.1. Nenhum merge, tag ou publicação foi feito neste corte de preparação.
