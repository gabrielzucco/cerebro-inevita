# Sistemas instalados

Sistema é um pacote de resultado: manifest, Capability, System Contract, pipeline, rotinas, skill,
eval, feedback e changelog.
Escolha pelo que precisa sair pronto — não pela ferramenta.

| Sistema | Estado | Resultado | Como operar |
|---|---|---|---|
| [Calls em Decisões](calls/manifest.md) | beta instalado | reunião vira decisões, ações e memória citável | `operar calls` ou `/call` |

## Capacidade nativa do Cérebro

O [Cérebro Base](cerebro-base/manifest.md) é a capacidade de ativação, memória, recuperação e
aprendizado do próprio Cérebro. Ele mantém contrato e versão internos, mas **não é um Sistema de
negócio** e por isso não aparece no launcher `Sistemas`. A primeira ativação começa com `/comecar`.

## Estados

- **instalado:** disponível neste cérebro.
- **beta:** executável, mas ainda acumulando casos e correções.
- **validado:** repetiu o resultado com a régua em casos reais.
- **publicado:** pode ser distribuído com versão e rollback.

O catálogo da INEVITA mostra outros sistemas disponíveis ou em construção em
`comunidade/inevita/_CATALOGO.md`. Uma linha no roadmap não significa que o sistema já existe.

## Construir um Sistema próprio

1. Use `/arquiteto` para encontrar e confirmar o primeiro resultado.
2. Use `/sistematizar` para observar um caso real, aprovar o contrato e gerar o pacote local.
3. Rode `/operar <system-id>` manualmente ponta a ponta; conexão e agenda vêm depois da prova.
4. Quando houver uma mudança a testar, use
   [`METODO-EXPERIMENTOS.md`](../METODO-EXPERIMENTOS.md) e
   [`templates/experimento.md`](../templates/experimento.md).

Template em branco não é Sistema instalado. Primeiro run aprovado não é Sistema validado.
Validação exige resultado repetido com eval, decisão humana, feedback e versão.
