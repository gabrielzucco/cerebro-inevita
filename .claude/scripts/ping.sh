#!/usr/bin/env bash
# Compatibilidade retroativa para instalações Claude-first. O motor canônico da
# telemetria é multiplataforma e vive em .agents/scripts/ping.mjs.
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
node "$ROOT/.agents/scripts/ping.mjs" "${1:-sessao}" >/dev/null 2>&1 || true
exit 0
