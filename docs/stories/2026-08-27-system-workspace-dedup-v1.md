# Story — Workspace de Sistema sem superfícies duplicadas

## Contexto

O workspace constitucional de cada Sistema já projeta contrato, instalação, Runs, Experimentos e
julgamento usando as mesmas casas de verdade do Company Brain. A primeira versão, porém, expõe um
`Canvas` resumido ao lado do Mapa Operacional global e replica a Caixa de Julgamento dentro do
Sistema. Isso faz três superfícies diferentes parecerem donas da mesma operação.

O corte fixa uma responsabilidade por superfície: `Como funciona` explica a arquitetura declarada
e instalada; `Execuções` mostra o que aconteceu e o estado do julgamento de cada Run; a fila global
de `Julgamento` continua sendo a única mesa constitucional. Experimentos e Aprendizado voltam ao
workspace como projeções filtradas, sem criar ledgers novos.

## Acceptance criteria

- [x] O workspace expõe exatamente `Visão geral`, `Como funciona`, `Execuções`, `Experimentos`,
      `Aprendizado` e `Configuração`.
- [x] Não existe aba local `Julgamento`; a fila global continua sendo uma única Caixa de Julgamento.
- [x] `Como funciona` possui apenas as leituras `Declarado` e `Instalado`, sem repetir o último Run.
- [x] O diagrama leve de `Como funciona` abre a escala do Sistema no Mapa Operacional global, sem
      criar um segundo Canvas interativo.
- [x] Cada linha de `Execuções` associa o Run ao Judgment Receipt real quando ele existe e permite
      abrir o julgamento ou o trace pelos handlers constitucionais já existentes.
- [x] `Execuções` explica que decisão e recibo pertencem à fila única e oferece acesso direto a ela.
- [x] Experimentos aparecem tanto na Estrutura global quanto filtrados dentro do Sistema.
- [x] Aprendizado mostra somente outcomes, correções e replays observados; ausência de prova
      continua explícita.
- [x] Configuração mantém Rotinas, bindings, grants, versões e interface sem assumir autoridade de
      governança global.
- [x] Desktop e mobile preservam leitura, foco e ações acessíveis por teclado.
- [x] Testes estruturais impedem a volta da aba local de Julgamento, do modo `Último Run` em
      `Como funciona` e de um segundo Canvas.

## Fora deste corte

- Alterar Judgment Receipt, Run Record, System Contract ou APIs do workspace.
- Filtrar ou persistir a fila global de julgamento por Sistema.
- Redesenhar o Mapa Operacional, o Cérebro ou o Launcher.
- Criar Experience Manifest, Release Manifest, Runtime Binding genérico ou Brain SDK.
- Instalar, atualizar ou publicar Sistemas na Society.

## File List

- `docs/stories/2026-08-27-system-workspace-dedup-v1.md`
- `console/app.js`
- `console/styles.css`
- `scripts/test-system-launcher-workspace.mjs`
- `scripts/test-system-workspace-dedup-v1.mjs`
- `scripts/validate-product.mjs`

## Verificação

- `node --check console/app.js`
- `node scripts/test-system-workspace-dedup-v1.mjs`
- `node scripts/test-system-launcher-workspace.mjs`
- `node scripts/test-console-server.mjs`
- `npm test`
- QA visual no Company Brain real em `http://127.0.0.1:4782`.

Resultado: todas as verificações verdes. No navegador real, o Sistema GTM mostrou as seis
superfícies, `Como funciona` somente com `Declarado`/`Instalado` e nenhuma aba local de
Julgamento. Em Funil e Crescimento, Execuções ligou três Runs a estados distintos: pendente com
`Julgar`, aprovado com `Ver recibo` e decisão histórica registrada apenas no Run Record. O drawer
constitucional abriu pelo recibo e `Abrir fila` saiu do workspace para a Caixa de Julgamento
global. Em 375×812, abas e tabelas rolam dentro dos próprios contêineres e a página ficou sem
overflow horizontal. Console e rede ficaram sem erros.
