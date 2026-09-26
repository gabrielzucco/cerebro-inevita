#!/usr/bin/env bash
# Compatibilidade de entrada: um único motor de atualização, em Node 20+.
# Arquivo a arquivo, com prévia; preserva integralmente o conteúdo fora do pacote.
# As guardas (operacao*, sistemas/*/feedback.md, comunidade/minhas-contribuicoes*)
# e SEED_MANIFEST agora são aplicadas no planejador Node, inclusive em subdiretórios.
# ensure-private-ignore.sh foi substituído pelo merge de .gitignore incluído na prévia.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
if ! command -v node >/dev/null 2>&1; then
  echo 'Node.js 20+ necessário para atualizar. Nenhum arquivo foi alterado.' >&2
  exit 1
fi
if [ ! -f "$ROOT/scripts/update.mjs" ]; then
  echo 'Atualizador seguro ausente. Use a cópia de uma tag explícita em pasta temporária; veja COMECE-AQUI.md.' >&2
  exit 1
fi
exec node "$ROOT/scripts/update.mjs" "$@"
