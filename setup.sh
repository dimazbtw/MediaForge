#!/usr/bin/env bash
# MediaForge — instalação (macOS / Linux)
#
#   chmod +x setup.sh && ./setup.sh
#
# Aceita os mesmos sinalizadores do script Node, ex.:  ./setup.sh --with-ffmpeg

set -euo pipefail
cd "$(dirname "$0")"

if ! command -v node >/dev/null 2>&1; then
  echo ""
  echo "  Node.js não encontrado."
  echo "  Instala a versão LTS em https://nodejs.org e volta a correr este script."
  echo ""
  exit 1
fi

exec node scripts/setup.mjs "$@"
