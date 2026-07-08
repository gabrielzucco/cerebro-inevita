---
name: revisar
description: A revisão mensal de frescor — encontra notas velhas ou conflitantes no meu-negocio/ e a pessoa confirma, atualiza ou marca como superada. Use quando a pessoa diz "revisar o cérebro", "isso ainda vale?", ou 1x por mês.
---

# Revisar — frescor mensal (a verdade muda; a nota tem que acompanhar)

A nota mais perigosa do cérebro é a que **morreu fingindo estar viva**: o preço antigo, a oferta que mudou, a decisão revertida — contaminando cada resposta. Esta skill caça essas notas. Nada se deleta: se marca.

1. **Varra `meu-negocio/`** (fora `arquivo/` e `dailies/`) e liste as suspeitas:
   - notas com `confirmado:` há **mais de 60 dias** (ou sem o campo)
   - **conflitos**: duas notas afirmando coisas incompatíveis (ex.: dois preços, dois ICPs)
   - notas de `fios/` paradas há mais de 30 dias
2. **Apresente a lista em ordem de risco** (áreas centrais primeiro: oferta → icp → posicionamento) com o teor de cada uma em 1 linha.
3. **Uma por vez, três saídas** — pergunte *"isso ainda vale?"*:
   - **Vale** → atualize `confirmado: <hoje>` no frontmatter. Só isso.
   - **Mudou** → edite COM a pessoa (o novo teor precisa de evidência nova) + `confirmado: <hoje>`.
   - **Morreu** → marque `status: superado` no frontmatter e acrescente 1 linha no topo: *"Superada em <data> por [[nota-nova]]"*. A nota fica — vira histórico, sai do caminho.
4. **Conflitos são prioridade**: mostre as duas citações lado a lado e pergunte qual é a verdade atual. Uma vence (`confirmado:`), a outra se marca (`superado`).
5. **Feche com o placar**: *"N confirmadas, N atualizadas, N superadas — teu cérebro está X% fresco"* (fresco = confirmado há menos de 60 dias).

Regras: **20 minutos, teto** — se a lista for longa, só as 10 mais arriscadas e o resto fica pro mês que vem · nunca delete nem "conserte" nota sozinho — quem sabe a verdade atual é a pessoa · nota `superado` nunca entra em resposta como fato vigente (só como histórico, dizendo que é histórico).
