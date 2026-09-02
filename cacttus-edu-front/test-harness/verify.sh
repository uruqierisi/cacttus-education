#!/bin/sh
# verify.sh <label>
#
# The gate one refactoring step has to pass: typecheck, build, serve the production
# build, capture every route at both viewports, diff against the baseline capture.
#
# `pnpm build` alone is NOT a gate — it is `vite build`, which transpiles with esbuild
# and discards types. A broken import or a missing export builds clean and only fails at
# runtime, which is exactly what moving code between files produces. Hence tsc first.
#
# Usage:
#   sh test-harness/verify.sh baseline     # before the first change
#   sh test-harness/verify.sh step07       # after each step
set -e

LABEL="$1"
if [ -z "$LABEL" ]; then echo "usage: verify.sh <label>"; exit 2; fi

HARNESS=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
APP=$(dirname "$HARNESS")
PORT="${PREVIEW_PORT:-5199}"
BASELINE="${BASELINE_LABEL:-baseline}"

cd "$APP"

echo "── typecheck ──"
if pnpm typecheck >/dev/null 2>&1; then
  echo "  tsc: 0"
else
  pnpm typecheck 2>&1 | tail -30
  echo "TYPECHECK FAILED"
  exit 1
fi

echo "── build ──"
pnpm build 2>&1 | tail -2

echo "── preview restart ──"
pkill -f "vite preview --port $PORT" >/dev/null 2>&1 || true
sleep 1
( cd "$APP" && pnpm exec vite preview --port "$PORT" --strictPort >/dev/null 2>&1 & )
i=0
while [ "$i" -lt 40 ]; do
  if [ "$(curl -s -o /dev/null -w '%{http_code}' --max-time 2 "http://localhost:$PORT/" || true)" = "200" ]; then break; fi
  i=$((i + 1))
done
echo "  preview up on $PORT"

echo "── capture ──"
cd "$HARNESS"
APP_ORIGIN="http://localhost:$PORT" node capture.mjs "$LABEL"

if [ "$LABEL" = "$BASELINE" ]; then
  echo "── baseline recorded; nothing to diff against yet ──"
  exit 0
fi

echo "── diff vs $BASELINE ──"
node compare.mjs "$BASELINE" "$LABEL"
