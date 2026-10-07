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
