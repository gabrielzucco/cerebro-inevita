#!/usr/bin/env bash
# Atualiza o MOTOR do cérebro (skills, gabaritos, Vale) para a última versão.
# NUNCA toca contexto, operação, feedback, conexões locais ou contribuições do dono.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
# shellcheck disable=SC1091
source "$ROOT/.cerebro/source" 2>/dev/null || { echo "✗ Fonte de atualização não configurada em .cerebro/source"; exit 1; }

TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT

if [ -n "${CEREBRO_UPDATE_SOURCE_DIR:-}" ]; then
  # Somente QA local: permite testar o contrato com um pacote já extraído.
  SRC="$(cd "$CEREBRO_UPDATE_SOURCE_DIR" && pwd)"
  echo "→ Validando atualização local ($SRC)…"
else
  echo "→ Baixando a última versão do motor ($REPO@$BRANCH)…"
  if ! curl -fsSL --max-time 30 "https://github.com/$REPO/archive/refs/heads/$BRANCH.tar.gz" -o "$TMP/motor.tar.gz"; then
    echo "✗ Não consegui baixar. Confere a conexão (e o repo em .cerebro/source)."
    echo "  Teu contexto está intacto — nada foi alterado."
    exit 1
  fi
  tar -xzf "$TMP/motor.tar.gz" -C "$TMP"
  SRC="$(find "$TMP" -mindepth 1 -maxdepth 1 -type d | head -1)"
fi
[ -n "$SRC" ] || { echo "✗ Pacote vazio. Nada alterado."; exit 1; }

MANIFEST="$SRC/.cerebro/motor.manifest"
[ -f "$MANIFEST" ] || { echo "✗ Manifesto do motor não veio no pacote. Nada alterado."; exit 1; }

OLD="$(cat "$ROOT/VERSION" 2>/dev/null || echo '?')"
NEW="$(cat "$SRC/VERSION" 2>/dev/null || echo '?')"
echo "→ Atualizando $OLD → $NEW. Teu contexto, operação e contribuições NÃO serão tocados."

while IFS= read -r item; do
  [ -z "$item" ] && continue
  case "$item" in \#*) continue ;; esac
  # trava de segurança: jamais sobrescreve o que é do dono
  case "$item" in
    meu-negocio*|capturas*|privado*|operacao*|sistemas/*/feedback.md|sistemas/outros-instalados*|conexoes/configuradas*|comunidade/minhas-contribuicoes*)
      echo "  (ignorando $item — é teu)"; continue ;;
  esac
  if [ -e "$SRC/$item" ]; then
    rm -rf "$ROOT/$item"
    mkdir -p "$(dirname "$ROOT/$item")"
    cp -R "$SRC/$item" "$ROOT/$item"
    echo "  ✓ $item"
  fi
done < "$MANIFEST"

# Seeds criam a nova estrutura para quem já tinha o cérebro, mas SOMENTE quando
# o caminho ainda não existe. Depois de criado, pertence ao dono para sempre.
SEED_MANIFEST="$SRC/.cerebro/seed.manifest"
if [ -f "$SEED_MANIFEST" ]; then
  while IFS= read -r item; do
    [ -z "$item" ] && continue
    case "$item" in \#*) continue ;; esac
    if [ ! -e "$ROOT/$item" ] && [ -e "$SRC/$item" ]; then
      mkdir -p "$(dirname "$ROOT/$item")"
      cp -R "$SRC/$item" "$ROOT/$item"
      echo "  + $item (estrutura inicial; agora é teu)"
    fi
  done < "$SEED_MANIFEST"
fi

echo "✓ Motor atualizado para a versão $NEW. Veja o que mudou em CHANGELOG.md."
bash "$ROOT/.claude/scripts/ping.sh" atualizou 2>/dev/null || true
