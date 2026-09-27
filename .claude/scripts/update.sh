#!/usr/bin/env bash
# Atualiza o MOTOR do cérebro (skills, gabaritos, Vale) para a última versão.
# NUNCA toca contexto, operação, feedback, conexões locais ou contribuições do dono.
# Contratos preservados no preflight Node: operacao* · sistemas/*/feedback.md ·
# comunidade/minhas-contribuicoes* · SEED_MANIFEST. O atualizador também executa
# ensure-private-ignore.sh e preserva integralmente o conteúdo particular.
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
  # Release publicada é a fonte canônica: um commit ruim no main não pode chegar
  # instantaneamente em todo cérebro instalado. Sem release (ou sem rede para
  # consultar), cai no branch como último recurso.
  TAG="$(curl -fsSL --max-time 15 "https://api.github.com/repos/$REPO/releases/latest" 2>/dev/null \
    | sed -n 's/.*"tag_name": *"\([^"]*\)".*/\1/p' | head -1)"
  if [ -n "$TAG" ]; then
    ORIGEM="refs/tags/$TAG"; ROTULO="$TAG"
  else
    ORIGEM="refs/heads/$BRANCH"; ROTULO="$BRANCH"
  fi
  echo "→ Baixando a última versão do motor ($REPO@$ROTULO)…"
  if ! curl -fsSL --max-time 30 "https://github.com/$REPO/archive/$ORIGEM.tar.gz" -o "$TMP/motor.tar.gz"; then
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
command -v node >/dev/null 2>&1 || {
  echo "✗ Node.js 20+ é necessário para verificar conflitos com segurança. Nada alterado."
  exit 1
}

# O caminho legado usa exatamente o mesmo preflight atômico do atualizador
# multiplataforma. O script executado vem do pacote baixado, mas o alvo continua
# sendo a instalação da pessoa.
export CEREBRO_UPDATE_TARGET_DIR="$ROOT"
export CEREBRO_UPDATE_SOURCE_DIR="$SRC"
exec node "$SRC/scripts/update.mjs"
