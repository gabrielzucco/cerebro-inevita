#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
gerar_excalidraw.py — engine dos frameworks visuais didáticos do vault (skill frameworks-visuais).

Uso:
    python3 gerar_excalidraw.py spec.json [saida.excalidraw.md]

Entrada: SPEC JSON (semântica pura — layout é responsabilidade deste engine).
Saída:   .excalidraw.md válido pro plugin Obsidian Excalidraw (formato do piloto validado):
         frontmatter YAML + aviso + "# Text Elements" (^id8) + "# Drawing" (```json) + "%%".
Stdlib apenas. Ao final valida: JSON parseável de volta + zero colisão de bounding
boxes entre elementos de texto (exit code 2 se colidir).

──────────────────────────────────────────────────────────────────────────────
SCHEMA DO SPEC — campos comuns a todos os arquétipos
──────────────────────────────────────────────────────────────────────────────
{
  "arquetipo":  "historia | pipeline | curva-com-abismo | matriz-2x2 | funil |
                 piramide | ciclo | anatomia | contraste",
  "titulo":     "TÍTULO DO CANVAS (caixa alta, curto)",
  "subtitulo":  "quem disse + CREDENCIAL de 1 linha ('autor de X') / contexto",  // opcional
  "gancho":     "1-2 linhas em 2ª PESSOA: por que VOCÊ deveria se importar",     // opcional
                // (recomendado) — renderiza destacado com barra dourada, abaixo do subtítulo
  "como_ler":   "a curva = X · faixa = Y · card = Z",               // opcional (recomendado)
  "itens":      [ { "titulo": "...",
                    "definicao": "o que É isso, em 1 linha simples",  // opcional; vira linha
                    // "= ..." na cor de acento ENTRE título e corpo — leitor de 1ª viagem
                    // lê O QUE É antes do status. Também aceito nas vinhetas da historia.
                    "corpo": "...",
                    "cor": "laranja|azul|cinza|vermelho|dourado",
                    "link": "[[nota]]" } ],                          // shape varia (ver abaixo)
  "citacao":    { "texto": "\"frase de impacto\"",
                  "autor": "Fulano (tradução livre)",
                  "ref": "arquivo @ MM:SS" },                        // opcional; "ref" OBRIGATÓRIO se houver
  "takeaway":   { "titulo": "E AGORA? →",                            // opcional (recomendado)
                  "bullets": ["1-3 ações ANCORADAS na fonte"] },     // card azul após a citação;
                // ⚠️ regra de processo: bullet sem base na fala/nota fonte é PROIBIDO (zero-IA)
  "proveniencia": "Vista derivada (proposta IA — validar) · Fonte: ... · transcrição: [[nota-fonte]]",
  "frontmatter": { "fonte": "aula-externa", "tema": "aquisicao",
                   "pode-ir-comunidade": false, "criado": "AAAA-MM-DD",
                   "origem": "[[nota-fonte]]" },
  "largura":    1570,                                                // opcional
  "estilo":     "clean | handwritten"  // opcional; DEFAULT E PADRÃO DA CASA: clean.
                                       // handwritten foi REPROVADO na calibração (10/07) —
                                       // só usar se o humano pedir explicitamente.
}

Semântica das cores (paleta dark calibrada — design-system.md):
  laranja = fronteira/risco/novo · azul = em movimento/agora · cinza = consolidado/
  contexto · vermelho = dor/perigo/abismo · dourado = frase de impacto/ouro

Regras que o engine IMPÕE (calibradas — não relaxar):
  · minutagem "@ MM:SS" DENTRO de card/item → ERRO (minutagem só no banner de
    citação e no rodapé de provenância)
  · "citacao" sem "ref" → ERRO (citação direta nunca sai sem minutagem)
  · "proveniencia" ausente → ERRO (todo canvas carrega o rodapé de provenância)
  · fundo preto #0f0f12 · default clean (roughness 0, Helvetica); "estilo":
    "handwritten" no spec troca pra traço à mão (roughness 1, Virgil) — por canvas
  · texto quebrado por largura estimada (CHARW=0.52·fontSize) — sem overflow
  · check de colisão texto×texto ao final

PRINCÍPIO NARRATIVO (calibração): um conceito = UM desenho. Nunca
empilhe todas as estruturas numa cena só. Nota rica/multi-conceito → arquétipo
"historia": atos empilhados verticalmente, lidos em sequência, cada um com número
grande, título curto, UM visual central e texto mínimo. Os demais arquétipos são
single-shot, pra conceito pontual.

PRINCÍPIO DO LEITOR DE PRIMEIRA VIAGEM (calibração — teste nº 1 da
skill): "quem está vendo não tem conhecimento prévio sobre o que foi dito nas notas
e está vendo tudo pela primeira vez". O canvas funciona SOZINHO pra quem nunca leu
a nota nem ouviu falar do assunto/autor. Slots didáticos: "gancho" (por que me
importar, 2ª pessoa) · "definicao"/"explicacao" (o que É, na 1ª aparição de cada
termo) · credencial no subtítulo (quem é e por que ouvir) · "takeaway" (e daí — o
que fazer, ancorado na fonte). Hierarquia por bloco: O QUE É → COMO ESTÁ → E DAÍ.

──────────────────────────────────────────────────────────────────────────────
SHAPES POR ARQUÉTIPO — exemplo mínimo de cada um
──────────────────────────────────────────────────────────────────────────────
historia — DEFAULT pra nota rica: atos em sequência com divisor sutil entre eles.
Cada ato: titulo, cor (opcional, pinta o número), texto (opcional, 1-2 linhas) e
UM "visual" da biblioteca: curva-abismo-mini · precipicio-ponte · vinhetas ·
setas-tensao. Pictogramas disponíveis dentro de "vinhetas": rua (casinhas),
tornado (funil espiral), botao (botão de UI), botao-tornado (combo), ponte-mini
(precipício compacto, aceita "tag" ex. "</>"), onda-mini (gaussiana pequena,
aceita "rasgo": true):
  { "arquetipo": "historia", "titulo": "T",
    "atos": [
      { "titulo": "O mapa — como o mercado adota", "texto": "1-2 linhas de contexto",
        "visual": {"tipo": "curva-abismo-mini",
                   "abismo": {"pos": 0.281}, "rotulo_abismo": "o abismo",
                   "segmentos": [{"nome": "Inovadores", "pos": 0.066}, "Visionários"],
                   "zonas": [{"nome": "◄ TORNADO ►", "cor": "azul", "pos": 0.42}]} },
      { "titulo": "O abismo — por que se morre aqui", "cor": "vermelho", "texto": "...",
        "visual": {"tipo": "precipicio-ponte",
                   "rotulo_esq": "VISIONÁRIOS compram promessa",
                   "rotulo_dir": "MAIORIA PRAGMÁTICA compra confiança",
                   "legenda_ponte": "a travessia"} },
      { "titulo": "As ondas hoje",
        "visual": {"tipo": "vinhetas", "itens": [
            {"titulo": "IA PREDITIVA", "cor": "cinza", "texto": "...",
             "pict": {"tipo": "rua"}},
            {"titulo": "IA GENERATIVA", "cor": "azul", "texto": "...",
             "pict": {"tipo": "botao-tornado", "label": "pergunte-me qualquer coisa"}},
            {"titulo": "IA AGÊNTICA", "cor": "laranja", "texto": "...",
             "pict": {"tipo": "ponte-mini", "tag": "</>"}} ]} },
      { "titulo": "O insight", "cor": "dourado",
        "visual": {"tipo": "setas-tensao", "maior": "velocidade da INOVAÇÃO",
                   "menor": "velocidade da ADOÇÃO", "nota": "← o descompasso"} } ] }

pipeline — etapas em ordem, setas entre elas; numeração automática ("numerar": false desliga):
  { "arquetipo": "pipeline", "titulo": "T",
    "itens": [ {"titulo": "Capturar", "corpo": "...", "cor": "azul"},
               {"titulo": "Destilar", "corpo": "...", "cor": "laranja"} ] }

curva-com-abismo — estágios de adoção com ruptura; "alvo" = onde a seta do card
aponta na curva (fração 0..1 do eixo x, ou "pico", ou "abismo"). Didática extra:
pin numerado no ponto da curva (número extraído do título do item, ex. "3ª onda" → ③);
áreas sob a curva pintadas (auto: MERCADO INICIAL/PRINCIPAL quando há abismo);
baseline vira eixo com seta ("eixo_x"); "tensao" desenha o descompasso (seta longa
vs curta) como visual — restatement da citação:
  { "arquetipo": "curva-com-abismo", "titulo": "T",
    "itens": [ {"titulo": "3ª onda · X", "corpo": "...", "cor": "laranja", "alvo": "abismo"} ],
    "abismo":    {"titulo": "O ABISMO", "corpo": "por que se morre aqui", "pos": 0.281},
    "segmentos": [ {"nome": "Inovadores", "pos": 0.066,
                    "explicacao": "1 linha simples (opcional, parcimônia)"}, "Visionários" ],
    "zonas":     [ {"nome": "◄ TORNADO ►", "cor": "azul", "pos": 0.42,
                    "explicacao": "todo mundo quer ao mesmo tempo"} ],  // opcional; jargão SEMPRE com explicacao
    "eixo_x":    "tempo / maturidade do mercado →",                        // opcional
    "areas":     [ {"de": 0, "ate": "abismo", "nome": "MERCADO INICIAL", "cor": "laranja"} ], // opcional (auto c/ abismo)
    "tensao":    { "maior": "velocidade da INOVAÇÃO", "menor": "velocidade da ADOÇÃO",
                   "nota": "← o descompasso" } }                           // opcional

matriz-2x2 — decisão por 2 critérios; "quadrante" obrigatório nos 4 itens:
  { "arquetipo": "matriz-2x2", "titulo": "T",
    "eixo_x": {"rotulo": "custo →   (esquerda = baixo · direita = alto)"},
    "eixo_y": {"rotulo": "↑ impacto   (cima = alto · baixo = baixo)"},
    "itens": [ {"quadrante": "cima-esquerda",  "titulo": "Quick win", "corpo": "...", "cor": "dourado"},
               {"quadrante": "cima-direita",   "titulo": "...", "corpo": "...", "cor": "azul"},
               {"quadrante": "baixo-esquerda", "titulo": "...", "corpo": "...", "cor": "cinza"},
               {"quadrante": "baixo-direita",  "titulo": "...", "corpo": "...", "cor": "vermelho"} ] }

funil — afunilamento; itens em ordem do topo (largo) pro fundo (estreito):
  { "arquetipo": "funil", "titulo": "T",
    "itens": [ {"titulo": "Topo — atenção", "corpo": "...", "cor": "cinza"},
               {"titulo": "Fundo — venda",  "corpo": "...", "cor": "dourado"} ] }

piramide — camadas de fundação; itens[0] = BASE (o que sustenta), último = topo:
  { "arquetipo": "piramide", "titulo": "T",
    "itens": [ {"titulo": "Base", "corpo": "o que sustenta tudo", "cor": "cinza"},
               {"titulo": "Topo", "corpo": "...", "cor": "dourado"} ] }

ciclo — loop que se retroalimenta; sentido horário a partir do topo; "centro" opcional:
  { "arquetipo": "ciclo", "titulo": "T",
    "centro": {"titulo": "MOTOR", "cor": "dourado"},
    "itens": [ {"titulo": "Case", "corpo": "...", "cor": "azul"},
               {"titulo": "Conteúdo", "corpo": "...", "cor": "laranja"},
               {"titulo": "Membro novo", "corpo": "...", "cor": "cinza"} ] }

anatomia — conceito central + satélites ligados por linhas:
  { "arquetipo": "anatomia", "titulo": "T",
    "centro": {"titulo": "CONCEITO", "corpo": "definição em 1 linha", "cor": "dourado"},
    "itens": [ {"titulo": "Parte 1", "corpo": "...", "cor": "azul"} ] }

contraste — antes/depois, 2 colunas; "transicao" opcional (label da seta do meio):
  { "arquetipo": "contraste", "titulo": "T", "transicao": "o que muda",
    "colunas": [ {"titulo": "ANTES",  "cor": "vermelho",
                  "itens": [{"titulo": "...", "corpo": "..."}]},
                 {"titulo": "DEPOIS", "cor": "azul",
                  "itens": [{"titulo": "...", "corpo": "..."}]} ] }
"""
import hashlib
import json
import math
import re
import sys

# ─────────────────────── paleta dark (calibrada — não mudar sem recalibrar) ──────
BG = "#0f0f12"
FG = "#f1f3f5"          # texto primário
MUTE = "#909296"        # texto secundário
CURVA = "#ced4da"       # traço da curva
BASELINE = "#495057"    # linha de base
COMO_LER = "#748ffc"    # linha "Como ler:"
DIVISOR = "#2a2d31"     # divisor sutil entre atos (arquétipo historia)

# nome → (accent/borda, fundo do card, texto do card)
COR = {
    "laranja":  ("#ffa94d", "#2b2113", "#ffd8a8"),
    "azul":     ("#4dabf7", "#12212e", "#a5d8ff"),
    "cinza":    ("#adb5bd", "#1c1f23", "#ced4da"),
    "vermelho": ("#ff6b6b", "#2b1414", "#ffc9c9"),
    "dourado":  ("#ffd43b", "#2a2510", "#ffec99"),
}

FF = 2       # fontFamily: 2 = Helvetica (clean) · 1 = Virgil (à mão)
ROUGH = 0    # roughness: 0 = architect (limpo) · 1 = artist (à mão)
CHARW = 0.52 # largura média de char / fontSize (Helvetica; Virgil é mais largo)


def set_estilo(estilo):
    """Define o estilo do canvas: 'clean' (default) ou 'handwritten'."""
    global FF, ROUGH, CHARW
    if estilo == "handwritten":
        FF, ROUGH, CHARW = 1, 1, 0.60
    else:
        FF, ROUGH, CHARW = 2, 0, 0.52

# tipografia (design-system.md): título 32 · seção 16-18 · corpo 13-14
S_TITULO, S_SUB, S_COMOLER = 32, 16, 14
S_CARD_T, S_CARD_B = 17, 14
S_ZONA, S_SMALL, S_CITACAO = 15, 13, 18


def die(msg):
    print(f"ERRO: {msg}", file=sys.stderr)
    sys.exit(1)


def cor_de(nome):
    nome = nome or "cinza"
    if nome not in COR:
        die(f"cor desconhecida '{nome}' — use: {', '.join(COR)}")
    return COR[nome]


# ─────────────────────── helpers de elemento (esquema validado no piloto) ────
_counter = [0]


def uid():
    _counter[0] += 1
    return hashlib.md5(f"el-{_counter[0]}".encode()).hexdigest()[:16]


def base(el_type, x, y, w, h, **kw):
    return {
        "type": el_type, "id": uid(),
        "x": x, "y": y, "width": w, "height": h, "angle": 0,
        "strokeColor": kw.get("stroke", FG),
        "backgroundColor": kw.get("bg", "transparent"),
        "fillStyle": kw.get("fill", "solid"),
        "strokeWidth": kw.get("sw", 2),
        "strokeStyle": kw.get("ss", "solid"),
        "roughness": ROUGH, "opacity": kw.get("opacity", 100),
        "groupIds": [], "frameId": None, "roundness": kw.get("roundness"),
        "seed": _counter[0] * 7919, "version": 1, "versionNonce": _counter[0] * 104729,
        "isDeleted": False, "boundElements": [], "updated": 1,
        "link": kw.get("link"), "locked": False,
    }


def est_w(s, size):
    return max((len(l) for l in s.split("\n")), default=1) * size * CHARW


def text(x, y, s, size=20, color=FG, align="left", w=None, center_on=None, link=None,
         sobre_shape=False):
    """`sobre_shape=True` marca texto que é PARTE de um pictograma e vive
    intencionalmente sobre shapes (label de botão, tag da ponte, número de pin).
    O check linha×texto pula esses. Só funções pict_*/layout setam a flag —
    NUNCA whitelist por conteúdo/string."""
    t = base("text", x, y, w or est_w(s, size), len(s.split("\n")) * size * 1.25,
             stroke=color, link=link)
    if sobre_shape:
        t["_sobre_shape"] = True
    if center_on is not None:
        ew = est_w(s, size)
        t["x"] = center_on - ew / 2
        t["width"] = ew
        align = "center"
    t.update({
        "text": s, "rawText": s, "originalText": s,
        "fontSize": size, "fontFamily": FF, "textAlign": align,
        "verticalAlign": "top", "containerId": None, "lineHeight": 1.25,
        "autoResize": True,
    })
    return t


def arrow(x1, y1, x2, y2, color=FG, sw=1.5):
    a = base("arrow", x1, y1, x2 - x1, y2 - y1, stroke=color, sw=sw, roundness={"type": 2})
    a.update({"points": [[0, 0], [x2 - x1, y2 - y1]], "lastCommittedPoint": None,
              "startBinding": None, "endBinding": None,
              "startArrowhead": None, "endArrowhead": "arrow", "elbowed": False})
    return a


def arrow_multi(pts, color=FG, sw=1.5):
    """Seta com waypoints (rota em cotovelo) — usada quando a reta cruzaria a curva."""
    x0, y0 = pts[0]
    rel = [[px - x0, py - y0] for (px, py) in pts]
    xs = [p[0] for p in rel]; ys = [p[1] for p in rel]
    a = base("arrow", x0, y0, max(xs) - min(xs), max(ys) - min(ys),
             stroke=color, sw=sw, roundness={"type": 2})
    a.update({"points": rel, "lastCommittedPoint": None,
              "startBinding": None, "endBinding": None,
              "startArrowhead": None, "endArrowhead": "arrow", "elbowed": False})
    return a


def linha(x1, y1, x2, y2, color=FG, sw=1.5, ss="solid"):
    return polyline([(x1, y1), (x2, y2)], color=color, sw=sw, ss=ss)


def polyline(pts, color=FG, sw=3, ss="solid"):
    x0, y0 = pts[0]
    rel = [[px - x0, py - y0] for (px, py) in pts]
    xs = [p[0] for p in rel]; ys = [p[1] for p in rel]
    l = base("line", x0, y0, max(xs) - min(xs), max(ys) - min(ys),
             stroke=color, sw=sw, ss=ss, roundness={"type": 2})
    l.update({"points": rel, "lastCommittedPoint": None,
              "startBinding": None, "endBinding": None,
              "startArrowhead": None, "endArrowhead": None})
    return l


# ─────────────────────── texto: quebra por largura (anti-overflow) ───────────
def quebrar(s, size, max_w):
    """Quebra `s` em linhas que caibam em max_w (respeita \\n existentes)."""
    out = []
    for par in s.split("\n"):
        atual = ""
        for palavra in par.split(" "):
            cand = (atual + " " + palavra).strip()
            if not atual or est_w(cand, size) <= max_w:
                atual = cand
            else:
                out.append(atual)
                atual = palavra
        out.append(atual)
    return "\n".join(out)


def medir_card(w, titulo, corpo, definicao=""):
    """Retorna (h, titulo_q, definicao_q, corpo_q) pra um card de largura w.
    `definicao` = linha didática "o que é isso" (prefixo '= ', cor de acento),
    entre o título e o corpo — leitor de primeira viagem lê O QUE É antes do status."""
    tq = quebrar(titulo, S_CARD_T, w - 32)
    dq = quebrar("= " + definicao, S_CARD_B, w - 32) if definicao else ""
    cq = quebrar(corpo, S_CARD_B, w - 32) if corpo else ""
    th = len(tq.split("\n")) * S_CARD_T * 1.25
    dh = len(dq.split("\n")) * S_CARD_B * 1.25 if dq else 0
    ch = len(cq.split("\n")) * S_CARD_B * 1.25 if cq else 0
    h = 14 + th + (6 + dh if dq else 0) + (10 + ch if cq else 0) + 16
    return h, tq, dq, cq


def render_card(els, x, y, w, h, tq, cq, cor, link=None, dq=""):
    acc, bg, tx = cor_de(cor)
    els.append(base("rectangle", x, y, w, h, stroke=acc, bg=bg,
                    roundness={"type": 3}, sw=1.5, link=link))
    els.append(text(x + 16, y + 14, tq, size=S_CARD_T, color=tx))
    cy_ = y + 14 + len(tq.split("\n")) * S_CARD_T * 1.25
    if dq:
        cy_ += 6
        els.append(text(x + 16, cy_, dq, size=S_CARD_B, color=acc))
        cy_ += len(dq.split("\n")) * S_CARD_B * 1.25
    if cq:
        els.append(text(x + 16, cy_ + 10, cq, size=S_CARD_B, color=tx))


# ─────────────────────── blocos comuns (cabeçalho / banner / rodapé) ─────────
def cabecalho(spec, els, ctx):
    M, CW = ctx["M"], ctx["CW"]
    els.append(text(M, 40, spec["titulo"], size=S_TITULO, color=FG))
    y = 88.0
    if spec.get("subtitulo"):
        s = quebrar(spec["subtitulo"], S_SUB, CW)
        els.append(text(M + 2, y, s, size=S_SUB, color=MUTE))
        y += len(s.split("\n")) * S_SUB * 1.25 + 8
    if spec.get("gancho"):
        # "por que EU deveria me importar?" — 2ª pessoa, barra de acento à esquerda
        s = quebrar(spec["gancho"], 17, CW - 26)
        gh = len(s.split("\n")) * 17 * 1.25
        els.append(base("rectangle", M, y + 1, 4, gh, stroke="transparent",
                        bg=COR["dourado"][0]))
        els.append(text(M + 22, y, s, size=17, color=FG))
        y += gh + 12
    if spec.get("como_ler"):
        s = quebrar("Como ler:  " + spec["como_ler"], S_COMOLER, CW)
        els.append(text(M + 2, y, s, size=S_COMOLER, color=COMO_LER))
        y += len(s.split("\n")) * S_COMOLER * 1.25
    return max(y + 30, 150.0)


def banner_citacao(spec, els, y, ctx):
    cit = spec.get("citacao")
    if not cit:
        return y
    if not cit.get("ref"):
        die("citação direta sem 'ref' (minutagem [arquivo @ MM:SS]) — regra de provenância do vault")
    M, W, CW = ctx["M"], ctx["W"], ctx["CW"]
    acc, bg, tx = COR["dourado"]
    tq = quebrar(cit["texto"], S_CITACAO, CW - 44)
    th = len(tq.split("\n")) * S_CITACAO * 1.25
    bh = 14 + th + 8 + S_SMALL * 1.25 + 14
    els.append(base("rectangle", M, y, CW, bh, stroke=acc, bg=bg,
                    roundness={"type": 3}, sw=1.5))
    els.append(text(M + 22, y + 14, tq, size=S_CITACAO, color=tx))
    autor = cit.get("autor", "")
    ref = f"— {autor}   ·   [{cit['ref']}]" if autor else f"[{cit['ref']}]"
    els.append(text(M + 22, y + 14 + th + 8, ref, size=S_SMALL, color=MUTE))
    return y + bh + 22


def bloco_takeaway(spec, els, y, ctx):
    """"E AGORA? →": 1-3 bullets ACIONÁVEIS — o que o leitor faz com o que leu.
    Fecha a história DEPOIS do clímax (citação). ⚠️ Regra de processo (SKILL.md):
    cada bullet tem que estar ANCORADO na fonte — takeaway inventado é proibido."""
    tk = spec.get("takeaway")
    if not tk:
        return y
    if isinstance(tk, list):
        tk = {"bullets": tk}
    bullets = tk.get("bullets") or []
    if not bullets:
        die("takeaway sem 'bullets'")
    if len(bullets) > 3:
        die("takeaway: máximo 3 bullets — mais que isso ninguém age (didática)")
    M, CW = ctx["M"], ctx["CW"]
    acc, bgc, tx = COR["azul"]  # azul = ação/em movimento
    tit = tk.get("titulo", "E AGORA? →")
    linhas = [quebrar("→  " + b, 14, CW - 64) for b in bullets]
    bh = 14 + 15 * 1.25 + 8 + sum(len(l.split("\n")) * 14 * 1.25 + 6 for l in linhas) + 8
    els.append(base("rectangle", M, y, CW, bh, stroke=acc, bg=bgc,
                    roundness={"type": 3}, sw=1.5))
    els.append(text(M + 22, y + 14, tit, size=15, color=acc))
    by = y + 14 + 15 * 1.25 + 8
    for l in linhas:
        els.append(text(M + 22, by, l, size=14, color=tx))
        by += len(l.split("\n")) * 14 * 1.25 + 6
    return y + bh + 22


def rodape(spec, els, y, ctx):
    M, CW = ctx["M"], ctx["CW"]
    s = quebrar(spec["proveniencia"], S_SMALL, CW)
    els.append(text(M + 2, y, s, size=S_SMALL, color=MUTE))
    return y + len(s.split("\n")) * S_SMALL * 1.25


def _centro_label_area(g, a0, a1, lw, y_topo_label, mu):
    """Centro x pro label de área sob a curva onde a curva passa TODA acima do
    label (desliza na direção do pico). None = não coube, pula o label.
    Anti linha×texto: a curva (e a borda do fill) não pode cruzar o nome da área."""
    lcx = (a0 + a1) / 2
    passo = 14 if lcx < mu else -14
    for _ in range(60):
        lo, hi = int(lcx - lw / 2), int(lcx + lw / 2)
        if lo < a0 + 6 or hi > a1 - 6:
            return None
        if max(g(px) for px in range(lo, hi + 1, 6)) < y_topo_label - 3:
            return lcx
        lcx += passo
    return None


# ─────────────────────── arquétipo 1: pipeline ────────────────────────────────
def layout_pipeline(spec, els, y0, ctx):
    itens = spec["itens"]
    M, CW = ctx["M"], ctx["CW"]
    numerar = spec.get("numerar", True)
    per_row = min(len(itens), 4)
    gap = 70
    cw = min(360, max(260, (CW - (per_row - 1) * gap) / per_row))
    rows = [itens[i:i + per_row] for i in range(0, len(itens), per_row)]
    y = y0
    idx = 0
    prev_anchor = None  # (x, y) bottom-center do último card da row anterior
    for row in rows:
        med = []
        for it in row:
            idx += 1
            t = f"{idx}. {it['titulo']}" if numerar else it["titulo"]
            med.append((it,) + medir_card(cw, t, it.get("corpo", ""), it.get("definicao", "")))
        H = max(m[1] for m in med)
        row_w = len(row) * cw + (len(row) - 1) * gap
        x = M + (CW - row_w) / 2
        first_anchor = (x + cw / 2, y)
        for i, (it, h, tq, dq, cq) in enumerate(med):
            render_card(els, x, y, cw, H, tq, cq, it.get("cor"), it.get("link"), dq)
            if i < len(med) - 1:
                els.append(arrow(x + cw + 10, y + H / 2, x + cw + gap - 10, y + H / 2, color=MUTE))
            if i == len(med) - 1:
                prev_row_last = (x + cw / 2, y + H)
            x += cw + gap
        if prev_anchor:
            els.append(arrow(prev_anchor[0], prev_anchor[1] + 8, first_anchor[0], first_anchor[1] - 8, color=MUTE))
        prev_anchor = prev_row_last
        y += H + 80
    return y - 80 + 30


# ─────────────────────── arquétipo 2: curva-com-abismo ───────────────────────
def layout_curva_abismo(spec, els, y0, ctx):
    M, W, CW = ctx["M"], ctx["W"], ctx["CW"]
    itens = spec["itens"]

    # cards das ondas/estágios (linha de cima)
    n = len(itens)
    cw = 330
    gap = (CW - n * cw) / (n - 1) if n > 1 else 0
    med = [(it,) + medir_card(cw, it["titulo"], it.get("corpo", ""), it.get("definicao", ""))
           for it in itens]
    cards_bottom = y0 + max(m[1] for m in med)

    # geometria da curva (gaussiana com gap no abismo)
    X0, X1 = M + 90, W - 50
    R = X1 - X0
    PEAK = 300
    MU = X0 + R * spec.get("pico", 0.507)
    SIGMA = R * 0.195
    GAP_TOPO = 100                     # folga cards→pico: abre o corredor das setas
    BASE_Y = cards_bottom + GAP_TOPO + PEAK
    CORREDOR_Y = cards_bottom + 36     # faixa livre ACIMA da curva inteira, abaixo dos cards

    def gy(x):
        return BASE_Y - PEAK * math.exp(-((x - MU) ** 2) / (2 * SIGMA ** 2))

    ab = spec.get("abismo", {})
    pos = ab.get("pos", 0.281)
    CH0, CH1 = X0 + (pos - 0.035) * R, X0 + (pos + 0.035) * R

    # áreas pintadas sob a curva (didática: fases do mercado) — antes da curva (z-order)
    if ab:
        areas = spec.get("areas", [
            {"de": 0.0, "ate": "abismo", "nome": "MERCADO INICIAL", "cor": "laranja"},
            {"de": "abismo", "ate": 1.0, "nome": "MERCADO PRINCIPAL", "cor": "azul"},
        ])
    else:
        areas = spec.get("areas", [])
    for ar in areas:
        a0 = CH1 if ar.get("de") == "abismo" else X0 + float(ar.get("de", 0)) * R
        a1 = CH0 if ar.get("ate") == "abismo" else X0 + float(ar.get("ate", 1)) * R
        acc = cor_de(ar.get("cor"))[0]
        cpts = [(px, gy(px)) for px in range(int(a0), int(a1) + 1, 12)]
        poly = cpts + [(a1, BASE_Y), (a0, BASE_Y), cpts[0]]
        fill = polyline(poly, color="transparent", sw=1)
        fill["backgroundColor"] = acc
        fill["fillStyle"] = "solid"
        fill["opacity"] = 8
        els.append(fill)
        if ar.get("nome"):
            lcx = _centro_label_area(gy, a0, a1, est_w(ar["nome"], 11), BASE_Y - 28, MU)
            if lcx is not None:
                els.append(text(0, BASE_Y - 28, ar["nome"], size=11, color=acc,
                                center_on=lcx))

    # curva em 2 trechos + eixo do tempo (baseline com seta)
    pts1 = [(x, gy(x)) for x in range(int(X0), int(CH0) + 1, 10)]
    pts2 = [(x, gy(x)) for x in range(int(CH1), int(X1) + 1, 10)]
    els.append(polyline(pts1, color=CURVA, sw=3))
    els.append(polyline(pts2, color=CURVA, sw=3))
    els.append(arrow(X0, BASE_Y, X1 + 28, BASE_Y, color=BASELINE, sw=1.5))
    eixo = spec.get("eixo_x", "tempo →")
    if eixo:
        ew = est_w(eixo, 12)
        els.append(text(X1 - ew, BASE_Y + 44, eixo, size=12, color=BASELINE))

    # bordas do precipício + banda do abismo
    RED, RED_BG, RED_TX = COR["vermelho"]
    for xe in (CH0, CH1):
        els.append(base("ellipse", xe - 5, gy(xe) - 5, 10, 10, stroke=RED, bg=RED, fill="solid"))
    ytop = min(gy(CH0), gy(CH1)) - 20
    els.append(base("rectangle", CH0, ytop, CH1 - CH0, BASE_Y - ytop + 4,
                    stroke=RED, bg=RED_BG, fill="hachure", ss="dashed", sw=1.5))

    # labels dos segmentos (abaixo da base) — "explicacao" opcional (parcimônia)
    segs = spec.get("segmentos", [])
    for i, s in enumerate(segs):
        if isinstance(s, str):
            p, nome, exp = 0.05 + 0.9 * i / max(len(segs) - 1, 1), s, None
        else:
            p, nome, exp = s["pos"], s["nome"], s.get("explicacao")
        els.append(text(0, BASE_Y + 20, nome, size=S_COMOLER, color=MUTE, center_on=X0 + p * R))
        if exp:
            els.append(text(0, BASE_Y + 20 + S_COMOLER * 1.25 + 2, quebrar(exp, 11, 220),
                            size=11, color=MUTE, center_on=X0 + p * R))

    # cards + setas pro alvo na curva — chegada POR CIMA, rota anti-cruzamento
    def cruza_curva(sx, sy, tx, ty):
        """True se a reta (sx,sy)→(tx,ty) encosta na curva antes do trecho final de chegada."""
        steps = max(int(abs(tx - sx) / 8), 8)
        for i in range(steps + 1):
            f = i / steps
            if f > 0.90:
                continue
            px, py = sx + (tx - sx) * f, sy + (ty - sy) * f
            if X0 <= px <= X1 and py > gy(px) - 10:
                return True
        return False

    chegadas = []   # x das pontas das setas (pra labels de zona desviarem)
    x = M
    PR = 14         # raio do pin numerado
    for i_it, (it, h, tq, dq, cq) in enumerate(med):
        render_card(els, x, y0, cw, h, tq, cq, it.get("cor"), it.get("link"), dq)
        alvo = it.get("alvo")
        if alvo is not None:
            acc, bgc, _txc = cor_de(it.get("cor"))
            # ponto do pin: NA curva (ou no meio da banda, se alvo = abismo)
            if alvo == "abismo":
                tx_, py_ = (CH0 + CH1) / 2, (ytop + BASE_Y) / 2
            elif alvo == "pico":
                tx_, py_ = MU, gy(MU)
            else:
                tx_ = X0 + float(alvo) * R
                py_ = gy(tx_)
            ty_ = py_ - PR - 10          # seta chega ACIMA do pin
            sx_, sy_ = x + cw / 2, y0 + h + 4
            if cruza_curva(sx_, sy_, tx_, ty_):
                # rota-corredor: desce do card, corre na faixa livre, chega na vertical
                els.append(arrow_multi([(sx_, sy_), (sx_, CORREDOR_Y),
                                        (tx_, CORREDOR_Y), (tx_, ty_)], color=acc))
            else:
                els.append(arrow(sx_, sy_, tx_, ty_, color=acc))
            # pin numerado (correspondência dupla card ↔ ponto: cor + número)
            m_num = re.match(r"^(\d+)", it["titulo"].strip())
            num = m_num.group(1) if m_num else str(i_it + 1)
            els.append(base("ellipse", tx_ - PR, py_ - PR, PR * 2, PR * 2,
                            stroke=acc, bg=bgc, fill="solid", sw=2))
            els.append(text(0, py_ - 9, num, size=15, color=acc, center_on=tx_,
                            sobre_shape=True))  # número vive NO pin, por design
            chegadas.append(tx_)
        x += cw + gap

    # zonas nomeadas sobre a curva: folga calculada no trecho REAL da curva sob o
    # texto (nunca cruza a linha em rampa) + desvio lateral das pontas de seta
    for z in spec.get("zonas", []):
        zx = X0 + z["pos"] * R
        acc = cor_de(z.get("cor"))[0]
        zw = est_w(z["nome"], S_ZONA)
        for cx_ in chegadas:
            if abs(zx - cx_) < zw / 2 + 26:
                zx = cx_ - (zw / 2 + 34) if zx <= cx_ else cx_ + (zw / 2 + 34)
        topo_curva = min(gy(px) for px in range(int(zx - zw / 2), int(zx + zw / 2) + 1, 8))
        zy = topo_curva - S_ZONA * 1.25 - 14
        els.append(text(0, zy, z["nome"], size=S_ZONA, color=acc, center_on=zx))

    # callout do abismo (abaixo da base, centrado no gap)
    y = BASE_Y + 44
    if ab:
        co_w = 340
        cx = (CH0 + CH1) / 2
        co_x = min(max(cx - co_w / 2, M), W - M - co_w)
        co_y = BASE_Y + 60
        tq = quebrar(ab.get("titulo", "O ABISMO"), 16, co_w - 32)
        cq = quebrar(ab.get("corpo", ""), S_SMALL, co_w - 32)
        th = len(tq.split("\n")) * 16 * 1.25
        ch = len(cq.split("\n")) * S_SMALL * 1.25 if cq else 0
        co_h = 12 + th + 6 + ch + 12
        els.append(base("rectangle", co_x, co_y, co_w, co_h, stroke=RED, bg=RED_BG,
                        roundness={"type": 3}, sw=1.5))
        els.append(text(co_x + 16, co_y + 12, tq, size=16, color=RED))
        if cq:
            els.append(text(co_x + 16, co_y + 12 + th + 6, cq, size=S_SMALL, color=RED_TX))
        els.append(arrow(cx, co_y - 4, cx, BASE_Y + 6, color=RED, sw=1.2))
        y = co_y + co_h + 46

    # visual de tensão (opcional): o descompasso vira imagem — seta longa vs curta
    tens = spec.get("tensao")
    if tens:
        acc1 = cor_de(tens.get("cor_maior", "azul"))[0]
        acc2 = cor_de(tens.get("cor_menor", "cinza"))[0]
        L1, L2 = 420, 130
        tx0 = W - M - (L1 + 40)
        ty0 = BASE_Y + 76
        els.append(text(tx0, ty0, tens.get("maior", ""), size=13, color=acc1))
        els.append(arrow(tx0, ty0 + 28, tx0 + L1, ty0 + 28, color=acc1, sw=3.5))
        els.append(text(tx0, ty0 + 46, tens.get("menor", ""), size=13, color=acc2))
        els.append(arrow(tx0, ty0 + 74, tx0 + L2, ty0 + 74, color=acc2, sw=2))
        if tens.get("nota"):
            els.append(text(tx0 + L2 + 26, ty0 + 67, tens["nota"], size=12, color=MUTE))
        y = max(y, ty0 + 74 + 40)
    return y


# ─────────────────────── arquétipo 3: matriz-2x2 ─────────────────────────────
def layout_matriz_2x2(spec, els, y0, ctx):
    M, CW = ctx["M"], ctx["CW"]
    quads = {it["quadrante"]: it for it in spec["itens"]}
    ordem = ["cima-esquerda", "cima-direita", "baixo-esquerda", "baixo-direita"]
    faltam = [q for q in ordem if q not in quads]
    if faltam:
        die(f"matriz-2x2 exige os 4 quadrantes; faltam: {', '.join(faltam)}")

    qw, gap = 470, 100
    grid_w = 2 * qw + gap
    gx = M + (CW - grid_w) / 2
    cx = gx + qw + gap / 2

    med = {q: medir_card(qw, quads[q]["titulo"], quads[q].get("corpo", ""),
                         quads[q].get("definicao", "")) for q in ordem}
    qh = max(m[0] for m in med.values())

    # rótulo do eixo Y (cima) → grid → rótulo do eixo X (baixo)
    y = y0
    rot_y = spec.get("eixo_y", {}).get("rotulo", "")
    if rot_y:
        els.append(text(0, y, rot_y, size=S_ZONA, color=MUTE, center_on=cx))
        y += S_ZONA * 1.25 + 16
    grid_top = y
    cy = grid_top + qh + gap / 2

    # eixos (pelo vão entre os quadrantes)
    els.append(arrow(cx, grid_top + 2 * qh + gap + 8, cx, grid_top - 8, color=BASELINE, sw=1.5))
    els.append(arrow(gx - 12, cy, gx + grid_w + 12, cy, color=BASELINE, sw=1.5))

    for i, q in enumerate(ordem):
        h, tq, dq, cq = med[q]
        px = gx if "esquerda" in q else gx + qw + gap
        py = grid_top if "cima" in q else grid_top + qh + gap
        render_card(els, px, py, qw, qh, tq, cq, quads[q].get("cor"), quads[q].get("link"), dq)

    y = grid_top + 2 * qh + gap + 26
    rot_x = spec.get("eixo_x", {}).get("rotulo", "")
    if rot_x:
        els.append(text(0, y, rot_x, size=S_ZONA, color=MUTE, center_on=cx))
        y += S_ZONA * 1.25
    return y + 30


# ─────────────────────── arquétipo 4: funil ──────────────────────────────────
def layout_funil(spec, els, y0, ctx):
    M, CW = ctx["M"], ctx["CW"]
    itens = spec["itens"]
    n = len(itens)
    cx = M + CW / 2
    w_topo = min(920, CW - 200)
    w_base = 440
    y = y0
    for i, it in enumerate(itens):
        w = w_topo - (w_topo - w_base) * (i / max(n - 1, 1))
        h, tq, dq, cq = medir_card(w, it["titulo"], it.get("corpo", ""), it.get("definicao", ""))
        render_card(els, cx - w / 2, y, w, h, tq, cq, it.get("cor"), it.get("link"), dq)
        if i < n - 1:
            els.append(arrow(cx, y + h + 6, cx, y + h + 30, color=MUTE))
        y += h + 36
    return y


# ─────────────────────── arquétipo 5: piramide ───────────────────────────────
def layout_piramide(spec, els, y0, ctx):
    M, CW = ctx["M"], ctx["CW"]
    itens = spec["itens"]  # itens[0] = BASE
    n = len(itens)
    cx = M + CW / 2
    w_base = min(980, CW - 160)
    w_topo = 460
    y = y0
    for i, it in enumerate(reversed(itens)):  # desenha do topo (estreito) pra base (larga)
        w = w_topo + (w_base - w_topo) * (i / max(n - 1, 1))
        h, tq, dq, cq = medir_card(w, it["titulo"], it.get("corpo", ""), it.get("definicao", ""))
        render_card(els, cx - w / 2, y, w, h, tq, cq, it.get("cor"), it.get("link"), dq)
        y += h + 14
    return y + 16


# ─────────────────────── arquétipo 6: ciclo ──────────────────────────────────
def layout_ciclo(spec, els, y0, ctx):
    M, CW = ctx["M"], ctx["CW"]
    itens = spec["itens"]
    n = len(itens)
    cw = 300
    med = [(it,) + medir_card(cw, it["titulo"], it.get("corpo", ""), it.get("definicao", ""))
           for it in itens]
    mh = max(m[1] for m in med)
    Rr = max(310, n * 70)
    cx = M + CW / 2
    cy = y0 + mh / 2 + Rr + 20

    # setas do loop (cordas entre posições vizinhas, sentido horário)
    passo = 360.0 / n
    # folga angular além do CANTO do card (+14px de buffer), pra corda não nascer
    # nem morrer dentro de um card (check linha×texto); clamp evita corda invertida
    folga = max(passo * 0.30,
                math.degrees(math.atan2(math.hypot(cw / 2, mh / 2) + 14, Rr)))
    folga = min(folga, passo * 0.42)
    for i in range(n):
        a1 = math.radians(-90 + i * passo + folga)
        a2 = math.radians(-90 + (i + 1) * passo - folga)
        els.append(arrow(cx + Rr * math.cos(a1), cy + Rr * math.sin(a1),
                         cx + Rr * math.cos(a2), cy + Rr * math.sin(a2), color=MUTE))

    for i, (it, h, tq, dq, cq) in enumerate(med):
        a = math.radians(-90 + i * passo)
        px = cx + Rr * math.cos(a) - cw / 2
        py = cy + Rr * math.sin(a) - h / 2
        render_card(els, px, py, cw, h, tq, cq, it.get("cor"), it.get("link"), dq)

    centro = spec.get("centro")
    if centro:
        h, tq, dq, cq = medir_card(cw, centro["titulo"], centro.get("corpo", ""),
                                   centro.get("definicao", ""))
        render_card(els, cx - cw / 2, cy - h / 2, cw, h, tq, cq, centro.get("cor", "dourado"),
                    None, dq)
    return cy + Rr + mh / 2 + 40


# ─────────────────────── arquétipo 7: anatomia ───────────────────────────────
def layout_anatomia(spec, els, y0, ctx):
    M, CW = ctx["M"], ctx["CW"]
    itens = spec["itens"]
    centro = spec["centro"]
    n = len(itens)
    cw = 300
    med = [(it,) + medir_card(cw, it["titulo"], it.get("corpo", ""), it.get("definicao", ""))
           for it in itens]
    mh = max(m[1] for m in med)
    ch_, ctq, cdq, ccq = medir_card(330, centro["titulo"], centro.get("corpo", ""),
                                    centro.get("definicao", ""))

    Rx = min(560, (CW - cw) / 2 - 10)
    Ry = max(240, mh + 60)
    cx = M + CW / 2
    cy = y0 + Ry + mh / 2 + 10

    # linhas centro→satélite CLIPADAS nas bordas dos cards (+8px): a linha conecta
    # borda com borda e nunca entra no card — logo nunca cruza texto (check linha×texto)
    passo = 360.0 / n
    pos = []
    cbb = (cx - 165, cy - ch_ / 2, 330, ch_)

    def _dentro(qx, qy, bb, m=8):
        return bb[0] - m <= qx <= bb[0] + bb[2] + m and bb[1] - m <= qy <= bb[1] + bb[3] + m

    for i in range(n):
        a = math.radians(-90 + i * passo)
        px, py = cx + Rx * math.cos(a), cy + Ry * math.sin(a)
        pos.append((px, py))
        h_i = med[i][1]
        sbb = (px - cw / 2, py - h_i / 2, cw, h_i)
        t0, t1 = 0.0, 1.0
        NP = 160
        for k in range(NP + 1):
            t = k / NP
            qx, qy = cx + (px - cx) * t, cy + (py - cy) * t
            if _dentro(qx, qy, cbb):
                t0 = t
            if _dentro(qx, qy, sbb):
                t1 = t
                break
        if t1 > t0:
            els.append(linha(cx + (px - cx) * t0, cy + (py - cy) * t0,
                             cx + (px - cx) * t1, cy + (py - cy) * t1,
                             color=BASELINE, sw=1.5))

    render_card(els, cx - 165, cy - ch_ / 2, 330, ch_, ctq, ccq, centro.get("cor", "dourado"),
                None, cdq)
    for (it, h, tq, dq, cq), (px, py) in zip(med, pos):
        render_card(els, px - cw / 2, py - h / 2, cw, h, tq, cq, it.get("cor"), it.get("link"), dq)
    return cy + Ry + mh / 2 + 40


# ─────────────────────── arquétipo 8: contraste ──────────────────────────────
def layout_contraste(spec, els, y0, ctx):
    M, CW = ctx["M"], ctx["CW"]
    colunas = spec["colunas"]
    if len(colunas) != 2:
        die("contraste exige exatamente 2 colunas")
    gutter = 150
    colw = (CW - gutter) / 2
    xs = [M, M + colw + gutter]
    bottoms = []
    for x, col in zip(xs, colunas):
        acc = cor_de(col.get("cor"))[0]
        els.append(text(0, y0, col["titulo"], size=18, color=acc, center_on=x + colw / 2))
        els.append(linha(x, y0 + 30, x + colw, y0 + 30, color=acc, sw=2))
        y = y0 + 48
        for it in col["itens"]:
            h, tq, dq, cq = medir_card(colw, it["titulo"], it.get("corpo", ""),
                                       it.get("definicao", ""))
            render_card(els, x, y, colw, h, tq, cq, it.get("cor", col.get("cor")),
                        it.get("link"), dq)
            y += h + 20
        bottoms.append(y - 20)
    ymid = y0 + 48 + (max(bottoms) - y0 - 48) / 2
    trans = spec.get("transicao")
    if trans:
        tq = quebrar(trans, S_SMALL, gutter - 24)
        th = len(tq.split("\n")) * S_SMALL * 1.25
        els.append(text(0, ymid - th - 12, tq, size=S_SMALL, color=MUTE,
                        center_on=M + colw + gutter / 2))
    els.append(arrow(M + colw + 18, ymid, M + colw + gutter - 18, ymid, color=MUTE, sw=2))
    return max(bottoms) + 30


# ─────────────────────── biblioteca de PICTOGRAMAS (metáforas em shapes) ─────
# Todos parametrizados (posição, escala, cor) e feitos de shapes puros do
# Excalidraw. Melhor um desenho simples e legível que um complexo torto.

def pict_tornado(els, cx, y, s, cor="azul"):
    """Funil espiral: elipses achatadas empilhadas, largura decrescente, + vento.
    (cx = centro horizontal, y = topo, s = largura da boca). Retorna altura."""
    acc = cor_de(cor)[0]
    n = 5
    h_el = s * 0.18
    total = s * 0.88
    for i in range(n):
        w = s * (1.0 - 0.17 * i)
        ey = y + (total - h_el) * (i / (n - 1))
        ox = (s * 0.06) * (i / n) * (1 if i % 2 else -1)  # deriva = movimento
        els.append(base("ellipse", cx - w / 2 + ox, ey, w, h_el, stroke=acc, sw=1.5))
    # linhas de vento à direita da boca
    for i in range(2):
        ly = y + h_el * (0.8 + i * 1.1)
        lx = cx + s * 0.58
        els.append(polyline([(lx, ly), (lx + s * 0.20, ly - s * 0.05)], color=acc, sw=1))
    return total


def pict_botao(els, cx, cy, w, label, cor="azul"):
    """Botão de UI com 'sombra' (retângulo offset 4px atrás) e label centralizado.
    (cx, cy) = centro do botão. Retorna altura."""
    acc, bgc, tx = cor_de(cor)
    h = 46
    sombra = base("rectangle", cx - w / 2 + 4, cy - h / 2 + 4, w, h,
                  stroke="transparent", bg="#000000", roundness={"type": 3})
    sombra["opacity"] = 60
    els.append(sombra)
    els.append(base("rectangle", cx - w / 2, cy - h / 2, w, h, stroke=acc, bg=bgc,
                    roundness={"type": 3}, sw=1.5))
    lb = quebrar(label, 14, w - 24)
    lh = len(lb.split("\n")) * 14 * 1.25
    els.append(text(0, cy - lh / 2, lb, size=14, color=tx, center_on=cx,
                    sobre_shape=True))  # label vive DENTRO do botão, por design
    return h


def pict_precipicio_ponte(els, x, y, w, h=170, tag=None, cor_ponte="dourado", ponte=True):
    """Dois penhascos com vão, ponte tracejada atravessando, bandeirinha à direita
    (a metáfora do CROSSING the chasm). (x, y) = canto sup. esq. da área total
    (inclui o respiro da bandeira/tag acima da ponte). `ponte=False` desenha só o
    vão, SEM ponte/bandeira/tag — revelação progressiva (hook de vídeo). Retorna h."""
    acc_c, bg_c, _ = COR["cinza"]
    acc_p = cor_de(cor_ponte)[0]
    RED, RED_BG, _ = COR["vermelho"]
    y_top, y_bot = y + 34, y + h
    g0, g1 = x + w * 0.40, x + w * 0.60
    esq = [(x, y_bot), (x, y_top), (g0, y_top), (g0 - w * 0.02, y_bot), (x, y_bot)]
    dir_ = [(g1, y_top), (x + w, y_top), (x + w, y_bot), (g1 + w * 0.02, y_bot), (g1, y_top)]
    for pts in (esq, dir_):
        p = polyline(pts, color=acc_c, sw=1.5)
        p["backgroundColor"] = bg_c
        p["fillStyle"] = "solid"
        els.append(p)
    els.append(base("rectangle", g0, y_top + 8, g1 - g0, y_bot - y_top - 8,
                    stroke=RED, bg=RED_BG, fill="hachure", ss="dashed", sw=1))
    if ponte:
        els.append(linha(g0 - w * 0.03, y_top - 6, g1 + w * 0.03, y_top - 6,
                         color=acc_p, sw=2.5, ss="dashed"))
        fx = x + w * 0.74                 # bandeirinha: chegou do outro lado
        els.append(linha(fx, y_top, fx, y_top - 30, color=acc_p, sw=1.5))
        tri = polyline([(fx, y_top - 30), (fx + 16, y_top - 25), (fx, y_top - 20), (fx, y_top - 30)],
                       color=acc_p, sw=1)
        tri["backgroundColor"] = acc_p
        tri["fillStyle"] = "solid"
        els.append(tri)
        if tag:
            els.append(text(0, y_top - 26, tag, size=13, color=acc_p, center_on=(g0 + g1) / 2,
                            sobre_shape=True))  # tag vive sobre a ponte, por design
    return h


def pict_rua(els, x, y, w, cor="cinza"):
    """Main street: casinhas (corpo+telhado+porta) sobre linha de chão —
    'absorvida no cotidiano'. (x, y) = canto sup. esq. Retorna altura."""
    acc, bgc, _ = cor_de(cor)
    n = 4 if w >= 260 else 3
    hw = w / (n * 1.35)
    gap = (w - n * hw) / (n - 1)
    rh, hh = hw * 0.5, hw * 0.85
    ground = y + rh + hh
    for i in range(n):
        hx = x + i * (hw + gap)
        els.append(base("rectangle", hx, y + rh, hw, hh, stroke=acc, bg=bgc, sw=1.5))
        els.append(polyline([(hx - hw * 0.08, y + rh), (hx + hw / 2, y),
                             (hx + hw * 1.08, y + rh)], color=acc, sw=1.5))
        els.append(base("rectangle", hx + hw * 0.38, ground - hh * 0.45, hw * 0.24,
                        hh * 0.45, stroke=acc, sw=1))
    els.append(linha(x - 14, ground, x + w + 14, ground, color=BASELINE, sw=1.5))
    return rh + hh


def pict_onda_mini(els, x, y, w, h=90, cor=None, rasgo=False):
    """Gaussiana pequena com baseline; rasgo=True abre o gap vermelho do abismo."""
    c = cor_de(cor)[0] if cor else CURVA
    base_y = y + h
    mu, sg = x + w * 0.5, w * 0.20

    def g(px):
        return base_y - (h - 6) * math.exp(-((px - mu) ** 2) / (2 * sg ** 2))

    if rasgo:
        r0, r1 = x + w * 0.30, x + w * 0.36
        els.append(polyline([(px, g(px)) for px in range(int(x), int(r0) + 1, 6)], color=c, sw=2))
        els.append(polyline([(px, g(px)) for px in range(int(r1), int(x + w) + 1, 6)], color=c, sw=2))
        RED = COR["vermelho"][0]
        for xe in (r0, r1):
            els.append(base("ellipse", xe - 3, g(xe) - 3, 6, 6, stroke=RED, bg=RED, fill="solid"))
    else:
        els.append(polyline([(px, g(px)) for px in range(int(x), int(x + w) + 1, 6)], color=c, sw=2))
    els.append(linha(x, base_y, x + w, base_y, color=BASELINE, sw=1))
    return h


def pict_setas_tensao(els, x, y, w, maior, menor, nota=None,
                      cor_maior="azul", cor_menor="cinza"):
    """Descompasso: seta longa (maior) sobre seta curta (menor). Retorna altura."""
    a1, a2 = cor_de(cor_maior)[0], cor_de(cor_menor)[0]
    L1 = min(520, w)
    L2 = L1 * 0.30
    els.append(text(x, y, maior, size=14, color=a1))
    els.append(arrow(x, y + 30, x + L1, y + 30, color=a1, sw=3.5))
    els.append(text(x, y + 52, menor, size=14, color=a2))
    els.append(arrow(x, y + 82, x + L2, y + 82, color=a2, sw=2))
    if nota:
        els.append(text(x + L2 + 28, y + 74, nota, size=13, color=MUTE))
    return 100


# ─────────────────────── visuais de ATO (arquétipo historia) ─────────────────
# Cada visual recebe (els, v, x, y, w) — v = dict do spec — e retorna a altura usada.

def vis_curva_abismo_mini(els, v, x, y, w):
    """A curva de adoção LIMPA: onda + rasgo vermelho + labels. Sem cards, sem
    pins, sem eixo verboso — a versão que conta o mapa sozinha."""
    PEAK = v.get("altura", 190)
    X0, X1 = x + 30, x + w - 30
    R = X1 - X0
    MU = X0 + R * v.get("pico", 0.507)
    SG = R * 0.195
    base_y = y + 58 + PEAK   # headroom pra zona com explicação (2 linhas)

    def g(px):
        return base_y - PEAK * math.exp(-((px - MU) ** 2) / (2 * SG ** 2))

    ab = v.get("abismo")
    if ab:
        pos = ab.get("pos", 0.281)
        CH0, CH1 = X0 + (pos - 0.035) * R, X0 + (pos + 0.035) * R
    # áreas pintadas (mercado inicial/principal) — didática, bem sutil
    areas = v.get("areas", [
        {"de": 0.0, "ate": "abismo", "nome": "MERCADO INICIAL", "cor": "laranja"},
        {"de": "abismo", "ate": 1.0, "nome": "MERCADO PRINCIPAL", "cor": "azul"},
    ] if ab else [])
    for ar in areas:
        a0 = CH1 if ar.get("de") == "abismo" else X0 + float(ar.get("de", 0)) * R
        a1 = CH0 if ar.get("ate") == "abismo" else X0 + float(ar.get("ate", 1)) * R
        acc = cor_de(ar.get("cor"))[0]
        cpts = [(px, g(px)) for px in range(int(a0), int(a1) + 1, 12)]
        poly = cpts + [(a1, base_y), (a0, base_y), cpts[0]]
        fill = polyline(poly, color="transparent", sw=1)
        fill["backgroundColor"] = acc
        fill["fillStyle"] = "solid"
        fill["opacity"] = 8
        els.append(fill)
        if ar.get("nome"):
            lcx = _centro_label_area(g, a0, a1, est_w(ar["nome"], 11), base_y - 26, MU)
            if lcx is not None:
                els.append(text(0, base_y - 26, ar["nome"], size=11, color=acc,
                                center_on=lcx))
    # onda (2 trechos se houver rasgo) + baseline simples
    RED, RED_BG, _ = COR["vermelho"]
    if ab:
        els.append(polyline([(px, g(px)) for px in range(int(X0), int(CH0) + 1, 10)], color=CURVA, sw=3))
        els.append(polyline([(px, g(px)) for px in range(int(CH1), int(X1) + 1, 10)], color=CURVA, sw=3))
        for xe in (CH0, CH1):
            els.append(base("ellipse", xe - 5, g(xe) - 5, 10, 10, stroke=RED, bg=RED, fill="solid"))
        ytop = min(g(CH0), g(CH1)) - 20
        els.append(base("rectangle", CH0, ytop, CH1 - CH0, base_y - ytop + 4,
                        stroke=RED, bg=RED_BG, fill="hachure", ss="dashed", sw=1.5))
        if v.get("rotulo_abismo"):
            els.append(text(0, ytop - 22, v["rotulo_abismo"], size=13, color=RED,
                            center_on=(CH0 + CH1) / 2))
    else:
        els.append(polyline([(px, g(px)) for px in range(int(X0), int(X1) + 1, 10)], color=CURVA, sw=3))
    els.append(linha(X0, base_y, X1, base_y, color=BASELINE, sw=1.5))
    # zonas nomeadas acima da curva — jargão SEMPRE com explicação simples embaixo
    # (calibração 10/07: "pq um tornado? main street? nao ta claro")
    for z in v.get("zonas", []):
        zx = X0 + z["pos"] * R
        acc = cor_de(z.get("cor"))[0]
        exp = z.get("explicacao")
        zw = est_w(z["nome"], S_ZONA)
        if exp:
            zw = max(zw, est_w(exp, 12))
        topo = min(g(px) for px in range(int(zx - zw / 2), int(zx + zw / 2) + 1, 8))
        bloco_h = S_ZONA * 1.25 + ((12 * 1.25 + 2) if exp else 0)
        y_nome = topo - bloco_h - 12
        els.append(text(0, y_nome, z["nome"], size=S_ZONA, color=acc, center_on=zx))
        if exp:
            els.append(text(0, y_nome + S_ZONA * 1.25 + 2, exp, size=12,
                            color=MUTE, center_on=zx))
    # segmentos abaixo da base — "explicacao" opcional (paridade com zonas; parcimônia)
    segs = v.get("segmentos", [])
    seg_h = 13 * 1.25
    for i, s in enumerate(segs):
        if isinstance(s, str):
            p, nome, exp = 0.05 + 0.9 * i / max(len(segs) - 1, 1), s, None
        else:
            p, nome, exp = s["pos"], s["nome"], s.get("explicacao")
        els.append(text(0, base_y + 16, nome, size=13, color=MUTE, center_on=X0 + p * R))
        if exp:
            eq = quebrar(exp, 11, 220)
            els.append(text(0, base_y + 16 + 13 * 1.25 + 2, eq, size=11, color=MUTE,
                            center_on=X0 + p * R))
            seg_h = max(seg_h, 13 * 1.25 + 2 + len(eq.split("\n")) * 11 * 1.25)
    return (base_y + 16 + seg_h + 8) - y


def vis_precipicio_ponte(els, v, x, y, w):
    """O precipício em tamanho de cena: penhascos + ponte + rótulos embaixo."""
    pw = min(v.get("largura", 720), w - 80)
    px = x + (w - pw) / 2
    h = pict_precipicio_ponte(els, px, y, pw, h=v.get("altura", 180),
                              tag=v.get("tag"), cor_ponte=v.get("cor_ponte", "dourado"))
    if v.get("legenda_ponte"):
        els.append(text(0, y + 4, v["legenda_ponte"], size=13,
                        color=cor_de(v.get("cor_ponte", "dourado"))[0],
                        center_on=px + pw / 2))
    yb = y + h + 12
    lh = 0
    for rot, cx_ in ((v.get("rotulo_esq"), px + pw * 0.20), (v.get("rotulo_dir"), px + pw * 0.80)):
        if rot:
            rq = quebrar(rot, 14, pw * 0.34)
            els.append(text(0, yb, rq, size=14, color=FG, center_on=cx_))
            lh = max(lh, len(rq.split("\n")) * 14 * 1.25)
    return h + 12 + lh


def vis_vinhetas(els, v, x, y, w):
    """N vinhetas lado a lado: pictograma + título colorido + 2 linhas de texto."""
    its = v["itens"]
    n = len(its)
    gap = 60
    cw_ = (w - (n - 1) * gap) / n
    PH = 170  # altura reservada pro pictograma
    alturas = []
    for i, it in enumerate(its):
        cell_x = x + i * (cw_ + gap)
        cx_ = cell_x + cw_ / 2
        cor = it.get("cor")
        p = it.get("pict", {})
        tipo = p.get("tipo")
        if tipo == "rua":
            pw = min(cw_ - 60, 300)
            ph = (pw / (4 * 1.35)) * 1.35
            pict_rua(els, cx_ - pw / 2, y + (PH - ph) / 2, pw, cor=cor)
        elif tipo == "tornado":
            s = min(cw_ - 120, 150)
            pict_tornado(els, cx_, y + (PH - s * 0.88) / 2, s, cor=cor)
        elif tipo == "botao":
            pict_botao(els, cx_, y + PH / 2, min(cw_ - 60, 280), p.get("label", ""), cor)
        elif tipo == "botao-tornado":
            s = min(cw_ - 160, 130)
            bt_cy = y + PH - 30
            pict_tornado(els, cx_, bt_cy - 23 - s * 0.88, s, cor=cor)
            pict_botao(els, cx_, bt_cy, min(cw_ - 40, 300), p.get("label", ""), cor)
        elif tipo == "ponte-mini":
            pw = min(cw_ - 40, 330)
            pict_precipicio_ponte(els, cx_ - pw / 2, y + (PH - 140) / 2, pw, h=140,
                                  tag=p.get("tag"), cor_ponte=p.get("cor_ponte", "dourado"))
        elif tipo == "onda-mini":
            pw = min(cw_ - 60, 300)
            pict_onda_mini(els, cx_ - pw / 2, y + (PH - 100) / 2, pw, h=100,
                           cor=cor, rasgo=p.get("rasgo", False))
        elif tipo:
            die(f"pictograma desconhecido '{tipo}' — use: rua, tornado, botao, "
                f"botao-tornado, ponte-mini, onda-mini")
        ty = y + PH + 14
        els.append(text(0, ty, it["titulo"], size=16, color=cor_de(cor)[0], center_on=cx_))
        ty += 16 * 1.25 + 8
        # hierarquia didática: primeiro O QUE É (definicao, acento), depois o status (texto)
        defq = quebrar("= " + it["definicao"], 13, cw_ - 8) if it.get("definicao") else ""
        if defq:
            els.append(text(0, ty, defq, size=13, color=cor_de(cor)[0], center_on=cx_))
            ty += len(defq.split("\n")) * 13 * 1.25 + 6
        txq = quebrar(it.get("texto", ""), 13, cw_ - 8) if it.get("texto") else ""
        if txq:
            els.append(text(0, ty, txq, size=13, color=cor_de(cor)[2], center_on=cx_))
            ty += len(txq.split("\n")) * 13 * 1.25
        alturas.append(ty - y)
    return max(alturas)


def vis_setas_tensao(els, v, x, y, w):
    bw = min(560, w - 220)
    bx = x + (w - bw) / 2
    return pict_setas_tensao(els, bx, y, bw, v.get("maior", ""), v.get("menor", ""),
                             v.get("nota"), v.get("cor_maior", "azul"),
                             v.get("cor_menor", "cinza"))


VISUAIS_HISTORIA = {
    "curva-abismo-mini": vis_curva_abismo_mini,
    "precipicio-ponte": vis_precipicio_ponte,
    "vinhetas": vis_vinhetas,
    "setas-tensao": vis_setas_tensao,
}


# ─────────────────────── arquétipo 0: historia (default pra nota rica) ───────
def layout_historia(spec, els, y0, ctx):
    """Atos empilhados: número grande + título + texto mínimo + UM visual central.
    Divisor sutil e respiro generoso entre atos — nada de empilhar estruturas."""
    M, W, CW = ctx["M"], ctx["W"], ctx["CW"]
    atos = spec.get("atos")
    if not atos:
        die("historia exige 'atos' (lista não-vazia)")
    y = y0 + 10
    for i, ato in enumerate(atos):
        if not ato.get("titulo"):
            die(f"ato {i + 1} sem 'titulo'")
        num_c = cor_de(ato["cor"])[0] if ato.get("cor") else CURVA
        r = 21
        els.append(base("ellipse", M, y, 2 * r, 2 * r, stroke=num_c, sw=2))
        els.append(text(0, y + r - 10, str(i + 1), size=16, color=num_c, center_on=M + r))
        els.append(text(M + 2 * r + 16, y + r - 13, ato["titulo"], size=21, color=FG))
        y += 2 * r + 14
        if ato.get("texto"):
            tq = quebrar(ato["texto"], 14, min(CW - 2 * r - 16, 980))
            els.append(text(M + 2 * r + 16, y, tq, size=14, color=MUTE))
            y += len(tq.split("\n")) * 14 * 1.25 + 8
        v = ato.get("visual")
        if v:
            if v.get("tipo") not in VISUAIS_HISTORIA:
                die(f"visual desconhecido '{v.get('tipo')}' — use: "
                    f"{', '.join(VISUAIS_HISTORIA)}")
            y += 18
            y += VISUAIS_HISTORIA[v["tipo"]](els, v, M, y, CW)
        if i < len(atos) - 1:
            y += 46
            els.append(linha(M, y, W - M, y, color=DIVISOR, sw=1))
            y += 46
        else:
            y += 34
    return y


LAYOUTS = {
    "historia": layout_historia,
    "pipeline": layout_pipeline,
    "curva-com-abismo": layout_curva_abismo,
    "matriz-2x2": layout_matriz_2x2,
    "funil": layout_funil,
    "piramide": layout_piramide,
    "ciclo": layout_ciclo,
    "anatomia": layout_anatomia,
    "contraste": layout_contraste,
}


# ─────────────────────── validações de conteúdo (regras da casa) ─────────────
RE_MINUTAGEM = re.compile(r"@\s*\d{1,2}:\d{2}")


def validar_spec(spec):
    if spec.get("arquetipo") not in LAYOUTS:
        die(f"arquetipo '{spec.get('arquetipo')}' desconhecido — use: {', '.join(LAYOUTS)}")
    if not spec.get("titulo"):
        die("spec sem 'titulo'")
    if not spec.get("proveniencia"):
        die("spec sem 'proveniencia' — todo canvas carrega o rodapé de provenância (regra do vault)")
    fm = spec.get("frontmatter", {})
    for k in ("fonte", "tema", "criado"):
        if not fm.get(k):
            die(f"frontmatter sem '{k}' — frontmatter YAML completo é obrigatório (CLAUDE.md do vault)")
    # minutagem NUNCA dentro de cards/itens (só banner de citação e rodapé)
    conteudo = {k: v for k, v in spec.items() if k not in ("citacao", "proveniencia")}
    if RE_MINUTAGEM.search(json.dumps(conteudo, ensure_ascii=False)):
        die("minutagem '@ MM:SS' encontrada DENTRO de card/item — minutagem só no banner "
            "de citação (citacao.ref) e no rodapé (proveniencia). Decisão calibrada, não reabrir.")


# ─────────────────────── checagem de colisão (texto × texto) ─────────────────
def colisoes_linha_texto(elements):
    """Linha/seta cruzando texto (calibração 10/07: "mais cuidado pra não ter linhas
    cruzando textos"). Caminha os segmentos dos `points` em passos de ~6px e testa
    cada ponto contra o bbox de cada texto (margem 2px). Textos `_sobre_shape`
    (parte de pictograma) são exceção legítima — o check pula esses."""
    ts = [e for e in elements if e["type"] == "text" and not e.get("_sobre_shape")]
    pares = []
    for e in elements:
        if e["type"] not in ("line", "arrow"):
            continue
        pts = e.get("points") or []
        ex, ey = e["x"], e["y"]
        atingidos = set()
        for (p1, p2) in zip(pts, pts[1:]):
            x1, y1 = ex + p1[0], ey + p1[1]
            x2, y2 = ex + p2[0], ey + p2[1]
            n = max(int(math.hypot(x2 - x1, y2 - y1) / 6), 1)
            for k in range(n + 1):
                f = k / n
                px, py = x1 + (x2 - x1) * f, y1 + (y2 - y1) * f
                for t in ts:
                    if id(t) in atingidos:
                        continue
                    if (t["x"] - 2 <= px <= t["x"] + t["width"] + 2 and
                            t["y"] - 2 <= py <= t["y"] + t["height"] + 2):
                        atingidos.add(id(t))
                        pares.append((f"{e['type']}@({e['x']:.0f},{e['y']:.0f})",
                                      t["text"].split("\n")[0][:40]))
    return pares


def colisoes_texto(elements):
    ts = [e for e in elements if e["type"] == "text"]
    pares = []
    for i in range(len(ts)):
        for j in range(i + 1, len(ts)):
            a, b = ts[i], ts[j]
            ax1, ay1, ax2, ay2 = a["x"], a["y"], a["x"] + a["width"], a["y"] + a["height"]
            bx1, by1, bx2, by2 = b["x"], b["y"], b["x"] + b["width"], b["y"] + b["height"]
            if ax1 < bx2 - 2 and bx1 < ax2 - 2 and ay1 < by2 - 2 and by1 < ay2 - 2:
                pares.append((a["text"].split("\n")[0][:40], b["text"].split("\n")[0][:40]))
    return pares


# ─────────────────────── montagem do .excalidraw.md ──────────────────────────
def montar_md(spec, elements):
    fm = spec["frontmatter"]
    pode = "true" if fm.get("pode-ir-comunidade", False) else "false"
    linhas_fm = [
        "---",
        "excalidraw-plugin: parsed",
        f"tipo: {fm.get('tipo', 'destilado')}",
        f"fonte: {fm['fonte']}",
        f"tema: {fm['tema']}",
        f"pode-ir-comunidade: {pode}",
        f"criado: {fm['criado']}",
    ]
    if fm.get("origem"):
        linhas_fm.append(f'origem: "{fm["origem"]}"')
    linhas_fm += ["tags: [excalidraw]", "---"]

    drawing = {
        "type": "excalidraw", "version": 2,
        "source": "https://github.com/zsviczian/obsidian-excalidraw-plugin",
        # flags internas (prefixo "_") ficam fora do arquivo — não são do esquema Excalidraw
        "elements": [{k: v for k, v in e.items() if not k.startswith("_")} for e in elements],
        "appState": {"gridSize": None, "viewBackgroundColor": BG},
        "files": {},
    }
    te = [f"{el['text']} ^{el['id'][:8]}" for el in elements
          if el["type"] == "text" and el["text"].strip()]

    return "\n".join(linhas_fm) + f"""
==⚠  Switch to EXCALIDRAW VIEW in the MORE OPTIONS menu of this document. ⚠==

# Text Elements
{chr(10).join(te)}

# Drawing
```json
{json.dumps(drawing, ensure_ascii=False)}
```
%%
"""


def gerar(spec):
    _counter[0] = 0
    validar_spec(spec)
    set_estilo(spec.get("estilo", "clean"))
    W = spec.get("largura", 1570)
    ctx = {"M": 70, "W": W, "CW": W - 140}
    els = []
    y = cabecalho(spec, els, ctx)
    y = LAYOUTS[spec["arquetipo"]](spec, els, y, ctx)
    y = banner_citacao(spec, els, y, ctx)   # clímax
    y = bloco_takeaway(spec, els, y, ctx)   # ação (fechamento)
    rodape(spec, els, y, ctx)
    return els


def main():
    if len(sys.argv) < 2:
        die("uso: python3 gerar_excalidraw.py spec.json [saida.excalidraw.md]")
    spec_path = sys.argv[1]
    with open(spec_path, encoding="utf-8") as f:
        spec = json.load(f)
    out = sys.argv[2] if len(sys.argv) > 2 else re.sub(r"\.json$", "", spec_path) + ".excalidraw.md"

    elements = gerar(spec)
    md = montar_md(spec, elements)
    with open(out, "w", encoding="utf-8") as f:
        f.write(md)

    # validação 1: o JSON emitido parseia de volta
    bloco = open(out, encoding="utf-8").read().split("```json")[1].split("```")[0]
    json.loads(bloco)

    # validação 2: nenhum par de textos com bounding boxes sobrepostos
    pares_tt = colisoes_texto(elements)
    pares_lt = colisoes_linha_texto(elements)
    n_txt = sum(1 for e in elements if e["type"] == "text")
    if pares_tt or pares_lt:
        if pares_tt:
            print(f"✗ {len(pares_tt)} colisão(ões) texto×texto:", file=sys.stderr)
            for a, b in pares_tt:
                print(f"   · '{a}'  ×  '{b}'", file=sys.stderr)
        if pares_lt:
            print(f"✗ {len(pares_lt)} colisão(ões) linha×texto:", file=sys.stderr)
            for a, b in pares_lt:
                print(f"   · {a}  ×  '{b}'", file=sys.stderr)
        sys.exit(2)
    print(f"✓ {out}")
    print(f"✓ {len(elements)} elementos ({n_txt} textos) · JSON válido · "
          f"colisões texto×texto: 0 · linha×texto: 0 · "
          f"arquétipo: {spec['arquetipo']} · dark+{spec.get('estilo', 'clean')}")


if __name__ == "__main__":
    main()
