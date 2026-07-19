#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/server"

if [[ ! -f .env ]]; then
  cp .env.example .env
  echo "Created server/.env — add your GEMINI_API_KEY, then run again."
  exit 1
fi

if ! grep -q '^GEMINI_API_KEY=.' .env 2>/dev/null; then
  echo "Add your Gemini API key to server/.env:"
  echo "  GEMINI_API_KEY=..."
  exit 1
fi

npm install --silent 2>/dev/null || npm install
npm run dev
