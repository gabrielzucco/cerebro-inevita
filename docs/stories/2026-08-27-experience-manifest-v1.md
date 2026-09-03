# Experience Manifest V1 — identidade e abertura do Sistema

## Objetivo

Publicar a personalidade mínima que o Cockpit realmente consome para apresentar e abrir um
Sistema, sem absorver o front-end do Sistema e sem misturar contrato de negócio, binding privado
ou julgamento da empresa.

## Decisão de corte

- O System Contract continua dono do resultado, Fontes, gates e política de aprendizado.
- O Experience Manifest publica **quem oferece o Sistema**, sua assinatura curta, sua marca mínima
  e a superfície que pode ser aberta pelo Cockpit.
- O System Runtime Binding continua dono de host, workspace, URL e saúde da instalação.
- O Cockpit usa a identidade só no módulo de marca e no publisher. Card, borda, tipografia,
  estados, Runs e confiança continuam constitucionais.
- V1 nasce do GTM real: marca `N`, acento verde-limão, assinatura `Quem mover. Como mover.` e uma
  superfície web primária. Imagem, foto, design system completo e múltiplas superfícies esperam um
  consumidor real.

## Acceptance criteria

- [x] Existe schema, exemplo e validador fechado para Experience Manifest V1.
- [x] O Manifest não aceita URL, host, workspace, credencial, Fonte, permissão, resultado, modelo,
      prompt, output, julgamento ou design system.
- [x] O GTM possui Manifest publicado com publisher INEVITA e personalidade observada em sua
      aplicação real.
- [x] A instalação real do Company Brain possui uma cópia local do Manifest ligada ao System
      Contract instalado, sem copiar o Runtime Binding.
- [x] O read model separa `experience` de `runtime_binding` e mantém fallback neutro para Sistemas
      sem Manifest.
- [x] O Launcher mostra publisher, assinatura e marca do GTM sem colorir o card inteiro nem mudar
      a borda constitucional.
- [x] O rótulo do botão de abertura vem da superfície publicada, mas o destino continua resolvido
      exclusivamente pelo Runtime Binding.
- [x] O workspace inspecionado mostra System Contract, Experience Manifest e Runtime Binding como
      envelopes distintos.
- [x] Busca encontra publisher e assinatura sem expor conteúdo privado.
- [x] Testes cobrem Manifest válido, campos proibidos, duplicidade, fallback, separação do runtime
      e a projeção visual.

## Fora do corte

- Release Manifest, atualização, rollback e migração.
- Imagem, foto, upload de asset ou tema completo do criador.
- Society Registry, catálogo público, instalação ou monetização.
- Deep links com payload, notificações e quick actions.
- Identidade do julgador ou transferência de julgamento entre empresas.
- Incorporar o front-end do GTM dentro do Cockpit.

## Tasks

- [x] Criar protocolo, exemplo e leitura segura.
- [x] Publicar e instalar o Manifest do GTM.
- [x] Projetar a identidade no Launcher e no workspace.
- [x] Cobrir regressões e validar no Company Brain real.
- [x] Fechar recibo.

## Recibo

- Company Brain real: 17 Sistemas; o GTM instalado resolveu o Experience Manifest
  `proxima-melhor-acao-comercial-experience` e o Runtime Binding
  `system-runtime-next-best-gtm-local` sem misturar os dois objetos.
- Launcher: busca por `INEVITA` encontrou um único card com marca `N`, assinatura
  `Quem mover. Como mover.`, publisher INEVITA e superfície `Abrir aplicação`.
- Destino observado: `http://localhost:3300/`, resolvido somente pelo Runtime Binding; aplicação
  Next Best GTM respondeu 200 e sem erro de console.
- Workspace: System Contract, Experience Manifest e Runtime Binding visíveis como envelopes
  distintos; versão estreita em 700 px sem overflow horizontal.
- Validação: teste dedicado, Launcher, integração GTM, servidor, starter e `npm test` verdes; zero
  erros ou warnings no navegador.

## File List

- `docs/stories/2026-08-27-experience-manifest-v1.md`
- `protocol/experience-manifest.schema.json`
- `protocol/examples/experience-manifest.v1.json`
- `protocol/README.md`
- `.cerebro/layout.json`
- `profiles/company-brain-starter-en/.cerebro/layout.json`
- `sistemas/next-best-gtm/experience.json`
- `scripts/lib/experience-manifest.mjs`
- `scripts/lib/console-read-model.mjs`
- `scripts/console-bootstrap.mjs`
- `scripts/protocol-validate.mjs`
- `scripts/validate-product.mjs`
- `scripts/test-experience-manifest-v1.mjs`
- `scripts/test-company-brain-starter.mjs`
- `console/app.js`
- `console/styles.css`
- Company Brain local: `.cerebro/contracts/experiences/proxima-melhor-acao-comercial.json`
