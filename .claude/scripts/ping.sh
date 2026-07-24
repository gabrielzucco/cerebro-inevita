#!/usr/bin/env bash
# Compatibilidade retroativa para instalações Claude-first. O motor canônico da
# telemetria é multiplataforma e vive em .agents/scripts/ping.mjs.
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
# Um atualizador legado continua executando o próprio código depois de copiar os
# scripts novos. Como ele chama este ping no fim, fechamos aqui a migração de
# privacidade já na primeira passagem.
bash "$ROOT/.claude/scripts/ensure-private-ignore.sh" >/dev/null 2>&1 || true
node "$ROOT/.agents/scripts/ping.mjs" "${1:-sessao}" >/dev/null 2>&1 || true
exit 0
