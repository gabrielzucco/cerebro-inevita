# Skills disponíveis

Esta pasta é a vista do motor. As instruções executáveis continuam em `.claude/skills/` e
`.agents/skills/`, sincronizadas deterministicamente — não mantenha uma terceira cópia.

| Skill | Papel |
|---|---|
| `company-brain-sprint` | ativa fontes → mapa atual → primeiro sistema → Context Pack → output → correção |
| `arquiteto` | mapeia uma operação, mostra V0→V3 e propõe o primeiro sistema com razões explícitas |
| `prototipar` | monta o protótipo comercial e o de entrega, escolhe a frente e desenha o loop |
| `operar` | escolhe um sistema, executa, avalia e deixa recibo |
| `briefing-comercial` | adapta o briefing à operação e fecha a call com diff aprovado |
| `fonte` | decide o nível de refino de qualquer coisa que chega e trata só até onde o trabalho exige |
| `call` | transforma uma transcrição em decisões, ações e memória |
| `guardar` | transforma fonte real em átomo aprovado |
| `daily` | fecha o dia com julgamento ainda quente |
| `reindex` | revisa bandeja, fios e semana |
| `revisar` | verifica frescor |
| `teste` | mede o cérebro inteiro com perguntas-canário |
| `metodo` | explica e aplica Engenharia de Contexto |
| `atualizar` | atualiza motor sem tocar no que é privado |
| `society` | sincroniza o acervo exclusivo quando existe acesso de membro |

Pacotes entregues fora do catálogo público (pilotos de laboratório) carregam a própria skill;
o instalador a adiciona aos dois runtimes junto com o pacote.

Skill não é sistema: ela encapsula julgamento dentro de um pipeline com resultado e régua.
