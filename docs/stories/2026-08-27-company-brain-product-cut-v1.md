# Story — Company Brain product cut V1

## Contexto

O Console real já projeta contratos, Fontes, Runs, julgamento e Sistemas instalados, mas três
fricções quebram a confiança e a sensação de produto: o Canvas oferece Replay mesmo quando o Run
não possui eventos, o motor gráfico de aproximadamente 1,5 MB é carregado em todas as páginas, e
`Meus Sistemas` ainda parece inventário técnico em vez de launcher.

Este corte não cria Experience Manifest nem Loja. Ele melhora a superfície instalada usando apenas
verdade já disponível no System Contract e no ledger. Identidade visual é um slot local e
determinístico; publisher, foto e responsável pelo julgamento continuam ausentes até existir
contrato próprio.

## Acceptance criteria

- [x] A ação do Run se chama `Reproduzir trace`, nunca sugere reexecução do Sistema e nasce
      desabilitada até o grafo confirmar eventos reproduzíveis.
- [x] Run sem eventos mantém resultado e lineage visíveis, mas explica na própria toolbar que o
      replay visual não está disponível; nenhuma timeline é sintetizada.
- [x] `canvas.bundle.js` deixa de ser importado no bootstrap e só é carregado ao abrir o Mapa
      Operacional.
- [x] O ambiente visual usa no máximo 72 partículas, limita o device pixel ratio e pausa quando a
      aba fica oculta; `prefers-reduced-motion` desenha um frame estático.
- [x] `Meus Sistemas` vira grade compacta e filtrável por função empresarial, sem mostrar os nomes
      internos `Crescimento`, `Fundação` e `Produto comunidade` como categorias da experiência.
- [x] Cada card possui identidade reconhecível, resultado curto, saúde, última execução, dono
      operacional declarado e duas portas inequívocas: inspecionar no Cockpit e abrir o app.
- [x] Ausência de interface, publisher, imagem ou julgador não é preenchida por invenção.
- [x] Desktop e mobile preservam foco visível, leitura compacta e ações acessíveis por teclado.
- [x] Testes estruturais cobrem as três regressões e a suíte existente permanece verde.

## Fora deste corte

- Experience Manifest, Release Manifest, Brain SDK ou schema de catálogo.
- Loja/Society, instalação e filtros públicos persistidos.
- Foto de publisher ou julgador sem referência contratual.
- Grafo da Memória e redesenho completo da página Cérebro.
- Reexecução de um Sistema a partir do botão de trace.
- Migração ou fabricação de traces históricos.

## File List

- `docs/stories/2026-08-27-company-brain-product-cut-v1.md`
- `console/app.js`
- `console/styles.css`
- `scripts/lib/console-read-model.mjs`
- `scripts/test-system-launcher-workspace.mjs`
- `scripts/test-company-brain-product-cut-v1.mjs`
- `scripts/validate-product.mjs`

## Verificação

- `node --check console/app.js`
- `node scripts/test-company-brain-product-cut-v1.mjs`
- `node scripts/test-system-launcher-workspace.mjs`
- `node scripts/test-console-server.mjs`
- `node scripts/test-canvas-layout-readability.mjs`
- `npm test`
- QA visual no Company Brain real em `http://127.0.0.1:4782`.

Resultado: todas as verificações verdes. No navegador real, o bootstrap fechou em 59 ms e não
carregou `canvas.bundle.js`; o bundle apareceu somente após abrir o Canvas. O Run
`c65d06ba-0358-4ef4-a7ee-fadc9f6aac93` mostrou `0 eventos`, explicação visível e botão
desabilitado. O Run `routine-run-b868df8b-5a25-4d35-a1b4-2b926f4e6020` mostrou `25 eventos` e
reproduziu o primeiro evento. Launcher revisado em 1280×720 e 375×812, sem erro de console ou CSP.
