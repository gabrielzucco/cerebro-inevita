# MCP Society: acervo e perfil próprio

## Pedido e recorte
Gabriel pediu conectar o MCP à comunidade, consultar o acervo e atualizar o perfil; após a auditoria respondeu “go”. Este corte entrega acervo e perfil na mesma conexão Society. Feed, comentários, notificações, agenda e diretório ficam na sequência. Sem publicação/deploy nem alterações em contas reais nesta entrega.

## Critérios de aceite
- [x] Mesmo vínculo da instalação; Society vigente revalidada em cada chamada, incluindo revogação e isolamento de organização/conta.
- [x] Busca paginada e detalhe do acervo publicado permitido, com referência à plataforma. Sem promessa de busca semântica/transcrição universal.
- [x] Leitura somente do próprio perfil; campos explicitamente permitidos, sem contatos privados ou credenciais.
- [x] Prévia de edição sem escrita; aplicação explícita vinculada aos campos/revisão conferidos, sem sobrescrever edição concorrente.
- [x] Publicar na Vitrine é ação separada, com requisitos conferidos e sem preparar/enviar WhatsApp.
- [x] Testes positivos/negativos significativos, integração MCP→handler→SQL sintético, lint/tipos/checks existentes e revisão independente.
- [x] Documentação e recibo distinguem candidato de produção e apontam limitações.

## Execução
Recomendado: GPT-6, esforço alto, revisão independente. Efetivo: GPT-6, variante/esforço não verificados pelo contexto. Repositórios existentes community-member e community-platform, branch codex/community-systems-20261007. Contratos de escopo 20261007-151418-4fa9ea1d (plataforma), 20261007-151418-cf78423b (membro). Sem chamada de produção.

## File List
- `docs/guides/community-mcp.md`
- `docs/stories/2026-10-07-community-member-surface.md`
- `scripts/lib/community-client.mjs`
- `scripts/lib/community-mcp-protocol.mjs`
- `scripts/lib/community-mcp.mjs`
- `scripts/lib/community-member-surface.mjs`
- `scripts/test-community-all.mjs`
- `scripts/test-community-mcp.mjs`
- `scripts/test-community-member-surface.mjs`

## Recibo
Implementação e verificação local concluídas; versão candidata ainda não publicada.

O MCP passa de dez para dezesseis ferramentas. Acervo deste corte: título, palestrante, descrição e tags de aulas/encontros gravados publicados; descrição e materiais com fonte navegável, sem bytes dos kits, transcrição universal, trilhas ou agenda. O mesmo servidor revalida Society/instalação/organização; nenhuma nova credencial é entregue ao agente.

Perfil: prévia sem escrita, changes normalizado + revision + preview_hash, confirmação ao salvar e revisão atual ao publicar. Perfil já visível muda imediatamente; remoção de requisitos mínimos é recusada. Headline/area/stage legados são somente leitura. Publicação pode tornar visíveis vínculos de autoria e links já cadastrados conforme a plataforma; nenhum contato privado sai do MCP. WhatsApp não é preparado nem enviado. Foto é adicionada pela plataforma.

A revisão independente conferiu as migrations posteriores, rotas, limites por conta e triggers. Corrigidos erro de perfil incompleto, aviso de teto de paginação, dados legados nulos, projeções limitadas e campos públicos antigos na prévia. O ensaio entre os repositórios usa protocolo MCP, cliente, handler e SQL reais com identidades e banco sintéticos; quatro cenários passaram, incluindo seis operações negadas após revogação e zero tentativa de rede externa. A fixture modela presença de entitlement; não simula vencimento comercial por calendário.

Empacotador da plataforma inclui a nova dependência e registra duas migrations ordenadas. Cinco testes passaram, incluindo build isolado que preserva outros handlers. Ajuste de contrato técnico: primeira mesa plataforma 20261007-151418-4fa9ea1d encerrada como abortada com seis arquivos, substituída por 20261007-152019-08d9b6ed antes de acrescentar os dois arquivos de empacotamento, dentro da entrega autorizada. Todo o delta desta entrega permanece listado acima; nenhum arquivo anterior é ocultado pela troca de baseline.

Delegações: implementação backend, implementação cliente, auditoria independente e verificação completa. Mesma família GPT-6 herdada; variante/esforço efetivos não expostos. Nenhum agente publicou ou acessou contas reais.



### Verificação final local

- Membro: 75/75 scripts do glob do CI, validate-product e sete checagens de sintaxe passaram. Ajustes finais de campos legados/efeitos foram seguidos de npm test e sintaxe novamente. Runtime local Node v26.8.1/macOS; CI usa Node 20. Primeira rodada com override CEREBRO_TELEMETRY=off conflitou com fixture de ativação; removido o override, como no CI, a suíte passou. Não houve mudança no código por essa falha de ambiente.
- Plataforma: npm test com PGLite habilitado passou em 1.430 testes (22 pulados de duas suites explicitamente ignoradas) e 3 Edge. SQL não ficou pulado. Build, typecheck raiz e auditorias de segurança passaram.
- Ajustes finais do backend: 23 testes dirigidos (14 superfície +9 existentes), 22 Deno handler/adapter, Deno check e ESLint dos seis arquivos passaram.
- Integração entre repositórios: quatro cenários finais MCP/cliente/handler/SQL aprovados, incluindo revogação de todas as seis ferramentas; nenhuma rede externa. Empacotador: cinco testes aprovados e lint dirigido sem diagnóstico.
- Lint global continua em 519 erros/108 avisos e TypeScript da aplicação em 1.203 erros; comparação normalizada com o baseline não encontrou diagnósticos novos nem removidos. Não declarar esses dois gates verdes.

Recibos externos da tarefa: work/community-surface-verification.json, work/community-member-surface-ci-glob.json, work/community-member-surface-final-checks.json e work/community-member-surface-crossrepo-receipt.json. Os commits e o estado final do CI remoto ficam no recibo em outputs/mcp-acervo-perfil. Dois PRs existentes permanecem candidatos: plataforma #298 e membro #13 (empilhado sobre #12; piloto da base pendente). Publicação exige coordenar as migrations e o backend com cliente compatível. Não houve deploy, merge, tag, release, acesso de produção, edição de perfil real nem mensagem enviada.

## Liberação autorizada em 07/10/2026

Gabriel pediu “suba pra ele usar”. O corte de publicação integra a base #12 por merge
commit, retargeta #13 para main, exige CI do SHA integrado e publica a tag oficial
v1.39.0. O piloto humano/Telegram permanece sem comprovação; a autorização de
publicação não o marca concluído.

- [x] Conferir CI do código 3bdb2d3 em Linux, Windows e macOS, Node 20.
- [x] Baixar arquivo GitHub desse commit, conferir os 611 arquivos contra Git e
  executar leitor, instalação nova, 16 ferramentas MCP e validador oficiais.
- [x] Integrar #12 preservando o histórico; merge 1adf13f1a14d0bb5bc0a2820e5f4599cf22d5932.
- [x] Atualizar instruções de release sem alegar validação humana.
- [ ] Conferir CI do SHA final integrado, publicar tag/release e conferir download público.

Arquivos deste complemento de liberação (File List): `README.md`,
`docs/releases/1.39.0.md`, `docs/guides/community-mcp.md` e esta story.
Recibo inicial do arquivo GitHub: `work/community-member-release-audit/receipt.json`.

## Assistente para um sistema original

Antes da tag, Gabriel esclareceu que a própria IA conectada pelo MCP deve ajudar
Turra a entrevistar, preparar e enviar um sistema novo de métricas, sem pedir JSON
ou comandos manuais. A release fica retida até esse percurso estar integrado e
verificado. O envio continua uma proposta privada, com curadoria e instalação
posteriores autorizadas separadamente.

- [x] Entrevista orientada pelas lacunas, aproveitando o contexto confirmado.
- [x] Inspeção somente dos arquivos explicitamente selecionados, com limites e checagem de privados.
- [x] Prévia do pacote original e dos contratos gerados, com hash do conteúdo exato.
- [x] Preparo confirmado desse hash e continuação por revisão, autorização e envio existentes.
- [x] Testes de fluxo completo sem CLI manual, isolamento de dados e mudança entre prévia e preparo.
- [x] Atualizar guias e validar localmente o conjunto completo.
- [ ] Validar o SHA final no CI e retomar a publicação.

File List deste corte: `scripts/lib/community-authoring.mjs`,
`scripts/lib/community-authoring-tools.mjs`, `scripts/lib/community-contribution.mjs`,
`scripts/lib/community-mcp.mjs`, `scripts/lib/community-mcp-protocol.mjs`,
`scripts/test-community-authoring.mjs`, `scripts/test-community-authoring-mcp.mjs`,
`scripts/test-community-all.mjs`, `scripts/test-community-mcp.mjs`,
`docs/guides/community-mcp.md`, `docs/guides/community-release.md`,
`docs/releases/1.39.0.md`, `README.md` e esta story. A lista será reconciliada com os
nomes efetivamente implementados antes do commit.

O MCP agora tem 20 ferramentas. A autoria aceita brief verbal ou até 32 arquivos
UTF-8 explicitamente escolhidos, 64 KiB por arquivo e 128 KiB no total. A prévia
inteira, incluindo quatro contratos, aparece uma vez em `structuredContent`, sem
truncagem. O preparo refaz o pacote e exige o mesmo hash; não envia nem publica.
Revisão técnica corrigiu limites entre brief e contrato, inspeção de segredos em
JSON aninhado e resposta excessiva depois de persistir o candidato. O retorno do
preparo é um recibo enxuto; a revisão integral acontece antes da escrita.

Validação local final: 77/77 scripts do glob CI, nove checagens de sintaxe e
validador canônico passaram. Inclui dez cenários da biblioteca de autoria e quatro
do MCP, com percurso real até envio HTTP sintético, sem CLI manual. Nenhuma
credencial, mensagem ou conta real foi usada. Os hashes dos arquivos ficaram
inalterados durante a suíte. Recibos: `work/community-authoring-ci-glob.json`,
`work/community-authoring-ci-glob.log` e `work/community-authoring-npm-test.log`.
