# System Runtime Binding V1 — interface própria instalada

## Objetivo

Separar a personalidade publicada de um Sistema da ligação privada da instalação. O System Contract declara que existe uma interface própria; o System Runtime Binding local resolve host, workspace e endereço sem acoplar o Cockpit ao GTM ou à porta 3300.

## Decisão de corte

`executor-binding` e `collector-binding` já são bindings privados especializados. Este V1 acrescenta o terceiro consumidor real da família: a superfície web de um Sistema. Ele não tenta unificar execução, coleta, modelo ou deploy antes de esses consumidores exigirem um envelope comum.

## Acceptance criteria

- [x] Existe schema e validador `system-runtime-binding` V1 com apenas campos consumidos neste corte.
- [x] O binding é privado, reference-only e vive sob `.cerebro/runtime/system-bindings/`.
- [x] O System Contract do GTM não contém host, porta ou URL da instalação.
- [x] O System Contract pode declarar `interface_role` sem declarar onde ela executa.
- [x] O read model resolve a interface pelo `system_ref` do binding e preserva fallback legado sem promovê-lo a padrão.
- [x] O Launcher distingue `sem interface própria`, `aplicação não instalada`, `aplicação indisponível` e `abrir aplicação`.
- [x] A verificação de saúde usa a política do binding com teto seguro do servidor e continua sem polling.
- [x] O binding local do GTM é instalado no Cérebro da empresa e não entra no Git.
- [x] Abrir o Cockpit não inicia, reinicia ou executa o GTM.
- [x] Testes cobrem binding válido/inválido, duplicidade, prioridade sobre legado e os estados de UI.

## Fora do corte

- Release Manifest e atualização do Sistema.
- Experience Manifest e identidade visual final.
- Iniciar/parar processos pelo Cockpit.
- Deploy, descoberta de porta ou supervisão contínua.
- Unificar executor, collector e interface num schema especulativo.

## Tasks

- [x] Criar protocolo, exemplo e persistência segura.
- [x] Integrar o binding ao layout e ao read model.
- [x] Remover a URL local do contrato publicado do GTM.
- [x] Instalar o binding privado no Company Brain real.
- [x] Validar os estados no Console e fechar recibos.

## File List

- `docs/stories/2026-08-27-system-runtime-binding-v1.md`
- `protocol/system-runtime-binding.schema.json`
- `protocol/examples/system-runtime-binding.v1.json`
- `protocol/README.md`
- `.cerebro/layout.json`
- `profiles/company-brain-starter-en/.cerebro/layout.json`
- `scripts/lib/system-runtime-binding.mjs`
- `scripts/lib/company-brain-protocol-v2.mjs`
- `scripts/lib/console-read-model.mjs`
- `scripts/lib/system-interface-health.mjs`
- `scripts/console-server.mjs`
- `scripts/console-bootstrap.mjs`
- `scripts/protocol-validate.mjs`
- `scripts/validate-product.mjs`
- `console/app.js`
- `sistemas/next-best-gtm/contract.json`
- `sistemas/next-best-gtm/manifest.md`
- `scripts/test-system-runtime-binding-v1.mjs`
- `scripts/test-system-interface-health-v1.mjs`
- `scripts/test-gtm-console-integration.mjs`
- `scripts/test-console-server.mjs`
- `scripts/test-company-brain-starter.mjs`
