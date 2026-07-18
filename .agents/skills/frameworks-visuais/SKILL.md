---
name: frameworks-visuais
description: Transforma qualquer nota do teu cérebro num framework visual (Excalidraw, dark e clean) — uma vista que ESTRUTURA o que a nota diz, nunca inventa. Nota rica vira uma HISTÓRIA em atos com pictogramas; conceito pontual usa arquétipos prontos (pipeline, curva-com-abismo, matriz 2x2, funil, pirâmide, ciclo, anatomia, contraste). Use quando a pessoa pedir "gera um framework visual", "vira isso num mapa", diagrama, canvas, ou "desenha esse conceito".
---

# Frameworks visuais → Excalidraw a partir das tuas notas

O diagrama é uma **vista derivada** da nota: ele **estrutura** o que ela já diz, **nunca inventa**
(regra "zero conteúdo inventado" do `CLAUDE.md`). Todo texto do canvas tem que ser rastreável à
fonte — citação literal ou paráfrase que só reorganiza. O `.excalidraw.md` é uma nota como
qualquer outra, com frontmatter e `origem`.

> **Requisito:** precisa do **plugin Excalidraw** no Obsidian pra ver o canvas (Community plugins →
> Excalidraw). E do `python3` (já vem no sistema; nada pra instalar).

## Passo 1 — ler a fonte
Leia a nota fonte INTEIRA (com o frontmatter). O diagrama nasce **ao lado dela**, com o nome
`framework-<slug>.excalidraw.md` (kebab-case, prefixo `framework-`).
- **PII fora:** se a nota tiver e-mail/telefone/nome de cliente, não leve pro canvas (a regra de PII
  do cérebro vale aqui também).
- Citação em inglês → **tradução livre pra pt-BR**, marcando "(tradução livre)" no autor.

## Passo 2 — escolher o formato
**A nota é rica (mais de um conceito/movimento)?** Se sim, o padrão é `historia` — o canvas vira
ATOS empilhados (número grande, título curto, UM visual central, texto mínimo), lidos em sequência
como narrativa. **Nunca empilhe tudo numa cena só** — polui. E prefira **metáfora visual** a card de
texto: o engine tem pictogramas (tornado, precipício+ponte, botão, casinhas, onda) — use quando a
fonte der a imagem.

Pra um conceito pontual (uma estrutura só), abra `taxonomia.md` e escolha:
`pipeline · curva-com-abismo · matriz-2x2 · funil · piramide · ciclo · anatomia · contraste`.
Escolha o que responde à pergunta que o leitor faz ("em que ordem?" ≠ "o que escolher?"). Na
dúvida, pergunte à pessoa.

## Passo 3 — escrever o SPEC JSON
Escreva o spec num arquivo temporário (ex.: `/tmp/spec-<slug>.json`). Schema completo + exemplo de
cada arquétipo: docstring do `gerar_excalidraw.py`. O spec carrega:
- `titulo` (caixa alta, curto) · `subtitulo` (quem disse + **credencial de 1 linha**) · `gancho`
  (1-2 linhas em **2ª pessoa**: por que VOCÊ deveria se importar) · `como_ler` (1 linha)
- `historia` → `atos`: cada um com `titulo`, `texto` (1-2 linhas, opcional), `cor` e UM `visual`
  (curva-abismo-mini · precipicio-ponte · vinhetas · setas-tensao). 3 a 5 atos.
- Single-shot → `itens`: cards completos, cada um conta a própria parte sem legenda. Máx. 5–9.
- `cor` semântica: laranja = novo/risco · azul = agora/movimento · cinza = contexto · vermelho =
  dor/perigo · dourado = impacto.
- `definicao` (nos cards) — a linha "o que É isso" na PRIMEIRA aparição de cada termo/sigla.
- `citacao` — a frase de impacto da fonte, com `ref` (obrigatório se houver citação direta).
- `takeaway` — "E AGORA? →" com 1-3 ações **ancoradas na fonte** (nunca invente ação).
- `frontmatter` — `fonte`, `criado`, `origem: "[[nota-fonte]]"`.

**⚠️ Linguagem simples:** todo texto se escreve **como se fala** — frase curta, palavra do dia a
dia, zero jargão. Teste: você leria isso em voz alta pra um amigo? Jargão só quando ele É o conteúdo
(nome canônico do framework) — e o texto ao redor explica em palavra simples.

### Checklist "primeira viagem" (antes de gerar)
O canvas tem que funcionar SOZINHO pra quem nunca leu a nota nem ouviu falar do assunto:
1. Cada termo/sigla tem **definição de 1 linha** na primeira aparição?
2. Título + gancho dizem o assunto e o porquê em palavras simples?
3. Quem é citado tem **credencial de 1 linha** no subtítulo?
4. Fecha com **"e daí?" acionável** (`takeaway`)?
5. Leia fingindo que nunca ouviu falar — travou numa palavra? Define ou corta.

## Passo 4 — gerar e validar
```
python3 .claude/skills/frameworks-visuais/gerar_excalidraw.py /tmp/spec-<slug>.json <destino>.excalidraw.md
```
O engine valida sozinho: JSON de volta + **zero colisão** de texto. Só siga com a linha
`✓ ... colisões texto×texto: 0 · linha×texto: 0`. Se colidir, encurte corpos/reduza blocos no
spec — nunca edite o `.md` na mão.

**⚠️ Se for REGERAR um canvas que pode estar aberto no Obsidian:** peça pra fechar a aba antes — o
plugin corrompe o arquivo se estiver aberto.

## Passo 5 — costurar na nota fonte
No fim da nota fonte, adicione (só isso; nunca reescreva o conteúdo dela):
```md
## Vista visual

![[framework-<slug>.excalidraw]]
```

## Passo 6 — mostrar e confirmar
É uma **proposta** — mostre pra pessoa validar no Obsidian antes de dar por pronto. Diga o arquivo
criado, o arquétipo e o resultado da validação.

## Regras
- **Nunca inventar:** se a fonte não diz, o canvas não mostra. Lacuna vira pergunta, não invenção.
- **Citação direta sempre com a origem** no banner — e nunca minutagem dentro de card.
- **Design travado** (dark `#0f0f12`, clean, paleta semântica) — detalhes em `design-system.md`.
- Dúvida de arquétipo ou de conteúdo → pergunta, não chuta.
