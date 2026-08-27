# Story — Company Brain: taxonomia canônica dos Sistemas V1

## Contexto

O Cockpit classifica os mesmos 17 Sistemas por três vocabulários concorrentes: áreas internas no
sidebar, funções empresariais inferidas pelo nome dos Sistemas no Launcher e os clusters legados
`crescimento`, `fundacao` e `produto-comunidade` no Canvas. As contagens ficam tecnicamente
possíveis, mas semanticamente ambíguas: selecionar uma área mostra três Sistemas enquanto o menu
continua exibindo o total global de 17, e o Launcher chama objetos apenas mapeados de instalados.

Este corte separa dois eixos que respondem perguntas diferentes e faz as superfícies derivarem das
mesmas declarações contratuais:

- `operating_area`: quem responde internamente pelo Sistema;
- `business_function`: qual função empresarial o Sistema exerce e como será descoberto na Society.

## Acceptance criteria

- [x] Os 17 System Contracts declaram `operating_area` e `business_function` explicitamente.
- [x] A configuração de migração preserva os dois eixos e não usa os clusters legados como
      taxonomia canônica.
- [x] O importador propaga os dois eixos para contratos gerados sem reintroduzir inferência pelo
      nome do Sistema.
- [x] O read model expõe catálogo, rótulos e classificação canônica para cada Sistema.
- [x] Sidebar e filtros usam eixos nomeados: área responsável no escopo e função empresarial no
      Launcher.
- [x] O Launcher não chama Sistemas mapeados/configurados de instalados e explica o recorte ativo.
- [x] O Canvas mostra Comercial, Operações & Tecnologia e Produto & Comunidade, sem
      `Crescimento`, `Fundacao` ou `Produto comunidade`.
- [x] A classificação não é inferida por regex, nome, resultado ou id do Sistema.
- [x] Testes cobrem os 17 Sistemas, as contagens 7/3/7 por área e 4/3/2/1/3/4 por função.
- [x] A documentação canônica da empresa distingue área responsável de função empresarial.

## Fora deste corte

- Redesenhar a página Hoje.
- Implementar healthcheck ou iniciar a aplicação externa do GTM.
- Criar as superfícies globais de Skills e Runtime.
- Construir o catálogo da Society.
- Remover compatibilidade de leitura para contratos legados ainda baseados em `area_ref`.

## File List

- `docs/stories/2026-08-27-company-brain-system-taxonomy-v1.md`
- `scripts/lib/system-taxonomy.mjs`
- `scripts/lib/console-read-model.mjs`
- `scripts/lib/graph-read-model.mjs`
- `scripts/lib/legacy-system-import.mjs`
- `scripts/test-company-brain-taxonomy-v1.mjs`
- `console/app.js`
- Cérebro raiz: `.cerebro/migration/system-map.v1.json`
- Cérebro raiz: `.cerebro/contracts/systems/*.json` (17 contratos locais regeneráveis)
- Cérebro raiz: `01-nucleo-privado/_SISTEMAS.md`

## Verificação

- Classificação real: 17 Sistemas; áreas responsáveis `7/3/7`; funções empresariais
  `4/3/2/1/3/4` na ordem Vendas, Marketing, Produto, Operações, Comunidade e Dados & Tecnologia.
- Launcher real: `17 Sistemas neste Cérebro`, com `4 ativos · 10 configurados · 3 mapeados`.
- Recorte real: Operações & Tecnologia mostra `3 de 17` e mantém os três cards classificados como
  Dados & Tecnologia.
- Canvas real: somente Comercial, Operações & Tecnologia e Produto & Comunidade; zero ocorrência
  dos três clusters legados; console sem warnings ou erros.
- `COMPANY_BRAIN_ROOT=... node scripts/test-company-brain-taxonomy-v1.mjs` — verde.
- Importador real: preview, confirmação de três contratos locais defasados e segundo preview
  `no-change` (`26/26` objetos idempotentes).
- `node scripts/test-console-server.mjs` — verde com porta efêmera autorizada.
- 10 regressões do Launcher, Cérebro, workspace, Canvas, grafo e importador — verdes.
- `npm test` — verde: 19 envelopes, três Sistemas e 33 arquivos de Skills sincronizados.
- `node --check` e `git diff --check` — verdes.
