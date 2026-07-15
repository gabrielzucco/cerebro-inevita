#!/usr/bin/env bash
# Telemetria ANÔNIMA de uso do cérebro — um ping por marco (sessão, /comecar, /teste…).
# O que sai daqui: um id aleatório desta instalação + o nome do evento + versão + SO.
# NUNCA sai: teu contexto, teus arquivos, teu nome, teu e-mail. Nada do conteúdo.
# Desligar: crie um arquivo .cerebro/sem-telemetria  (ou export CEREBRO_TELEMETRY=off)
set -uo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
EVENT="${1:-sessao}"

# opt-out — respeitado antes de qualquer coisa
[ "${CEREBRO_TELEMETRY:-}" = "off" ] && exit 0
[ -f "$ROOT/.cerebro/sem-telemetria" ] && exit 0

# id anônimo da instalação (gerado uma vez, fica só na tua máquina — está no .gitignore)
ID_FILE="$ROOT/.cerebro/id"
if [ ! -f "$ID_FILE" ]; then
  (uuidgen 2>/dev/null || cat /proc/sys/kernel/random/uuid 2>/dev/null) \
    | tr '[:upper:]' '[:lower:]' > "$ID_FILE" || exit 0
  # primeira sessão desta instalação = o marco "instalou"
  [ "$EVENT" = "sessao" ] && EVENT="instalou"
fi
INSTALL_ID="$(cat "$ID_FILE" 2>/dev/null | tr -d '[:space:]')"
[ -z "$INSTALL_ID" ] && exit 0

VERSION="$(cat "$ROOT/VERSION" 2>/dev/null | tr -d '[:space:]')"
OS="$(uname -s 2>/dev/null || echo '?')"

# e-mail de resgate (opcional, informado pela própria pessoa no /comecar ou no
# prompt instalador) — liga esta instalação ao acesso dela. Fica só na tua máquina.
EMAIL="$(cat "$ROOT/.cerebro/acesso-email" 2>/dev/null | tr -d '[:space:]' | tr '[:upper:]' '[:lower:]')"
EMAIL_JSON=""
case "$EMAIL" in
  *@*.*) EMAIL_JSON=",\"email\":\"$EMAIL\"" ;;
esac

# silencioso e rápido por desenho: 2s de timeout, falha nunca aparece pra ninguém
curl -fsS --max-time 2 -o /dev/null \
  -X POST "https://peegicizxybjgvuutegc.supabase.co/functions/v1/cerebro-ping" \
  -H "Content-Type: application/json" \
  -d "{\"install_id\":\"$INSTALL_ID\",\"event\":\"$EVENT\",\"version\":\"$VERSION\",\"os\":\"$OS\"$EMAIL_JSON}" \
  2>/dev/null &
exit 0
