# Taxonomia — que arquétipo esse conhecimento pede?

O arquétipo não é escolha estética: é a **pergunta que o leitor faz** à nota. Diagnostique
pela estrutura do conteúdo, nunca pela vontade de variar. Se a nota não cabe em nenhum,
não force — diga isso a quem pediu.

## Princípio narrativo (calibração — vem ANTES da árvore)

**Um conceito = um desenho. Nunca empilhe todas as estruturas numa cena só.**
O primeiro piloto colocou curva + cards + pins + áreas + tensão no mesmo quadro e foi
reprovado: *"poluição visual muito grande... deveria ser algo meio que contando uma
história, não tentar fazer tudo caber na mesma seção"*. Corolário: **explore metáfora
visual** (tornado, precipício+ponte, botão de UI, casinhas de main street) em vez de
resolver tudo com card de texto — *"desenhos igual a onda tá muito bem representada,
analogias"*.

## 0. historia — o DEFAULT pra nota rica (multi-conceito)

- **Quando usar:** a nota carrega uma SEQUÊNCIA DE IDEIAS (um mapa + uma dor + um estado
  atual + um insight...) — mais de uma estrutura. A pergunta do leitor é *"me conta essa
  história do começo ao fim"*.
- **Como funciona:** atos empilhados verticalmente (3 a 5), cada um com número grande,
  título curto, UM visual central e texto mínimo; divisor sutil e respiro generoso entre
  atos. Visuais por ato: `curva-abismo-mini` · `precipicio-ponte` · `vinhetas` (com
  pictogramas: rua, tornado, botão, ponte-mini, onda-mini) · `setas-tensao`.
- **Sinais na nota fonte:** você se pega querendo usar 2+ arquétipos ao mesmo tempo; a
  fonte tem capítulos ("primeiro ele apresentou o modelo, depois o problema, depois...").
- **Exemplo do vault:** [[geoffrey-moore-full]] → `framework-chasm-3-ondas-ia-moore` (o
  piloto): ① o mapa (curva mini) → ② o abismo (precipício+ponte) → ③ as 3 ondas (vinhetas
  com pictogramas) → ④ o insight (setas de tensão + citação dourada).

Os 8 arquétipos abaixo são **single-shot**: uma estrutura só, pra conceito pontual — e
também são o vocabulário visual dos atos (em versão mini).

## Árvore de decisão

```
A nota tem MAIS DE UM conceito/movimento? ─────────────────── historia (acima)
│
O conhecimento (pontual) da nota é...
│
├─ uma SEQUÊNCIA? (as coisas acontecem/se fazem em ordem)
│   ├─ a ordem tem RUPTURA/salto perigoso no meio? ──────────── curva-com-abismo
│   ├─ cada passo REDUZ quem continua (quantidade cai)? ─────── funil
│   ├─ o fim realimenta o começo (loop)? ────────────────────── ciclo
│   └─ ordem simples, sem drama ─────────────────────────────── pipeline
│
├─ uma ESCOLHA? (comparar opções/posições)
│   ├─ decidida por 2 critérios independentes? ──────────────── matriz-2x2
│   └─ dois mundos opostos (antes/depois, com/sem, X vs Y)? ─── contraste
│
└─ uma ESTRUTURA? (as partes de um todo)
    ├─ camadas onde uma SUSTENTA a outra (fundação)? ────────── piramide
    └─ um centro com partes orbitando (definição composta)? ─── anatomia
```

---

## 1. pipeline — etapas em ordem

- **Quando usar:** processo com começo, meio e fim; cada etapa entrega pra próxima; a
  pergunta do leitor é *"o que vem primeiro e o que vem depois?"*.
- **Sinais na nota fonte:** "primeiro... depois... por fim", passos numerados, verbos de
  produção encadeados (capturar → transcrever → destilar → publicar).
- **Exemplo do vault:** [[Pipeline de Destilacao — encontros para o cerebro]] — o caminho
  do encontro gravado até virar destilado no cérebro.

## 2. curva-com-abismo — estágios com ruptura

- **Quando usar:** progressão de estágios onde existe um ponto de morte/salto que a maioria
  não cruza; a pergunta é *"onde cada coisa está nessa jornada — e onde se morre?"*.
- **Sinais na nota fonte:** "a maioria trava aqui", "cruzou / não cruzou", estágios de
  adoção ou maturidade, um vale entre early e mainstream.
- **Exemplo do vault:** o ato ① do piloto `framework-chasm-3-ondas-ia-moore` usa a versão
  mini desta curva (fonte: [[geoffrey-moore-full]]); a versão single-shot serve quando a
  curva É a nota inteira.

## 3. matriz-2x2 — decisão por 2 critérios

- **Quando usar:** opções que se separam por DUAS dimensões independentes (custo × impacto,
  esforço × alavancagem); a pergunta é *"qual quadrante é o meu caso — e o que faço nele?"*.
- **Sinais na nota fonte:** dois adjetivos que se cruzam ("caro mas escala", "rápido porém
  raso"), trade-offs em pares, "depende de X e de Y".
- **Exemplo do vault:** [[2026-06-11-oferta-comunidade-gratuita-vs-paga]] — decisão que
  cruza critérios (acesso × compromisso) e posiciona as opções.

## 4. funil — afunilamento

- **Quando usar:** sequência onde a cada passo MENOS gente/coisa continua, e quem continua
  está mais comprometido; a pergunta é *"onde eu perco gente e o que qualifica quem fica?"*.
- **Sinais na nota fonte:** volumes decrescentes, "de 100 viram 10", topo/meio/fundo,
  captação → conversão.
- **Exemplo do vault:** [[2026-07-08-proposta-funil-front-pago-e-highticket]] — front pago
  afunilando pro high-ticket.

## 5. piramide — camadas de fundação

- **Quando usar:** estrutura onde uma camada SUSTENTA a de cima — sem base, o topo cai; a
  pergunta é *"o que precisa existir antes pra isso de cima parar em pé?"*. No spec,
  `itens[0]` = base.
- **Sinais na nota fonte:** "fundamento", "pré-requisito", "só funciona se antes", níveis de
  maturidade cumulativos.
- **Exemplo do vault:** [[Engenharia de Contexto — Fundamentos e Metodo v1]] — fundamentos
  embaixo, método aplicado em cima.

## 6. ciclo — loop que se retroalimenta

- **Quando usar:** processo cujo resultado vira insumo da próxima volta (flywheel); a
  pergunta é *"o que faz isso girar sozinho e onde o loop trava?"*.
- **Sinais na nota fonte:** "quanto mais... mais...", "realimenta", "vira insumo", motor,
  efeito composto.
- **Exemplo do vault:** [[Motor de cases]] — case gera conteúdo, conteúdo gera membro,
  membro gera case.

## 7. anatomia — conceito central + satélites

- **Quando usar:** UM conceito definido pelas suas partes/propriedades, sem ordem entre
  elas; a pergunta é *"do que isso é feito?"*.
- **Sinais na nota fonte:** "é composto por", listas de componentes sem sequência,
  definição + características.
- **Exemplo do vault:** [[2026-06-29-arquitetura-cerebro-inevita]] — o cérebro no centro, as zonas e
  costuras em volta. (Também serve pra abrir um conceito-âncora como [[Contexto]].)

## 8. contraste — antes/depois, 2 colunas

- **Quando usar:** dois mundos lado a lado — velho vs novo, com vs sem, dor vs ganho; a
  pergunta é *"o que exatamente muda?"*.
- **Sinais na nota fonte:** "antes a gente... agora...", "X tradicional vs X novo", pares
  espelhados de dor/solução.
- **Exemplo do vault:** [[Wedge — contexto humano vs contexto de maquina]] — os dois lados
  do wedge em colunas espelhadas.

---

## Desempate rápido

- pipeline × funil: o volume cai a cada passo? → funil.
- pipeline × ciclo: o último passo alimenta o primeiro? → ciclo.
- matriz × contraste: são 2 critérios contínuos (eixos)? → matriz. São 2 mundos fechados? → contraste.
- piramide × anatomia: as partes têm hierarquia de dependência? → piramide. São pares? → anatomia.
- Nota grande com vários conhecimentos → `historia` (atos em sequência), NUNCA tudo
  empilhado numa cena. Se nem como história couber (muitos atos, 6+), proponha 2 canvases
  e pergunte qual fazer primeiro.
