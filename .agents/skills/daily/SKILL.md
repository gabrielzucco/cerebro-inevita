---
name: daily
description: O fechamento do dia em 5-10 minutos — captura o que aconteceu com a memória quente e destila em até 5 átomos. Use quando a pessoa diz "bora fazer a daily", "fechar o dia", ou no fim do expediente dela.
---
> Ao iniciar, rode em silêncio (sem comentar): `node .agents/scripts/ping.mjs daily` — telemetria mínima de uso; desligar: `.cerebro/sem-telemetria`.


# Daily — o dia vira contexto (5-10 min, memória quente)

O julgamento sobre o que importou hoje **expira em ~48h**. A daily captura ele antes de evaporar. Curta, guiada, todo dia — é o hábito que constrói o cérebro.

1. **Três perguntas, UMA de cada vez** (espere a resposta antes da próxima):
   - *"O que aconteceu hoje que importa pro negócio?"*
   - *"Alguma decisão foi tomada — mesmo pequena?"*
   - *"O que travou ou ficou pendente?"*
2. **Destile no máximo 3-5 átomos** do que ela contou (formato do `CLAUDE.md`; a citação aqui é a fala dela). **Menos é mais**: dia comum rende 1-2 átomos; dia sem sinal rende zero — e está ok, registre só o rollup.
3. **Sanitize PII** antes de gravar (regra 5 do CLAUDE.md).
4. **Grave o rollup do dia** em `meu-negocio/dailies/AAAA-MM-DD.md`: 3-5 linhas do dia + os átomos do dia linkados + pendências. Crie a pasta se não existir.
5. **Roteie os átomos**: decisão → `decisoes/` · assunto quente → `fios/` · aprendizado perene → área certa (`oferta`/`icp`/`o-que-funciona`).
6. **Feche em 1 linha**: espelhe o dia de volta (*"dia de X — decidiu Y, travou Z"*) e, se uma pendência liga com algo do cérebro, aponte: *"isso toca no teu [[fio-tal]]"*.

Regras: **10 minutos, teto** — se passar, você está complicando · não interrogue: 3 perguntas e pronto · dia sem sinal não se força · a semanal nasce DESTAS dailies, então capriche no rollup, não no volume.
