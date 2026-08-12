# Sistemas instalados

Sistema é um pacote de resultado: manifest, pipeline, rotinas, skill, eval, feedback e changelog.
Escolha pelo que precisa sair pronto — não pela ferramenta.

| Sistema | Estado | Resultado | Como operar |
|---|---|---|---|
| [Cérebro Base](cerebro-base/manifest.md) | beta instalado | fonte real vira artefato aprovado e volta a trabalhar | `/comecar` |
| [Calls em Decisões](calls/manifest.md) | beta instalado | reunião vira decisões, ações e memória citável | `operar calls` ou `/call` |

## Estados

- **instalado:** disponível neste cérebro.
- **beta:** executável, mas ainda acumulando casos e correções.
- **validado:** repetiu o resultado com a régua em casos reais.
- **publicado:** pode ser distribuído com versão e rollback.

O catálogo da INEVITA mostra outros sistemas disponíveis ou em construção em
`comunidade/inevita/_CATALOGO.md`. Uma linha no roadmap não significa que o sistema já existe.

## Construir um Sistema próprio

1. Use `/arquiteto` para encontrar e confirmar o primeiro resultado.
2. Siga [`METODO-SISTEMAS.md`](../METODO-SISTEMAS.md).
3. Copie [`templates/sistema/`](../templates/sistema/) e rode um caso real ponta a ponta.
4. Quando houver uma mudança a testar, use
   [`METODO-EXPERIMENTOS.md`](../METODO-EXPERIMENTOS.md) e
   [`templates/experimento.md`](../templates/experimento.md).

Template em branco não é Sistema validado. Validação exige resultado repetido com eval, decisão
humana, feedback e versão.
