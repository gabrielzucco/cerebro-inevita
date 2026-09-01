# Story — Society mostra a fundação do Funil Vivo

## Contexto

O Console local já separa Sistemas instalados da Society, mas a página Society ainda é apenas uma
fronteira conceitual. O primeiro caso de catálogo é o Funil Vivo, derivado de uma operação humana
real e ainda sem aceite do criador, pacote, Runs distribuídos ou outcome julgado.

O card não pode aparecer em `Sistemas`, porque não está instalado neste Company Brain. Também não
pode abrir checkout: antes dos gates técnicos, a rede pode mostrar a fundação e sua evidência, não
vender uma promessa inexistente.

## Acceptance criteria

- [x] Um catálogo público e content-free viaja com o motor sem dados de qualquer Company Brain.
- [x] `/api/console` expõe estágio, claims, fontes exigidas, evidência e checkout do catálogo.
- [x] Society mostra o Funil Vivo como `Em fundação`, separado dos Sistemas instalados.
- [x] O card declara zero empresas, zero Runs e zero outcomes julgados.
- [x] Nenhum nome de criador é publicado antes de aceite explícito.
- [x] Abrir Society não chama modelo, não lê fonte privada e não instala nada.
- [x] Testes do Console e validação completa permanecem verdes.

## Fora deste corte

- checkout, entitlement, download ou instalação;
- ficha detalhada e aplicação própria;
- sincronização remota do catálogo;
- branding final do criador;
- Release Manifest normativo e assinatura do pacote.

## File List

- `docs/stories/2026-08-29-society-funil-vivo-founding-release.md`
- `society/catalog.v1.json`
- `.cerebro/motor.manifest`
- `scripts/lib/console-read-model.mjs`
- `console/app.js`
- `console/styles.css`
- `scripts/test-console-server.mjs`
- `scripts/validate-product.mjs`
