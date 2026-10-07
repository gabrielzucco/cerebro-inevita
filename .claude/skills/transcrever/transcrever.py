#!/usr/bin/env python3
"""Transcreve áudio/vídeo em DUAS granularidades numa chamada só.

    python3 transcrever.py <arquivo|pasta> [--saida DIR] [--idioma pt]
    python3 transcrever.py --doctor
    python3 transcrever.py --teste           # testes das regras (sem rede)

Duas saídas, dois consumidores:
  <nome>.md          blocos [MM:SS] + frontmatter — é o que humano e IA LEEM
                     (vira átomo por /guardar, decisão por /call)
  <nome>.words.json  timestamp de PALAVRA — insumo de MÁQUINA
                     (a esteira de cortes usa; NUNCA leia no contexto: 2h passa de
                      200 mil tokens e não cabe em janela nenhuma)

Por que as duas de uma vez: a API devolve `word` e `segment` na mesma resposta. Pedir só
bloco obriga a re-transcrever depois quando alguém quiser cortar vídeo — e transcrição
diferente dá timestamp diferente, então os cortes não batem com o que foi destilado.

Arquivo longo é FATIADO: a API tem limite de tamanho, e um podcast de 2h passa dele. O
corte é feito no SILÊNCIO mais próximo do alvo (não em ponto fixo, que parte palavra ao
meio) e os timestamps de cada fatia são somados ao offset dela.

⚠️ Regra dura da costura: as palavras são concatenadas na ORDEM DAS FATIAS, nunca
ordenadas por timestamp. Jitter de milissegundo em fala rápida embaralha a legenda se
alguém ordenar.

Requer: ffmpeg, ffprobe e uma chave da API (GROQ_API_KEY no ambiente ou ~/.config/groq/key).
"""
import json
import os
import re
import subprocess
import sys

LIMITE_MB = 24            # a API corta em 25MB; folga pra não raspar o teto
BITRATE_KBPS = 32         # mono 16kHz — suficiente pra fala, leve pra subir
API = "https://api.groq.com/openai/v1/audio/transcriptions"
MODELO = "whisper-large-v3"
EXTS = (".mp4", ".mov", ".m4v", ".mkv", ".avi", ".webm",
        ".mp3", ".m4a", ".wav", ".aac", ".ogg", ".flac")


# ───────────────────────── regras puras (testáveis sem rede) ─────────────────────────

def duracao_max_por_fatia(limite_mb=LIMITE_MB, bitrate_kbps=BITRATE_KBPS):
    """quantos segundos de áudio cabem no limite de upload"""
    return int(limite_mb * 1024 * 1024 * 8 / (bitrate_kbps * 1000))


def pontos_de_corte(duracao, silencios, limite_s):
    """Onde fatiar um áudio de `duracao` segundos.

    `silencios` são instantes (s) de silêncio detectados. Cada fatia tem que caber em
    `limite_s`; dentro disso, o corte procura o silêncio mais próximo do alvo pra não
    partir palavra ao meio. Sem silêncio utilizável, corta no alvo mesmo.

    Devolve [(inicio, fim), ...] cobrindo [0, duracao] sem buraco e sem sobreposição.
    """
    if duracao <= limite_s:
        return [(0.0, duracao)]
    fatias, inicio = [], 0.0
    while duracao - inicio > limite_s:
        alvo = inicio + limite_s
        # janela de busca: os últimos 20% da fatia, nunca antes da metade dela
        piso = max(inicio + limite_s * 0.5, alvo - limite_s * 0.2)
        cands = [s for s in silencios if piso <= s <= alvo]
        corte = max(cands) if cands else alvo
        fatias.append((inicio, corte))
        inicio = corte
    fatias.append((inicio, duracao))
    return fatias


def costurar(respostas, offsets):
    """Junta as respostas das fatias numa transcrição única.

    `respostas` são os JSON da API, na ORDEM DAS FATIAS. `offsets` é o início (s) de cada
    fatia no arquivo original. Soma o offset em cada timestamp e concatena preservando a
    ordem — nunca reordena (jitter de ms embaralharia a legenda).
    """
    if len(respostas) != len(offsets):
        raise ValueError(f"{len(respostas)} respostas para {len(offsets)} offsets")
    words, segments, textos = [], [], []
    for resp, off in zip(respostas, offsets):
        for w in resp.get("words") or []:
            words.append({"word": w["word"],
                          "start": round(float(w["start"]) + off, 3),
                          "end": round(float(w["end"]) + off, 3)})
        for s in resp.get("segments") or []:
            segments.append({"start": round(float(s["start"]) + off, 3),
                             "end": round(float(s["end"]) + off, 3),
                             "text": s.get("text", "").strip()})
        t = (resp.get("text") or "").strip()
        if t:
            textos.append(t)
    return {"words": words, "segments": segments, "text": " ".join(textos)}


def hhmmss(s):
    s = int(s)
    return f"{s // 3600}:{(s % 3600) // 60:02d}:{s % 60:02d}"


def markdown(dados, nome, origem, idioma, hoje):
    """A vista LEGÍVEL: blocos com timestamp, no schema de nota do cérebro.

    `pode-ir-comunidade: false` é regra dura — transcrição crua nunca sai daqui, e o que
    for destilado dela sai anonimizado.
    """
    linhas = [
        "---", "tipo: transcricao", "fonte: call", "tema: <preencher>",
        "pode-ir-comunidade: false", f"criado: {hoje}", "status: bruto",
        f"idioma: {idioma}", f"modelo: {MODELO}", "---", "",
        f"# {nome}", "",
        f"> Transcrição bruta de `{os.path.basename(origem)}`. Timestamps são do arquivo",
        f"> original. Palavra-a-palavra em `{nome}.words.json` (insumo de máquina).", "",
        "> ⚠️ Pode conter nome de participante. Crua é sempre `pode-ir-comunidade: false`;",
        "> o que sai daqui sai destilado e anonimizado.", "",
    ]
    for seg in dados["segments"]:
        txt = seg["text"].strip()
        if txt:
            linhas.append(f"**[{hhmmss(seg['start'])}]** {txt}")
            linhas.append("")
    if not dados["segments"] and dados["text"]:
        linhas += [dados["text"], ""]
    return "\n".join(linhas)


# ───────────────────────────────── execução ─────────────────────────────────

def chave():
    k = os.environ.get("GROQ_API_KEY", "").strip()
    if k:
        return k
    f = os.path.expanduser("~/.config/groq/key")
    return open(f).read().strip() if os.path.exists(f) else None


def sh(args, **kw):
    return subprocess.run(args, capture_output=True, text=True, **kw)


def duracao_de(caminho):
    r = sh(["ffprobe", "-v", "error", "-show_entries", "format=duration",
            "-of", "csv=p=0", caminho])
    try:
        return float(r.stdout.strip())
    except ValueError:
        raise SystemExit(f"não consegui ler a duração de {caminho} — o arquivo é mídia válida?")


def silencios_de(caminho):
    """instantes de silêncio, pra cortar sem partir palavra"""
    r = sh(["ffmpeg", "-nostdin", "-i", caminho, "-af",
            "silencedetect=noise=-32dB:d=0.4", "-f", "null", "-"])
    return sorted(float(m) for m in re.findall(r"silence_start: ([0-9.]+)", r.stderr))


def extrair_audio(origem, destino, inicio=None, fim=None):
    args = ["ffmpeg", "-nostdin", "-y", "-v", "error"]
    if inicio is not None:
        args += ["-ss", f"{inicio:.3f}"]
    args += ["-i", origem]
    if fim is not None and inicio is not None:
        args += ["-t", f"{fim - inicio:.3f}"]
    args += ["-vn", "-ac", "1", "-ar", "16000", "-b:a", f"{BITRATE_KBPS}k", destino]
    r = sh(args)
    if r.returncode != 0 or not os.path.exists(destino):
        raise SystemExit(f"ffmpeg falhou ao extrair áudio de {os.path.basename(origem)}:\n"
                         f"{r.stderr[-600:]}")
    return destino


def transcrever_fatia(mp3, key, idioma):
    r = sh(["curl", "-s", "--max-time", "600", API,
            "-H", f"Authorization: Bearer {key}",
            "-F", f"model={MODELO}",
            "-F", "response_format=verbose_json",
            "-F", "temperature=0",
            "-F", f"language={idioma}",
            "-F", "timestamp_granularities[]=word",
            "-F", "timestamp_granularities[]=segment",
            "-F", f"file=@{mp3}"])
    try:
        d = json.loads(r.stdout)
    except json.JSONDecodeError:
        raise SystemExit(f"a API não devolveu JSON:\n{r.stdout[:400]}")
    if "error" in d:
        raise SystemExit(f"a API recusou: {d['error'].get('message', d['error'])}")
    return d


def transcrever(origem, saida_dir, idioma, key, hoje):
    import tempfile
    nome = os.path.splitext(os.path.basename(origem))[0]
    dur = duracao_de(origem)
    limite = duracao_max_por_fatia()
    tmp = tempfile.mkdtemp(prefix="transcrever_")

    fatias = [(0.0, dur)]
    if dur > limite:
        print(f"  {dur / 60:.0f}min passa do limite de upload — procurando silêncio pra fatiar")
        fatias = pontos_de_corte(dur, silencios_de(origem), limite)
        print(f"  {len(fatias)} fatias: " +
              ", ".join(f"{hhmmss(a)}–{hhmmss(b)}" for a, b in fatias))

    respostas, offsets = [], []
    for i, (a, b) in enumerate(fatias):
        mp3 = os.path.join(tmp, f"f{i:02d}.mp3")
        extrair_audio(origem, mp3, a, b) if len(fatias) > 1 else extrair_audio(origem, mp3)
        mb = os.path.getsize(mp3) / 1048576
        if mb > 25:
            raise SystemExit(f"fatia {i} ficou com {mb:.1f}MB, acima do limite da API — "
                             f"reduza LIMITE_MB no topo do script e rode de novo")
        print(f"  fatia {i + 1}/{len(fatias)} ({mb:.1f}MB) → transcrevendo…")
        respostas.append(transcrever_fatia(mp3, key, idioma))
        offsets.append(a)

    dados = costurar(respostas, offsets)
    os.makedirs(saida_dir, exist_ok=True)
    pw = os.path.join(saida_dir, f"{nome}.words.json")
    with open(pw, "w", encoding="utf-8") as f:
        json.dump({"words": dados["words"], "segments": dados["segments"]},
                  f, ensure_ascii=False)
    pm = os.path.join(saida_dir, f"{nome}.md")
    idi = respostas[0].get("language", idioma) if respostas else idioma
    with open(pm, "w", encoding="utf-8") as f:
        f.write(markdown(dados, nome, origem, idi, hoje))
    print(f"  ✓ {os.path.basename(pm)} ({len(dados['segments'])} blocos) + "
          f"{os.path.basename(pw)} ({len(dados['words'])} palavras)")
    return pm, pw


def doctor():
    print("\nDOCTOR — transcrever\n" + "=" * 46)
    faltou = []
    for b in ("ffmpeg", "ffprobe", "curl"):
        r = sh([b, "-version"])
        if r.returncode == 0:
            print(f"  ✓ {b}")
        else:
            print(f"  ✗ {b} ausente")
            faltou.append(b)
    if chave():
        print("  ✓ chave da API encontrada")
    else:
        print("  ✗ sem chave — export GROQ_API_KEY=... (grátis em console.groq.com)")
        faltou.append("chave")
    print("=" * 46)
    if faltou:
        print(f"faltam: {', '.join(faltou)}\n")
        print("  ffmpeg/curl:  macOS `brew install ffmpeg curl` · "
              "Linux `sudo apt install ffmpeg curl` · Windows `winget install Gyan.FFmpeg`")
        return 1
    print("tudo pronto\n")
    return 0


def main():
    args = sys.argv[1:]
    if not args or args[0] in ("-h", "--help"):
        raise SystemExit(__doc__)
    if args[0] == "--doctor":
        return doctor()
    if args[0] == "--teste":
        import testes
        return testes.main()

    alvo = args[0]
    saida = args[args.index("--saida") + 1] if "--saida" in args else None
    idioma = args[args.index("--idioma") + 1] if "--idioma" in args else "pt"

    key = chave()
    if not key:
        raise SystemExit("sem chave da API. `export GROQ_API_KEY=...` "
                         "(grátis em console.groq.com) ou grave em ~/.config/groq/key.\n"
                         "Rode --doctor pra conferir o resto.")
    if not os.path.exists(alvo):
        raise SystemExit(f"'{alvo}' não existe.")

    if os.path.isdir(alvo):
        arquivos = sorted(os.path.join(alvo, f) for f in os.listdir(alvo)
                          if f.lower().endswith(EXTS))
        if not arquivos:
            raise SystemExit(f"nenhuma mídia em '{alvo}' (procurei {', '.join(EXTS)})")
    else:
        arquivos = [alvo]

    from datetime import date
    hoje = date.today().isoformat()
    destino = saida or (alvo if os.path.isdir(alvo) else os.path.dirname(os.path.abspath(alvo)))
    print(f"transcrevendo {len(arquivos)} arquivo(s) → {destino}")
    falhas = []
    for f in arquivos:
        print(f"\n· {os.path.basename(f)}")
        try:
            transcrever(f, destino, idioma, key, hoje)
        except SystemExit as e:
            print(f"  ✗ {e}")
            falhas.append(os.path.basename(f))
    if falhas:
        print(f"\n{len(falhas)} falhou: {', '.join(falhas)}")
        return 1
    print("\nOnde cada saída vai:")
    print("  .md          → /guardar (átomo) ou /call (decisões). É o que se LÊ.")
    print("  .words.json  → esteira de cortes. NÃO leia no contexto.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
