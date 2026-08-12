---
name: arquiteto
description: Mapeia uma operação real, explicita o estado das evidências (V0→V3), propõe até três oportunidades e recomenda o primeiro sistema sem fingir certeza. Use quando a pessoa perguntar por onde começar, onde aplicar o Cérebro, qual sistema construir, onde perde inteligência, ou pedir diagnóstico, mapa da operação, arquitetura atual/alvo ou Architect.
---

# Arquiteto — da operação ao primeiro sistema

Orquestre capacidades existentes. Não invente outro onboarding, outra régua de fontes ou outro
runtime. O diagnóstico organiza o que foi declarado, aproxima a menor evidência útil, apresenta uma
recomendação como proposta e deixa a pessoa decidir.

## Contrato

- Entregue clareza sem inflar certeza. Mostre sempre o estado V0, V1, V2 ou V3.
- Reutilize `/prototipar`, `/fonte` e `/operar`; não replique esses protocolos.
- Ranqueie no máximo três oportunidades, sem score numérico ou pesos não calibrados.
- Toda oportunidade leva `reason_codes`, explicação e referências.
- Ranking e primeiro sistema são propostas até o responsável confirmar.
- Não leia fonte sem autorização, não copie um acervo inteiro e não prometa conector inexistente.
- Não grave mapa derivado antes de mostrar o rascunho e receber aprovação.
- O arquivo canônico é `architect-spec.json`; o visual é sempre derivado por engine.

## 1. Retomar o que já existe

Leia primeiro, quando existirem:

- `meu-negocio/mapa.md`, `oferta.md`, `icp.md`, `entrega.md` e `o-que-funciona.md`;
- o fio quente em `meu-negocio/fios/`;
- `conexoes/configuradas/fontes.json`, sem abrir as fontes;
- `sistemas/_CATALOGO.md` e `sistemas/outros-instalados/_CATALOGO.md`.

Não faça a pessoa repetir o que o Cérebro já sabe. Se ela invocou esta skill diretamente, prossiga;
`/comecar` é a rota recomendada da primeira experiência, não um pedágio artificial.

## 2. Construir V0 — declarado

Se o protótipo comercial, o protótipo de entrega, a frente e o loop ainda não estiverem claros,
execute `/prototipar`. Se já estiverem, reutilize-os.

V0 precisa mostrar:

- uma operação recorrente em **decisão, venda ou entrega**;
- como o trabalho entra, passa por pessoas/ferramentas e sai;
- onde ainda depende de julgamento humano;
- qual resultado e qual medida importam;
- lacunas escritas como lacunas, nunca completadas por plausibilidade.

Autorrelato é evidência declarada. Identifique-o como `declared:` nas referências.

## 3. Subir para V1 — evidência parcial

Escolha a menor fonte capaz de confrontar o ponto mais importante do V0. Execute `/fonte` para
decidir o nível de refino. Leia apenas depois da autorização.

Uma fonte observada precisa registrar:

- o papel dela naquele trabalho;
- o que ela sustenta e o que não sustenta;
- o estado de acesso e frescor conhecido;
- uma referência relativa ou um identificador local — nunca caminho absoluto no mapa.

Se nenhuma fonte puder ser observada, permaneça em V0. Não transforme relato em verificação.

## 4. Propor oportunidades

Monte no máximo três oportunidades. Para cada uma, declare:

- o resultado que passaria a sair;
- ganho esperado nas palavras/números disponíveis;
- esforço e prontidão sem falsa precisão;
- fontes que já existem e as que faltam;
- julgamento necessário;
- sistema instalado aplicável ou pipeline manual mínimo;
- `reason_codes` curtos em kebab-case e uma explicação legível.

Ordene por prioridade ordinal `1, 2, 3`. Use `ranking.method = human-proposed-v0` e
`ranking.status = proposed`. Não use fórmula secreta, score de 0–100 ou autoridade de benchmark.

## 5. Recomendar o primeiro sistema

Escolha uma oportunidade e escreva um System Brief:

- resultado;
- entrada;
- saída;
- pipeline mínimo;
- gate humano;
- métrica definida antes da execução;
- fontes necessárias;
- sistema instalado, quando existir.

Se nenhum sistema instalado servir, diga isso e entregue o brief. Um brief não é um sistema em
produção. System Packs, laboratórios, releases e instalação assistida podem vir da Society; conexão
customizada, legado, SLA e implantação profunda são trabalho premium. Não limite o diagnóstico
aberto para simular exclusividade.

## 6. Mostrar, corrigir e confirmar

Antes de escrever arquivos, mostre em linguagem simples:

1. a operação como funciona hoje;
2. o que é declarado e o que foi observado;
3. as lacunas;
4. o ranking **proposto**;
5. o primeiro sistema e a métrica;
6. o estado atual da escada.

Pergunte:

> “Esse mapa representa sua operação e essa ordem faz sentido, ou o que você corrigiria antes?”

- Sem confirmação: mantenha V0/V1 e corrija o rascunho.
- Mapa e ranking confirmados/corrigidos: marque V2.
- Recomendação rejeitada: preserve a rejeição e proponha outra; não esconda o desacordo.

## 7. Gravar o spec e gerar o visual

Leia `references/architect-spec.schema.json` antes de montar o objeto. Use
`references/architect-spec.example.json` apenas como exemplo estrutural, nunca como conteúdo.

Depois da aprovação, grave em:

`operacao/arquitetura/<AAAA-MM-DD>-<slug>.architect-spec.json`

Sanitize PII e use papéis/aliases no lugar de nomes de clientes ou pessoas. Valide e renderize:

```bash
node .claude/skills/arquiteto/scripts/render-map.mjs \
  operacao/arquitetura/<arquivo>.architect-spec.json \
  operacao/arquitetura/<arquivo>.excalidraw.md
```

O script bloqueia estado inflado, ranking sem motivo, referência absoluta, PII óbvia e transição
V0→V3 sem prova. Ele transforma o spec num framework spec e usa o engine visual da casa. Nunca
substitua isso por HTML, SVG ou Excalidraw escrito livremente pelo modelo.

## 8. Subir para V3 — resultado validado

Se o sistema recomendado já estiver instalado e a pessoa decidir operar, execute `/operar`.
V3 só existe quando há:

- `run-id`;
- eval passado;
- decisão humana aprovada;
- baseline, resultado observado e delta;
- nova leitura do mapa depois do resultado.

Atualize o mesmo spec, regenere o visual e registre o que mudou. Execução sem delta permanece V2.

## Escada visível

- **V0 · declarado:** o responsável contou como funciona.
- **V1 · evidência parcial:** ao menos uma fonte foi observada.
- **V2 · verificado:** responsável confirmou/corrigiu mapa e ranking.
- **V3 · validado:** sistema rodou e o resultado voltou medido.

Feche com um próximo passo único, proporcional ao estado atual. Diagnóstico mostra a capacidade;
operação, medição e repetição fazem a capacidade acumular.
