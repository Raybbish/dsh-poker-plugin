#!/usr/bin/env bash
# dsh-poker install & distribution verification.
#
#  1. npm pack
#  2. create a temporary DSH_HOME
#  3. install the plugin from the tarball into a fresh web profile
#     (`dsh plugin` → pnpm add + bundle reconciliation)
#  4. run --dump-config and assert the poker loader row appears EXACTLY once
#  5. boot a temporary dsh web
#  6. run the existing scripts/smoke-test.mjs against it
#
# dsh is invoked exactly the way users run it: `npx @deepseek-ai/dsh`.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WORK="$(mktemp -d "${TMPDIR:-/tmp}/dsh-poker-install.XXXXXX")"
SERVER_PID=""
cleanup() {
  if [ -n "$SERVER_PID" ]; then kill "$SERVER_PID" 2>/dev/null || true; wait "$SERVER_PID" 2>/dev/null || true; fi
  rm -rf "$WORK"
}
trap cleanup EXIT

export DSH_HOME="$WORK/dsh-home"
mkdir -p "$DSH_HOME"

# Pinned to the version this plugin is built against; override with DSH_SPEC.
DSH_SPEC="${DSH_SPEC:-@deepseek-ai/dsh@0.1.0-rc.7}"
DSH=(npx --yes "$DSH_SPEC")
PORT="${DSH_POKER_TEST_PORT:-31831}"

echo "==> 1. npm pack"
TARBALL_NAME="$(cd "$ROOT" && npm pack --pack-destination "$WORK" 2>/dev/null | tail -1)"
TARBALL="$WORK/$TARBALL_NAME"
[ -f "$TARBALL" ] || { echo "FAIL: npm pack produced no tarball"; exit 1; }
echo "    tarball: $TARBALL_NAME"
tar -tzf "$TARBALL" | grep -q "package/cordis.patch.yml" || {
  echo "FAIL: cordis.patch.yml is missing from the npm package (check files[])"; exit 1
}
tar -tzf "$TARBALL" | grep -q "package/lib/client.js" || {
  echo "FAIL: lib/client.js is missing from the npm package"; exit 1
}

echo "==> 2/3. install from the tarball into a fresh web profile (DSH_HOME=$DSH_HOME)"
"${DSH[@]}" plugin --profile web add -w "file:$TARBALL"
BUNDLES="$(node -e "const m=require('$DSH_HOME/profiles/web/package.json'); process.stdout.write((m.dsh?.profile?.bundles ?? []).join(','))")"
echo "    profile dsh.profile.bundles: $BUNDLES"
case ",$BUNDLES," in
  *",dsh-poker,"*) : ;;
  *) echo "FAIL: dsh-poker was not appended to dsh.profile.bundles"; exit 1 ;;
esac

echo "==> 4. --dump-config asserts the poker loader row appears exactly once"
CONFIG="$("${DSH[@]}" --profile web --dump-config 2>&1)"
COUNT="$(printf '%s\n' "$CONFIG" | grep -c 'name: dsh-poker' || true)"
echo "    'name: dsh-poker' occurrences: $COUNT"
[ "$COUNT" -eq 1 ] || { echo "FAIL: expected exactly 1 poker loader row, found $COUNT"; exit 1; }
printf '%s\n' "$CONFIG" | grep -qE '^- id: poker' || { echo "FAIL: poker row id missing in the composed tree"; exit 1; }
echo "    composed row: $(printf '%s\n' "$CONFIG" | grep -A1 'name: dsh-poker' | tr '\n' ' ' | sed 's/  -/ -/g')"

echo "==> 5. boot a temporary dsh web on port $PORT"
"${DSH[@]}" --profile web --port "$PORT" >"$WORK/server.log" 2>&1 &
SERVER_PID=$!
UP=0
for _ in $(seq 1 60); do
  if curl -sf "http://127.0.0.1:$PORT/" >/dev/null 2>&1; then UP=1; break; fi
  if ! kill -0 "$SERVER_PID" 2>/dev/null; then break; fi
  sleep 1
done
if [ "$UP" -ne 1 ]; then
  echo "FAIL: temporary dsh web did not come up"; tail -40 "$WORK/server.log"; exit 1
fi
echo "    server up (pid $SERVER_PID)"
curl -s "http://127.0.0.1:$PORT/" | grep -q '"dsh-poker"' || { echo "FAIL: dsh-poker missing from the boot graph"; exit 1; }
echo "    boot graph includes dsh-poker; client bundle: $(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:$PORT/plugins/dsh-poker/client.js")"

echo "==> 6. run the existing smoke test"
node "$ROOT/scripts/smoke-test.mjs" "ws://127.0.0.1:$PORT/poker/ws"

echo ""
echo "==> install & distribution verification PASSED"
