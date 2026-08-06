---
tipo: metodo
tema: tratamento-de-fontes
versao: 1.0
publicado: 2026-08-06
---

# O QUE FAZER COM O QUE CHEGA

*A régua de tratamento de fontes. Responde de uma vez: quando eu trato, quanto eu trato, e o que fica só como está.*

---

## A pergunta que todo mundo faz

Ela chega em três versões, e é sempre a mesma:

- *"Quando eu tenho que tratar uma informação e quando guardo só o bruto?"*
- *"Tudo tem que virar Markdown?"*
- *"Como eu faço com e-mail, PDF, planilha, print, áudio — cada um é diferente?"*

A resposta curta é uma frase:

> **Não se padroniza o formato de entrada. Padroniza-se o caminho que a informação percorre — e você para no nível de refino que o trabalho exige.**

O resto deste documento é essa frase destrinchada.

---

## A regra: refine só até onde o trabalho pede

Refinar custa. Custa token, custa atenção tua, e custa **precisão** — porque contexto demais afoga o contexto certo. O palco tem número pra isso: um time enterprise curou a base de **7.000 para 1.000 blocos** e a precisão de contexto subiu de 57% para 82% — *"one-seventh the context size, a lot higher precision, and a lot less money burned on tokens"* `[AI Engineer World's Fair, palestras-expo-3 @ 05:27]`.

E o custo de não curar: com **30% de arquivos velhos ou duplicados, até 80% do contexto** que o agente usa pra responder vira lixo `[workshops-expo-2 @ 13:24]`. Limpar o corpus **dobra o recall**.

Por isso a regra não é "guarde tudo bem organizado". É:

> **Subir de nível sem um trabalho que justifique é desperdício.** Não é organização — é apodrecimento pago em token.

---

## Os 4 níveis (+ o nível 0)

| Nível | O que é | Custo | Pare aqui quando |
|---|---|---|---|
| **0 · Ponteiro** | O cérebro registra **onde** está. Não copia, não converte, não move. | ~zero | Ainda não tem trabalho recorrente saindo dali |
| **1 · Legível** | Vira texto (transcrição, OCR, export) — continua bruto, mas a máquina consegue ler | barato | Você vai precisar buscar dentro, mas não citar |
| **2 · Indexado** | Ganha etiqueta: o que é, de onde veio, quando aconteceu, o que dá pra extrair | barato | Você precisa **achar** sem ler tudo |
| **3 · Destilado** | Vira átomo: afirmação + citação literal + sentido + elos | caro (atenção tua) | Isso muda decisão e vai ser **citado** |
| **4 · Operacional** | Vira régua, decisão ou procedimento | mais caro | Isso muda o **próximo trabalho**, não só este |

**A maioria das fontes morre no nível 0 ou 1 — e está certo.** Parar cedo não é preguiça: é o que mantém o cérebro afiado. Um cérebro que trata tudo vira um Drive bagunçado com nome bonito.

---

## Como decidir: uma pergunta só

Antes de tratar qualquer coisa, responda:

> **Que trabalho real vai sair disso?**

- **Não sei ainda** → nível 0. Registra onde está e segue a vida.
- **Vou querer procurar coisas aqui dentro** → nível 1 ou 2.
- **Isso vai ser citado numa decisão** → nível 3.
- **Isso muda como a próxima entrega é feita** → nível 4.

Repare que a pergunta **não** é "isso é importante?". Quase tudo parece importante. A pergunta é sobre trabalho — porque contexto que não vira trabalho é custo, não patrimônio.

---

## O caminho é sempre o mesmo (5 etapas)

Não importa o formato. Toda fonte percorre:

```
capturar → etiquetar → extrair → aprovar → devolver ao trabalho
```

1. **Capturar** — de preferência automático (rotina, conector). O original **não se destrói**.
2. **Etiquetar** — o que é, de onde veio, quando aconteceu, onde está o original.
3. **Extrair** — só o que aquele tipo de fonte tem de valioso (varia por formato, ver tabela abaixo).
4. **Aprovar** — humano no gate. Sem aprovação, não vira memória.
5. **Devolver** — o destilado volta no momento do trabalho, não fica bonito numa pasta.

*"A variedade está na entrada. A consistência está no método."*

---

## Por formato: o que se extrai de cada um

| Formato | Entra como | Nível típico | O que se extrai |
|---|---|---|---|
| **Reunião / call** | áudio → transcrição | 3–4 | decisões, donos, prazos, objeções, números — e o minuto que sustenta cada uma |
| **E-mail** | thread | 1–2 (3 se for negociação) | sequência da conversa, promessas feitas, objeções, o que ficou pendente |
| **Proposta / contrato** | PDF | 0–2 | cláusulas, valores, prazos, condições — o PDF continua PDF |
| **Planilha / CRM** | export ou conexão | 0–1 no cérebro | **fica em banco**, não em nota. O cérebro guarda o padrão que você leu nos números, não os números |
| **Drive / acervo de mídia** | ponteiro | 0 (+2 no índice) | catálogo do que existe e onde está. Nunca copie o drive pra dentro |
| **Grupo de WhatsApp** | export diário | 1–2 | decisões tomadas no meio da conversa, dores relatadas, combinados |
| **Print / imagem** | descrição | 0–1 | o que a imagem prova. A maioria morre na triagem semanal |
| **Site / concorrente** | link + trecho | 0–2 | a mudança observada, com data. Link sozinho apodrece |

> **Planilha e CRM merecem atenção:** número tem casa própria. Banco de dados é bom pra contar, filtrar e apagar; o cérebro é bom pra entender, cruzar e decidir. Se os dois precisam se encontrar, cruze por um ID opaco — nunca por nome de pessoa.

---

## Três coisas que nunca mudam

1. **O bruto nunca morre e nunca se converte à força.** A reunião continua reunião, o contrato continua PDF, o e-mail continua e-mail. O cérebro registra **onde está** e o que dá pra tirar dali. Ele só não é o que a IA lê por padrão — o agente lê o índice e os átomos, e abre o bruto só em drill-down.
2. **Markdown é o destilado, não o mundo.** Texto simples é o formato porque *"agents are fluent in it"* `[Notion @ 17:33]` e humano também lê. Mas isso vale pro que você destilou — não é convite pra converter 800 arquivos.
3. **PII nunca entra na nota.** Nome de cliente, e-mail, telefone, CPF/CNPJ: sanitiza antes de gravar, ou fica em `privado/`.

---

## Os quatro erros clássicos

| Erro | Por que dói | O certo |
|---|---|---|
| Tratar tudo que entra | Vira Drive bagunçado; a IA afoga | Trate o que tem trabalho saindo |
| Copiar o Drive/Notion inteiro pra dentro | Duplica o que já existe e apodrece em paralelo | Conecta e aponta (nível 0) |
| Guardar link sem trecho | Em 3 meses ninguém lembra por que salvou | Trecho literal + data + por quê |
| Deixar tudo em bruto "pra tratar depois" | O bruto sem etiqueta é invisível pro agente | Etiqueta na entrada custa 10 segundos |

---

## O teste de que está funcionando

Você não mede isso por volume de notas. Mede por **resposta**: quando você pergunta algo do teu negócio, o cérebro responde com **citação e origem** — e a resposta melhora mês a mês. É o que o `/teste` mede.

> *"The job of memory is to ground your model in knowledge that is current, large and citable."* `[palestras-expo-3 @ 06:40]`

Current (fresco), large (abrangente), **citable** (com origem). Se a resposta não pode apontar de onde veio, não é memória — é chute com sotaque.

---

**Quando a dúvida voltar:** a resposta não é "onde eu guardo isso?". É **"que trabalho vai sair disso?"** — e o nível certo cai da pergunta.

**O executável desta régua é a skill `/fonte`** — aponte qualquer coisa pra ela ("o que eu faço com isso?", "ingere o que tá em capturas/") e ela recomenda o nível, executa até ele e para.
