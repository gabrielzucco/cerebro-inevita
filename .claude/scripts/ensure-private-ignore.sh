#!/usr/bin/env bash
# Acrescenta proteções privadas introduzidas por versões novas sem reescrever
# o .gitignore do dono. Também funciona como migração quando um atualizador
# antigo já copiou os scripts novos, mas ainda está terminando a primeira execução.
set -u

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
MANIFEST="$ROOT/.cerebro/private-ignore.manifest"
GITIGNORE="$ROOT/.gitignore"

[ -f "$MANIFEST" ] || exit 0
touch "$GITIGNORE" 2>/dev/null || exit 0
if [ -s "$GITIGNORE" ] && [ -n "$(tail -c 1 "$GITIGNORE" 2>/dev/null)" ]; then
  printf '\n' >> "$GITIGNORE" || exit 0
fi

while IFS= read -r rule || [ -n "$rule" ]; do
  [ -z "$rule" ] && continue
  case "$rule" in \#*) continue ;; esac

  found=false
  while IFS= read -r existing || [ -n "$existing" ]; do
    if [ "$existing" = "$rule" ]; then
      found=true
      break
    fi
  done < "$GITIGNORE"

  if [ "$found" = false ]; then
    printf '%s\n' "$rule" >> "$GITIGNORE" || exit 0
  fi
done < "$MANIFEST"

exit 0
