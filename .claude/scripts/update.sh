#!/usr/bin/env bash
# Atualiza o MOTOR do cérebro (skills, gabaritos, Vale) para a última versão.
# NUNCA toca meu-negocio/, capturas/ ou privado/ — o contexto do dono.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
# shellcheck disable=SC1091
source "$ROOT/.cerebro/source" 2>/dev/null || { echo "✗ Fonte de atualização não configurada em .cerebro/source"; exit 1; }

TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT

echo "→ Baixando a última versão do motor ($REPO@$BRANCH)…"
if ! curl -fsSL --max-time 30 "https://github.com/$REPO/archive/refs/heads/$BRANCH.tar.gz" -o "$TMP/motor.tar.gz"; then
  echo "✗ Não consegui baixar. Confere a conexão (e o repo em .cerebro/source)."
  echo "  Teu contexto está intacto — nada foi alterado."
  exit 1
fi

tar -xzf "$TMP/motor.tar.gz" -C "$TMP"
SRC="$(find "$TMP" -mindepth 1 -maxdepth 1 -type d | head -1)"
[ -n "$SRC" ] || { echo "✗ Pacote vazio. Nada alterado."; exit 1; }

MANIFEST="$SRC/.cerebro/motor.manifest"
[ -f "$MANIFEST" ] || { echo "✗ Manifesto do motor não veio no pacote. Nada alterado."; exit 1; }

OLD="$(cat "$ROOT/VERSION" 2>/dev/null || echo '?')"
NEW="$(cat "$SRC/VERSION" 2>/dev/null || echo '?')"
echo "→ Atualizando $OLD → $NEW. Teu contexto (meu-negocio/, capturas/, privado/) NÃO será tocado."

while IFS= read -r item; do
  [ -z "$item" ] && continue
  case "$item" in \#*) continue ;; esac
  # trava de segurança: jamais sobrescreve o que é do dono
  case "$item" in meu-negocio*|capturas*|privado*) echo "  (ignorando $item — é teu)"; continue ;; esac
  if [ -e "$SRC/$item" ]; then
    rm -rf "$ROOT/$item"
    mkdir -p "$(dirname "$ROOT/$item")"
    cp -R "$SRC/$item" "$ROOT/$item"
    echo "  ✓ $item"
  fi
done < "$MANIFEST"

echo "✓ Motor atualizado para a versão $NEW. Veja o que mudou em CHANGELOG.md."
