#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

pnpm build

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
cp -R dist/. "$TMP"/

cd "$TMP"
git init -q -b gh-pages
git add -A
git -c user.name="KangYiHang" -c user.email="kk2107405729@users.noreply.github.com" \
  commit -q -m "deploy: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
REMOTE="$(git -C "$ROOT" remote get-url origin 2>/dev/null || true)"
if [ -z "$REMOTE" ]; then
  echo "No git remote named origin. Add one first." >&2
  exit 1
fi
git remote add origin "$REMOTE"
git push -f origin gh-pages
