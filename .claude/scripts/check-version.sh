#!/usr/bin/env bash
# Roda no início da sessão (hook). Se há versão nova do MOTOR, atualiza AUTOMATICAMENTE
# e conta o que mudou. Nunca toca o contexto (meu-negocio/capturas/privado). Silencioso se offline.
set -uo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
# shellcheck disable=SC1091
source "$ROOT/.cerebro/source" 2>/dev/null || exit 0

LOCAL="$(cat "$ROOT/VERSION" 2>/dev/null || echo '0.0.0')"
REMOTE="$(curl -fsSL --max-time 3 "https://raw.githubusercontent.com/$REPO/$BRANCH/VERSION" 2>/dev/null | tr -d '[:space:]')"

if [ -n "$REMOTE" ] && [ "$REMOTE" != "$LOCAL" ]; then
  echo "🧠 Saiu a versão $REMOTE do cérebro (você está na $LOCAL). Atualizando o motor — teu contexto não é tocado…"
  bash "$ROOT/.claude/scripts/update.sh" 2>&1 | sed 's/^/  /'
  echo "  Veja o que mudou em CHANGELOG.md."
fi
exit 0
