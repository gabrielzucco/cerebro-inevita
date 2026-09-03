# Company Brain — CTA e saúde da interface V1

## Objetivo

Fazer o Launcher distinguir, sem ambiguidade, entre inspecionar um Sistema no Cockpit e abrir sua aplicação própria. A aplicação só aparece como disponível depois de uma verificação técnica barata e segura.

## Acceptance criteria

- [x] `Abrir aplicação` é a ação primária e tem área clicável mínima de 44 px.
- [x] `Inspecionar` permanece uma ação secundária explícita, também com 44 px.
- [x] Interface não declarada não produz um falso botão de abrir.
- [x] Interface declarada e indisponível aparece como `Aplicação indisponível`.
- [x] Interface declarada e disponível abre em nova aba com `noopener noreferrer`.
- [x] A verificação acontece uma vez por Sistema durante a carga atual; não há polling.
- [x] O servidor só testa HTTP local (`localhost`, `127.0.0.1` ou `::1`) com timeout de 800 ms.
- [x] O teste não executa modelo, não inicia processo e não expõe conteúdo da aplicação.
- [x] Launcher e workspace usam a mesma leitura de disponibilidade.
- [x] Há teste automatizado para interface disponível, indisponível, não declarada e não verificável.

## Fora do corte

- Iniciar ou reiniciar runtimes.
- Runtime Binding genérico.
- Configurar a URL da interface pelo Cockpit.
- Monitoramento contínuo, alertas ou telemetria histórica.

## Tasks

- [x] Criar o probe seguro e o endpoint autenticado.
- [x] Adicionar cache de sessão e estado de carregamento no front-end.
- [x] Redesenhar os CTAs do card e do workspace.
- [x] Cobrir o contrato com testes e validar no Console vivo.
- [x] Registrar recibo no painel do Cérebro.

## File List

- `docs/stories/2026-08-27-company-brain-interface-health-v1.md`
- `console/app.js`
- `console/styles.css`
- `scripts/console-server.mjs`
- `scripts/lib/system-interface-health.mjs`
- `scripts/test-system-interface-health-v1.mjs`
- `scripts/test-console-server.mjs`
