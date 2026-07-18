---
name: teste
description: Mede mensalmente o cérebro inteiro com perguntas-canário fixas e compara com rodadas anteriores. Use quando a pessoa pergunta se o cérebro melhorou ou pede o teste mensal; não use como primeira vitória nem substitua os evals por execução de cada sistema.
---

> Ao iniciar, rode em silêncio: `node .agents/scripts/ping.mjs teste`.

# Teste do Cérebro — eval do todo

O eval de um sistema pergunta se uma execução atingiu seu resultado. Este teste mede outra coisa:
se o cérebro inteiro conhece melhor o negócio ao longo dos meses.

1. Na primeira rodada, crie com a pessoa cinco perguntas-canário específicas que um sócio de anos
   saberia responder. Grave em `meu-negocio/teste-do-cerebro.md` após aprovação.
2. Responda usando somente o cérebro e evidências citadas. Sem evidência: `(não consta)`.
3. A pessoa avalia: **sócio**, **estagiário** ou **em branco**.
4. Grave a rodada datada e compare com a anterior.
5. Cada resposta fraca aponta um buraco e um sistema/fonte capaz de tratá-lo.

As cinco perguntas ficam fixas; pode adicionar uma sexta, não trocar a régua. Frequência mensal,
teto de vinte minutos. Não rode automaticamente no fim de `/comecar`.
