#!/usr/bin/env bash
# Roda no início da sessão (hook). Avisa se há versão nova do motor.
# Silencioso e rápido: nunca trava a abertura do cérebro.
set -uo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
# shellcheck disable=SC1091
source "$ROOT/.cerebro/source" 2>/dev/null || exit 0

LOCAL="$(cat "$ROOT/VERSION" 2>/dev/null || echo '0.0.0')"
REMOTE="$(curl -fsSL --max-time 3 "https://raw.githubusercontent.com/$REPO/$BRANCH/VERSION" 2>/dev/null | tr -d '[:space:]')"

if [ -n "$REMOTE" ] && [ "$REMOTE" != "$LOCAL" ]; then
  echo "ATUALIZACAO_DISPONIVEL: saiu a versão $REMOTE do cérebro (você está na $LOCAL). Ofereça rodar /atualizar."
fi
exit 0
