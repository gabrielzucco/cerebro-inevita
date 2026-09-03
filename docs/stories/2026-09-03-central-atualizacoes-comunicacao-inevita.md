# Story — Central de Atualizações e comunicação da INEVITA

**Data:** 2026-09-03  
**Status:** Concluída  
**Versão alvo:** v1.36.0

## Problema

O Cockpit já consegue verificar e aplicar uma atualização do motor, mas a página comunica apenas o estado técnico da instalação. O usuário não tem um lugar permanente para entender o que mudou, quais novidades vieram da INEVITA e quais releases pertencem ao Cérebro ou aos Sistemas. A Primeira Missão também não mostra, de forma discreta, que o produto continua evoluindo depois da instalação.

## Decisão de produto

- `Cérebro → Atualizações` é a superfície permanente e canônica de comunicação do produto.
- A Primeira Missão recebe somente um cartão compacto com a novidade mais recente; ela continua focada em ativar a primeira fonte e produzir o primeiro resultado.
- Atualização do motor, comunicação editorial e release de Sistema são objetos diferentes e aparecem separados.
- A versão inicial do canal usa um feed público empacotado com o produto e o histórico factual do `CHANGELOG.md`. Não envia contexto, dados da empresa ou telemetria para a INEVITA.
- A consulta à internet continua explícita pelo botão de verificar atualização. O Cockpit não faz busca remota automática ao abrir.
- O botão de aplicar atualização mantém todas as proteções existentes e nunca altera um checkout Git administrado pelo usuário.

## Critérios de aceite

- [x] A página `Cérebro → Atualizações` mostra claramente a versão instalada e permite verificar/aplicar atualização com os guardrails existentes.
- [x] A página tem uma seção `Da INEVITA` com novidades públicas e uma seção `Novos releases` com histórico do Cérebro.
- [x] Releases de Sistemas permanecem identificados como Sistemas e não são confundidos com releases do motor.
- [x] A Primeira Missão mostra apenas a novidade mais recente em um cartão compacto com acesso à central completa.
- [x] O modelo diferencia instalação, atualização do motor, comunicação e catálogo de Sistemas.
- [x] O contrato do feed rejeita entradas inválidas e limita os campos públicos que chegam à interface.
- [x] Nenhuma fonte, memória, saída ou dado privado da empresa é enviado ao canal de comunicação.
- [x] A experiência continua útil offline com o feed empacotado e o histórico local.
- [x] Testes, validação do produto e build do Cockpit passam.

## Tarefas

- [x] Criar o contrato local do feed público e seu parser validado.
- [x] Expor comunicação e histórico de releases no read model do Cockpit.
- [x] Evoluir a página permanente de Atualizações.
- [x] Adicionar o cartão compacto à Primeira Missão.
- [x] Cobrir contrato, modelo e renderização com testes.
- [x] Atualizar versão, changelog, manifesto e documentação.
- [x] Executar regressão e QA visual.

## Fora de escopo

- Feed remoto editorial em tempo real ou notificações push.
- Mensagens promocionais, ofertas e anúncios genéricos.
- Atualização automática em segundo plano.
- Telemetria de leitura, abertura ou uso.

## File List

- `docs/stories/2026-09-03-central-atualizacoes-comunicacao-inevita.md`
- `comunidade/inevita/atualizacoes/feed.v1.json`
- `comunidade/inevita/atualizacoes/_LEIA.md`
- `scripts/lib/communication-feed.mjs`
- `scripts/lib/brain-update-center.mjs`
- `scripts/lib/console-read-model.mjs`
- `scripts/console-server.mjs`
- `console/app.js`
- `console/styles.css`
- `scripts/test-communication-feed-v1.mjs`
- `scripts/test-company-brain-update-center-v1.mjs`
- `scripts/test-cockpit-first-mission.mjs`
- `scripts/test-company-brain-launcher-hierarchy-v1.mjs`
- `scripts/test-system-launcher-workspace.mjs`
- `scripts/test-system-workspace-dedup-v1.mjs`
- `scripts/validate-product.mjs`
- `.cerebro/motor.manifest`
- `VERSION`
- `CHANGELOG.md`
- `README.md`
- `COMECE-AQUI.md`
- `GLOSSARIO.md`

## Validação

- `npm test` — passou.
- `npm run build:console` — passou.
- Todas as suítes `scripts/test-*.mjs` — passaram; três expectativas legadas foram alinhadas
  aos rótulos e superfícies já vigentes (`Primeira Missão`, `Sobre` e `Ver Sistema`).
- QA visual no cockpit real — desktop e 390 px sem erro de console ou overflow horizontal.
- `git diff --check` — passou.
- O projeto não declara scripts de lint ou typecheck no `package.json`.
