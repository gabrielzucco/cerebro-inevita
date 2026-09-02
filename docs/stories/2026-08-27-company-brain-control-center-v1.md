# Story — Company Brain: centro operacional do Cérebro V1

## Contexto

A página `Cérebro` já reconhece as casas da empresa e prova a qualidade local da recuperação, mas
ainda apresenta duas versões concorrentes (`Mapa da empresa` e `Anatomia atual`). O membro não
precisa escolher um modelo mental: precisa saber se o Cérebro sustenta trabalho hoje, como a
memória está organizada, o que cada Run recuperou, o que foi aprendido e onde inspecionar a
infraestrutura.

Este corte transforma a página em um centro operacional com cinco vistas funcionais. Benchmark,
integridade de Run e aprendizado continuam verdades distintas. O produto nunca converte ausência
de instrumentação em zero nem infere volumes pelo número de arquivos.

## Estados de integridade por Run

- `Completo`: Run concluído, Context Snapshot presente, sem gaps, fallbacks ou conflitos, com
  referências selecionadas e marcadores de frescor observáveis.
- `Limitado`: Run concluído, mas com gap/fallback, frescor não verificável, avaliação pendente ou
  recuperação semântica que se absteve.
- `Bloqueado`: Run falhou/não concluiu, não tem Context Snapshot, possui conflito não resolvido ou
  a recuperação ligada falhou.
- Ausência de recuperação semântica ligada é `coleta direta/contratual`, não falha.
- O estado é composto por dimensões auditáveis; não existe percentual mágico por Run.

## Acceptance criteria

- [x] A página abre em `Visão geral` e oferece cinco vistas: Visão geral, Memória, Recuperação,
      Aprendizado e Arquitetura.
- [x] A navegação antiga de comparação entre `Mapa da empresa` e `Anatomia atual` deixa de existir.
- [x] A Visão geral responde o que funciona hoje, o que precisa de cuidado e o que ainda não pode
      ser calculado.
- [x] Memória preserva o mapa/inventário da empresa, Fontes e rotinas, sem virar gestor de tarefas.
- [x] Bruto, processado e destilado aparecem como `não instrumentado` enquanto não houver recibos
      canônicos de transição.
- [x] Frescor e Sistemas bloqueados não são calculados a partir de políticas textuais.
- [x] Recuperação separa benchmark global, operação histórica e integridade de cada Run.
- [x] Cada Run abre um inspetor sanitizado com `Contrato esperado` × `Contexto observado`.
- [x] O inspetor expõe apenas contagens, papéis, estados e reason codes; nunca query, conteúdo,
      snippet, referências privadas ou hashes.
- [x] Aprendizado mostra julgamentos, correções, outcomes, candidatos e inconsistências entre
      receipts e ledger; zero candidatos gera estado vazio honesto.
- [x] Arquitetura nomeia primeiro o Retrieval Provider genérico; GBrain aparece somente como
      implementação atual e substituível.
- [x] O grafo permanece acessível como mapa estrutural, sem alegar participação na recuperação.
- [x] Dados ausentes ou recibos inválidos produzem estados explícitos, sem quebrar a página.
- [x] Desktop e mobile preservam hierarquia calma, leitura linear e ausência de overflow.
- [x] Testes cobrem o read model, classificação dos Runs e fronteiras de privacidade.

## Fora deste corte

- Criar novos recibos de captura, processamento ou destilação.
- Tornar políticas textuais de frescor machine-readable.
- Calcular ranking entre empresas ou publicar benchmark na Society.
- Criar BI de marketing, CRM, funil ou tarefas dentro do Cérebro.
- Trocar ou reconfigurar GBrain.
- Implementar GraphRAG ou inferir que o grafo visual é o índice de recuperação.

## File List

- `docs/stories/2026-08-27-company-brain-control-center-v1.md`
- `docs/design-reviews/2026-08-27-company-brain-control-center-v1.md`
- `scripts/console-server.mjs`
- `console/app.js`
- `console/styles.css`
- `console/index.html`
- `scripts/test-company-brain-control-center-v1.mjs`
- `scripts/test-company-brain-control-center-invalid-v1.mjs`
- `scripts/test-company-brain-company-map-v0.mjs`
- `scripts/test-company-brain-orientation-v1.mjs`

## Verificação

- Estado real: 11/15 Fontes observadas; 8 Runs (`3 completos`, `5 limitados`, `0 bloqueados`).
- Recuperação: `91,4%` Hit@3 em 75 casos; 11 recibos (`7 accepted`, `2 abstained`, `2 failed`).
- Aprendizado: 4 julgamentos, 0 correções, 2 Runs com outcome, 0 candidatos; uma referência órfã
  e um julgamento excedente no mesmo Run aparecem como reconciliação.
- Desktop `1440 × 1000`: cinco vistas alternam, Run abre drawer e navegador termina sem logs.
- Mobile `375 × 812`: `scrollWidth 360`, tabs roláveis e nove linhas da tabela sem overflow.
- `git diff --check` e `node --check` — verdes.
- Testes novos e regressões do Company Brain — verdes.
- `node scripts/test-console-server.mjs` — verde com porta efêmera autorizada.
- `npm test` — verde: 19 envelopes, três Sistemas e 33 arquivos de Skills sincronizados.
