#!/usr/bin/env bash
# check-deps.sh — Report outdated npm and Python dependencies.
# Usage: bash scripts/check-deps.sh
# Run from the AudioGrabber package root.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PKG_ROOT="$(dirname "$SCRIPT_DIR")"
VENV="$PKG_ROOT/.venv"
PYTHON="${VENV}/bin/python3"
PIP="${VENV}/bin/pip"

# Activate venv if pip is not already the venv one.
if [[ ! -x "$PIP" ]]; then
  echo "[WARN] .venv not found at $VENV — run 'python3 -m venv .venv && pip install -r requirements.txt' first." >&2
  exit 1
fi

echo "========================================"
echo " AudioGrabber dependency status report"
echo " $(date -u '+%Y-%m-%d %H:%M UTC')"
echo "========================================"

# ---------- npm outdated ----------
echo ""
echo "--- npm outdated ---"
cd "$PKG_ROOT"
# npm outdated exits 1 when there are outdated packages; suppress that.
npm outdated --color=always 2>/dev/null || true

# ---------- pip list --outdated ----------
echo ""
echo "--- pip outdated (venv) ---"
"$PIP" list --outdated --format=columns 2>/dev/null || true

echo ""
echo "Done. Bump versions manually in package.json / requirements.txt, then run:"
echo "  npm install && pip install -r requirements.txt"
echo "  bash scripts/check-deps.sh   # confirm clean"
echo "  python3 python/canary.py     # validate health"
