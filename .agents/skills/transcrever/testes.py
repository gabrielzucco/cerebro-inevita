#!/usr/bin/env python3
"""Testes das regras de fatiamento e costura. Rodam em milissegundos, sem rede e sem mídia.

    python3 testes.py        (ou: python3 transcrever.py --teste)

Só existe teste aqui do que pode corromper a transcrição em silêncio: fatia que deixa
buraco, offset somado errado, palavra reordenada. Erro de rede aparece na hora; timestamp
deslocado só aparece quando o corte de vídeo sai fora de sincronia, semanas depois.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import transcrever as t                                       # noqa: E402

CASOS = []


def caso(fn):
    CASOS.append(fn)
    return fn


def eq(obtido, esperado, msg=""):
    if obtido != esperado:
        raise AssertionError(f"{msg}\n    obtido:   {obtido!r}\n    esperado: {esperado!r}")


def ok(cond, msg):
    if not cond:
        raise AssertionError(msg)


# ─────────────────────────── fatiamento ───────────────────────────

@caso
def t_curto_nao_fatia():
    eq(t.pontos_de_corte(600, [], 6000), [(0.0, 600)], "áudio curto sai inteiro")


@caso
def t_cobre_tudo_sem_buraco():
    """O erro que corrompe em silêncio: fatias que não se encostam perdem fala."""
    dur, lim = 10000.0, 3000.0
    fatias = t.pontos_de_corte(dur, [], lim)
    eq(fatias[0][0], 0.0, "primeira fatia começa em 0")
    eq(fatias[-1][1], dur, "última fatia termina no fim do áudio")
    for (_, fim_a), (ini_b, _) in zip(fatias, fatias[1:]):
        eq(fim_a, ini_b, "fatia seguinte tem que começar exatamente onde a anterior acabou")


@caso
def t_respeita_o_limite():
    dur, lim = 10000.0, 3000.0
    for a, b in t.pontos_de_corte(dur, [], lim):
        ok(b - a <= lim + 0.001, f"fatia de {b - a:.0f}s passa do limite de {lim:.0f}s")


@caso
def t_corta_no_silencio_quando_existe():
    """Cortar em ponto fixo parte palavra ao meio; havendo silêncio perto, usa ele."""
    fatias = t.pontos_de_corte(5000.0, [2890.0, 2950.0], 3000.0)
    eq(fatias[0][1], 2950.0, "deveria cortar no silêncio mais próximo do alvo")


@caso
def t_ignora_silencio_cedo_demais():
    """Silêncio no começo da fatia faria fatias minúsculas e muitas chamadas de API."""
    fatias = t.pontos_de_corte(5000.0, [100.0, 200.0], 3000.0)
    eq(fatias[0][1], 3000.0, "silêncio antes da metade da fatia é ignorado; corta no alvo")


@caso
def t_sem_silencio_corta_no_alvo():
    fatias = t.pontos_de_corte(7000.0, [], 3000.0)
    eq([f[1] for f in fatias], [3000.0, 6000.0, 7000.0], "sem silêncio, corta no alvo")


@caso
def t_duracao_por_fatia_cabe_no_limite():
    s = t.duracao_max_por_fatia(24, 32)
    mb = s * 32 * 1000 / 8 / 1048576
    ok(mb <= 24.01, f"{s}s a 32kbps dá {mb:.1f}MB, acima do limite declarado")
    ok(s > 3000, f"limite de {s}s é curto demais — fatiaria à toa")


# ─────────────────────────── costura ───────────────────────────

def _resp(palavras, segs=None):
    return {"words": [{"word": w, "start": a, "end": b} for w, a, b in palavras],
            "segments": [{"start": a, "end": b, "text": txt} for a, b, txt in (segs or [])],
            "text": " ".join(w for w, _, _ in palavras)}


@caso
def t_costura_soma_offset():
    """O bug clássico: a segunda fatia volta com timestamp começando do zero."""
    r1 = _resp([("um", 0.0, 0.4), ("dois", 0.5, 0.9)])
    r2 = _resp([("três", 0.1, 0.5), ("quatro", 0.6, 1.0)])
    d = t.costurar([r1, r2], [0.0, 100.0])
    eq([w["word"] for w in d["words"]], ["um", "dois", "três", "quatro"])
    eq(d["words"][2]["start"], 100.1, "a palavra da 2ª fatia tem que levar o offset")
    eq(d["words"][3]["end"], 101.0, "fim também leva o offset")


@caso
def t_costura_preserva_ordem_das_fatias():
    """NUNCA ordenar por timestamp: jitter de ms em fala rápida embaralha a legenda."""
    r1 = _resp([("primeira", 0.0, 0.5)])
    r2 = _resp([("segunda", 0.0, 0.5)])
    d = t.costurar([r1, r2], [0.0, 60.0])
    eq([w["word"] for w in d["words"]], ["primeira", "segunda"],
       "ordem tem que ser a das fatias")


@caso
def t_costura_monotonica():
    d = t.costurar([_resp([("a", 0.0, 1.0), ("b", 1.0, 2.0)]),
                    _resp([("c", 0.0, 1.0), ("d", 1.0, 2.0)])], [0.0, 50.0])
    ts = [w["start"] for w in d["words"]]
    eq(ts, sorted(ts), f"timestamps saíram fora de ordem: {ts}")


@caso
def t_costura_segmentos_tambem():
    d = t.costurar([_resp([], [(0.0, 5.0, "bloco um")]),
                    _resp([], [(0.0, 5.0, "bloco dois")])], [0.0, 200.0])
    eq([s["start"] for s in d["segments"]], [0.0, 200.0], "segmento também leva offset")
    eq(d["segments"][1]["text"], "bloco dois")


@caso
def t_costura_uma_fatia_nao_altera():
    r = _resp([("só", 1.5, 2.0)])
    d = t.costurar([r], [0.0])
    eq(d["words"][0]["start"], 1.5, "fatia única não pode deslocar nada")


@caso
def t_costura_recusa_desalinhamento():
    """Respostas e offsets fora de par significam fatia perdida — falhar alto."""
    try:
        t.costurar([_resp([("x", 0, 1)])], [0.0, 10.0])
    except ValueError:
        return
    raise AssertionError("aceitou 1 resposta para 2 offsets — deveria recusar")


@caso
def t_costura_aguenta_resposta_vazia():
    d = t.costurar([{"text": ""}, _resp([("oi", 0.0, 0.3)])], [0.0, 10.0])
    eq([w["word"] for w in d["words"]], ["oi"], "fatia sem fala não pode quebrar a costura")


# ─────────────────────────── markdown ───────────────────────────

@caso
def t_markdown_marca_fronteira():
    md = t.markdown(t.costurar([_resp([], [(0.0, 3.0, "olá")])], [0.0]),
                    "teste", "/tmp/v.mp4", "pt", "2026-08-12")
    ok("pode-ir-comunidade: false" in md, "transcrição crua tem que nascer fechada")
    ok("tipo: transcricao" in md, "falta o tipo no frontmatter")
    ok("**[0:00:00]** olá" in md, f"bloco com timestamp não saiu:\n{md}")


@caso
def t_hhmmss():
    eq(t.hhmmss(0), "0:00:00")
    eq(t.hhmmss(61), "0:01:01")
    eq(t.hhmmss(3661), "1:01:01")
    eq(t.hhmmss(10000), "2:46:40")


def main():
    bons, ruins = 0, []
    for fn in CASOS:
        try:
            fn()
            bons += 1
        except AssertionError as e:
            ruins.append((fn.__name__, str(e)))
        except Exception as e:                                # noqa: BLE001
            ruins.append((fn.__name__, f"{type(e).__name__}: {e}"))
    print(f"\ntranscrever — {bons} passou · {len(ruins)} falhou")
    for n, e in ruins:
        print(f"  ✗ {n}: {e}")
    return 1 if ruins else 0


if __name__ == "__main__":
    sys.exit(main())
