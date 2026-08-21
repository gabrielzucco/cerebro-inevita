# Evals — Calls em Decisões

## Gate determinístico — executável, não prosa

Quando scripts estiverem disponíveis, o gate roda em código (o mesmo que o CI executa):

```
node scripts/eval-calls.mjs <fonte> <garimpo>
```

- **g1 · citação literal** — todo blockquote existe verbatim na fonte; paráfrase reprova.
  O escape honesto `(não consta na fonte)` isenta a linha: afirmar sem prova é permitido
  desde que declarado.
- **g2 · timestamp** — fonte com minutagem exige minutagem em cada citação; fonte sem
  timestamps torna o gate não-aplicável.
- **g3 · PII** — e-mail, telefone e CPF nunca atravessam para o garimpo (participante é
  papel, não pessoa). A fonte pode conter PII; sanitizar é o trabalho.
- **g4 · dono** — bullet sob "Compromissos/Ações" exige `dono:`; sem dono, o lugar honesto
  é "Pendências".

Sem scripts no ambiente, aplique os quatro itens acima como checklist manual — mas o
resultado só conta como gate verificado quando o código rodou.

Continuam fora do código, por desenho (exigem julgamento; só entram com juiz calibrado
contra rótulo humano):

- [ ] Número ambíguo foi confirmado ou marcado como incerto.
- [ ] Nenhum arquivo derivado foi gravado sem aprovação (verificação de conduta, não de artefato).

## Régua humana

Pergunte uma vez, em linguagem de uso: **“Você usaria isso do jeito que está ou mudaria alguma
coisa antes?”**

- **usaria:** A2 = `first_value_confirmed` depois do salvamento.
- **mudaria:** peça uma correção concreta, aplique e mostre novamente.
- **não usaria:** registre o motivo; não maquie a execução como sucesso.

## Qualidade do sistema

O sistema sai de beta depois de pelo menos três fontes reais com A2 confirmado, zero vazamento de
privacidade e correções incorporadas de forma versionada. Volume sozinho não promove maturidade.
