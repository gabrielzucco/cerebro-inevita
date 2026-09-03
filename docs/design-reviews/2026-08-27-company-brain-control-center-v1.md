# Design Review — Company Brain Control Center V1

## Status

**PASS** — a página deixou de comparar duas representações do Cérebro e passou a responder cinco
perguntas operacionais distintas. Não há finding visual ou funcional bloqueando uso local.

## Escopo revisado

- Visão geral
- Memória
- Recuperação e inspetor por Run
- Aprendizado
- Arquitetura
- Desktop `1440 × 1000`
- Mobile `375 × 812`

## Findings resolvidos

### FINDING-002 — comparação de versões não era uma arquitetura de informação

`Mapa da empresa` e `Anatomia atual` obrigavam o usuário a escolher dois modelos mentais. A nova
navegação organiza o produto pelo trabalho: entender o estado, inspecionar memória, provar
recuperação, acompanhar aprendizado e abrir infraestrutura.

### FINDING-003 — benchmark, Run e aprendizado estavam visualmente contaminados

O Hit@3 de `91,4%` continua como benchmark local auditado. A integridade dos oito Runs aparece em
outra camada (`3 completos`, `5 limitados`, `0 bloqueados`) e o aprendizado em uma terceira
(`4 julgamentos`, `2 Runs com outcome`, `0 candidatos`). Nenhum score composto foi criado.

### FINDING-004 — ausência de telemetria parecia ausência de dado

Bruto, processado e destilado agora dizem `Não instrumentado`. Frescor por Fonte e prontidão dos
Sistemas dizem `Não calculado`, porque as políticas atuais são textuais. A UI não usa contagem de
pastas nem interpreta texto livre como semáforo.

### FINDING-005 — o Context Snapshot não era legível como prova

Cada Run abre um drawer com `Contrato esperado` × `Contexto observado`: Fontes obrigatórias,
evidência mínima, condições de parada, contagem de refs, marcadores de frescor, eval, gaps,
conflitos e fallback. Query, conteúdo, snippets, refs privadas, hashes e erro bruto não entram no
read model.

## Evidência visual e funcional

- Desktop: hierarquia linear, uma âncora principal e hairlines; sem mosaico decorativo ou nova
  paleta de branding.
- Mobile: tabs rolam horizontalmente; tabela de Runs vira leitura em blocos; `scrollWidth 360`
  para `innerWidth 375`.
- Memória: três estados `Não instrumentado`, mapa pesquisável, Fontes e rotinas preservados.
- Recuperação: oito Runs renderizados e Run de Próxima Melhor Ação Comercial abre o snapshot com
  `4/4` marcadores de frescor.
- Aprendizado: empty state correto para zero candidatos e duas inconsistências de reconciliação.
- Arquitetura: Retrieval Provider genérico aparece antes de `gbrain 0.46.30.0`; grafo declara que
  é mapa estrutural e não prova GraphRAG.
- Navegador: zero logs de console na rodada final.

## Verificação automatizada

- `git diff --check` — verde.
- `node --check console/app.js` — verde.
- `node --check scripts/console-server.mjs` — verde.
- Testes novos de read model e recibos inválidos — verdes.
- Regressões de mapa, orientação, recuperação, launcher, product cut, workspace e Canvas — verdes.
- `node scripts/test-console-server.mjs` — verde em ambiente com porta efêmera autorizada.
- `npm test` — verde: 19 envelopes, três Sistemas e 33 arquivos de Skills sincronizados.
- O projeto não declara scripts `lint` ou `typecheck` no `package.json`.
