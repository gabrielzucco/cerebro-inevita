# Design system — frameworks visuais (dark + clean)

Calibrado no piloto (chasm/3 ondas, jul/2026). **Design travado — não reabrir sem
recalibrar.** O engine (`gerar_excalidraw.py`) já impõe quase tudo isso em código — este arquivo
existe pra quem escreve o SPEC saber o que cada escolha significa.

## Base visual (travada)

- **Fundo preto** `#0f0f12` (`viewBackgroundColor`). Nunca branco, nunca grid.
- **Traço clean**: `roughness: 0` (architect) + `fontFamily: 2` (Helvetica).
  O estilo "à mão" (`estilo: handwritten`) foi testado e **REPROVADO** na calibração de
  10/07 ("acho que ficou pior handwritten") — a opção existe no engine, mas só entra se o
  humano pedir explicitamente.
- Cantos arredondados nos cards (`roundness: 3`), borda 1.5px na cor de acento.

## Princípio narrativo — história em atos (calibração 10/07)

**Um conceito = um desenho.** Canvas que empilha várias estruturas na mesma cena =
poluição visual (reprovado no piloto v3). Nota rica → arquétipo `historia`:

- **Atos empilhados verticalmente**, lidos em sequência: número grande em círculo (①②③④),
  título curto (21px), texto mínimo (14px, `#909296`, 1-2 linhas) e **UM visual central**.
- **Divisor sutil** entre atos: linha fina `#2a2d31`, largura total.
- **Respiro generoso**: 80–100px entre atos (o engine usa 46px + divisor + 46px).
- 3 a 5 atos. O clímax (citação dourada) fecha a história, depois só o rodapé.

## Pictogramas — metáfora visual > card de texto

Feedback verbatim: *"explorar mais partes visuais igual trouxe ali tornado,
abismo, botão pergunte-me qualquer coisa... desenhos igual a onda tá muito bem
representada, analogias"*. Quando a fonte dá a imagem, desenhe a imagem. Biblioteca do
engine (todos parametrizados em posição/escala/cor, shapes puros):

| Pictograma | Desenho | Metáfora |
|---|---|---|
| `tornado` | elipses achatadas empilhadas afunilando + linhas de vento | hype/turbilhão, fase de crescimento caótico |
| `botao` | retângulo arredondado com sombra offset + label | produto virou "um botão" — UI, simplicidade |
| `botao-tornado` | os dois combinados | o botão dentro do turbilhão (generativa hoje) |
| `precipicio-ponte` | dois penhascos + vão vermelho + ponte tracejada + bandeirinha | CROSSING the chasm — a travessia |
| `ponte-mini` | precipício compacto, aceita `tag` (ex. `</>`) | idem, em vinheta |
| `rua` | casinhas + linha de chão | main street — absorvido no cotidiano |
| `onda-mini` | gaussiana pequena (aceita `rasgo: true`) | a curva de adoção em miniatura |
| `setas-tensao` | seta longa vs seta curta | descompasso entre duas velocidades |

Regra: **melhor um desenho simples e legível que um complexo torto.** Pictograma novo só
entra no engine (função `pict_*` parametrizada), nunca desenhado ad-hoc num spec.

## Leitor de primeira viagem (calibração 10/07 — o teste nº 1 da skill)

Motivação, verbatim: *"temos que considerar que quem esta vendo nao tem
conhecimento previo sobre o que foi dito nas notas e esta vendo tudo pela primeira vez,
preciso q vc aprimore fins didaticos nessa skill"*.

O canvas funciona **sozinho** — pra quem nunca leu a nota, nunca ouviu falar do assunto
nem do autor. Os slots didáticos do engine existem pra isso, e cada bloco de conteúdo
segue a mesma **hierarquia didática**:

1. **O QUE É** → `definicao` (itens/vinhetas, prefixo "= ", cor de acento) e `explicacao`
   (zonas/segmentos da curva, linha simples embaixo do jargão). Todo termo técnico ganha
   a sua na PRIMEIRA aparição.
2. **ONDE ESTÁ / COMO FUNCIONA** → `texto`/`corpo` (o status, o movimento, o exemplo).
3. **E DAÍ** → `takeaway` global ("E AGORA? →", card azul, 1-3 bullets acionáveis,
   SEMPRE ancorados no que a fonte recomendou — nunca conselho inventado pela IA).

No cabeçalho, a mesma lógica: `titulo` (o assunto) → `subtitulo` com **credencial de 1
linha** (quem fala e por que ouvir) → `gancho` em 2ª pessoa com barra dourada (por que
VOCÊ deveria se importar) → `como_ler` (como decodificar o desenho).

Fluxo emocional do fechamento: **clímax** (citação dourada) → **ação** (takeaway azul) →
rodapé de provenância.

## Linguagem — escreve como se fala (calibração 10/07)

Feedback verbatim: *"ainda acho que a linguagem ta muito complexa"*. O canvas é
pra founder ler em 30 segundos, não pra consultor apresentar:

- **Frase curta, palavra do dia a dia.** "Ruptura" → "buraco" · "absorvida" → "tá em tudo"
  · "descompasso" → "o problema tá aqui" · "adquire confiança" → "só compra vendo prova".
- **Teste da voz alta**: se você não falaria a frase num áudio de WhatsApp, reescreva.
- Jargão canônico do framework (Visionários, TORNADO, MAIN STREET) pode ficar — ele é o
  conteúdo — mas o texto em volta explica em palavra simples.
- Citação do banner = verbatim (traduzido). Fala de fonte não se simplifica nem se melhora.

## Paleta dark semântica

A cor **carrega significado** — usar a cor errada é errar o conteúdo, não o estilo.

| Nome no spec | Acento (borda) | Fundo card | Texto card | Significa |
|---|---|---|---|---|
| `laranja` | `#ffa94d` | `#2b2113` | `#ffd8a8` | fronteira, risco, o novo que ainda não se provou |
| `azul` | `#4dabf7` | `#12212e` | `#a5d8ff` | em movimento, o agora, onde a ação está |
| `cinza` | `#adb5bd` | `#1c1f23` | `#ced4da` | consolidado, contexto, o que já foi absorvido |
| `vermelho` | `#ff6b6b` | `#2b1414` | `#ffc9c9` | dor, perigo, o abismo, onde se morre |
| `dourado` | `#ffd43b` | `#2a2510` | `#ffec99` | frase de impacto, o ouro da fonte |

Neutros: texto primário `#f1f3f5` · secundário `#909296` · curva/traço `#ced4da` ·
linha de base/eixos `#495057` · linha "Como ler:" `#748ffc`.

Regra de uso: **dourado só pra impacto** (banner de citação, no máx. 1 card-clímax).
Vermelho só onde há dor/ruptura real na fonte. O resto do canvas vive de laranja/azul/cinza.

## Tipografia (3 níveis, nada além)

| Nível | Tamanho | Cor | Uso |
|---|---|---|---|
| Título do canvas | 32 | `#f1f3f5` | caixa alta, curto (1 linha) |
| Seção / título de card | 16–18 | acento ou texto do card | títulos de card (17), zonas (15), citação (18) |
| Corpo / apoio | 13–14 | texto do card / `#909296` | corpo de card (14), labels, rodapé, atribuição (13) |

Não inventar tamanhos novos: 3 níveis é o que mantém o canvas lido em 10 segundos.

## Chunking — máx. 5–9 blocos por canvas

Um canvas = **uma ideia**. Entre 5 e 9 blocos de conteúdo (cards/camadas/quadrantes) — menos
que isso talvez nem precise de diagrama; mais que isso ninguém lê (limite de memória de
trabalho). Em `historia`, o chunking vale POR ATO (1 visual + até ~4 elementos de conteúdo);
nota densa → `historia` com 3-5 atos, e se nem assim couber, 2 canvases separados.

**Cards completos**: cada card conta a própria parte da história sozinho (título forte +
corpo de 1–3 frases). Quem lê só os cards entende o framework sem legenda externa.
**Sem minutagem dentro dos cards** — polui (decisão). Corpo de card: mira ~200
caracteres, teto ~280; passou disso, o card virou parágrafo — corte.

## Fluxo de leitura (a ordem em que o olho anda)

1. **Título** (topo esquerdo) → 2. **subtítulo** (quem disse + credencial) → 3. **gancho**
   (barra dourada, 2ª pessoa) → 4. **"Como ler:"** → 5. o **conteúdo** (em `historia`:
   ato ① → ② → ③ → ④; nos single-shot: o desenho e os cards) → 6. **banner dourado**
   (clímax) → 7. **takeaway azul** (ação) → 8. **rodapé de provenância**.
- Layout respeita leitura ocidental: esquerda→direita, cima→baixo. Em `ciclo`, começa no
  topo e gira em sentido horário. Em `piramide`, a base (fundação) fica embaixo.
- Setas sempre indicam direção de leitura/causa — nunca decoração.

## Linha "Como ler:" (obrigatória em canvas com desenho não-trivial)

Uma linha, cor `#748ffc`, logo abaixo do subtítulo, que ensina a decodificar o canvas:
`Como ler:  a curva = ordem em que o mercado adota · faixa vermelha = o abismo · cada card = onde a onda está hoje`
É o que transforma desenho em ferramenta didática — sem ela o leitor decifra em vez de ler.

## Banner de citação (o ouro da fonte)

- Retângulo dourado full-width, após o conteúdo: a frase de impacto **literal** da fonte
  (tamanho 18) + linha de atribuição (13, `#909296`):
  `— Fulano (tradução livre)   ·   [arquivo @ MM:SS]`
- **Minutagem obrigatória** (`citacao.ref`) — citação direta nunca sai sem `[arquivo @ MM:SS]`
  (regra de provenância do vault; o engine recusa sem isso).
- Fonte em inglês → tradução livre pra pt-BR, marcando "(tradução livre)" no autor.
- Máximo 1 banner por canvas. Sem frase de impacto real na fonte → sem banner (não fabrique).

## Rodapé de provenância (obrigatório)

Última linha do canvas, tamanho 13, `#909296`:
`Vista derivada (proposta IA — validar) · Fonte: <evento/contexto humano> · transcrição: [[nota-fonte]]`
Deixa explícito no próprio canvas: isto é vista derivada, proposta por IA, com fonte humana
rastreável. É o par visual do `origem:` do frontmatter.

## Anti-sobreposição (por que existe engine em vez de desenhar na mão)

- O engine **reserva espaço**: mede cada texto (largura estimada `0.52 × fontSize` por
  char), quebra linhas pra caber no card, calcula a altura do card a partir das linhas, e
  posiciona com margens generosas.
- No final rodam **dois checks de colisão** e qualquer par falha o build (exit 2):
  **texto×texto** (bounding boxes sobrepostos) e **linha×texto** (linha/seta cruzando
  texto — calibração 10/07: *"mais cuidado pra não ter linhas cruzando textos"*). Exceção
  única: texto que é parte do pictograma (label do botão, tag da ponte, número de pin),
  marcado em código com `_sobre_shape` — nunca whitelist por conteúdo. Colisão é bug,
  não detalhe: o conserto é no layout/pictograma, nunca relaxando o check.
- Por isso: **nunca ajustar o `.excalidraw.md` na mão** pra "caber". Encurte o corpo no
  spec ou tire blocos, e gere de novo. (Ajuste fino visual DEPOIS, no Obsidian, pelo
  humano, é ok — o arquivo é dele.)
