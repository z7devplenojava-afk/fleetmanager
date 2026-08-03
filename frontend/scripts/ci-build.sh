#!/usr/bin/env bash
# Build frontend no CI (Linux glibc / ubuntu-latest).
# Contorna bugs do npm com optional deps multiplataforma do Rollup.
set -euo pipefail
cd "$(dirname "$0")/.."
rm -rf node_modules
rm -f package-lock.json
npm install --legacy-peer-deps --force --no-audit --no-fund
npm install --no-save --legacy-peer-deps @rollup/rollup-linux-x64-gnu
npm run build
