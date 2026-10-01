#!/usr/bin/env bash
# Applies supabase/migrations on a disposable PostgreSQL and runs supabase/tests/rls/*.sql.
#
#   DATABASE_URL=postgres://... npm run test:db   # use an existing empty database (CI)
#   npm run test:db                              # spin up a throwaway local cluster
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PSQL_OPTS=(-v ON_ERROR_STOP=1 -q -X -t -o /dev/null)

cleanup() { :; }
trap 'cleanup' EXIT

if [[ -z "${DATABASE_URL:-}" ]]; then
  PG_BIN="${PG_BIN:-$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | sort -V | tail -1)}"
  if [[ -z "$PG_BIN" || ! -x "$PG_BIN/initdb" ]]; then
    echo "PostgreSQL binaries not found. Set DATABASE_URL or PG_BIN." >&2
    exit 1
  fi
  TMP="$(mktemp -d)"
  PORT="${PG_PORT:-55432}"
  RUN=()
  if [[ "$(id -u)" == "0" ]]; then
    chown postgres "$TMP"
    RUN=(runuser -u postgres --)
  fi
  "${RUN[@]}" "$PG_BIN/initdb" -D "$TMP/data" -U postgres -A trust >/dev/null
  "${RUN[@]}" "$PG_BIN/pg_ctl" -D "$TMP/data" -o "-p $PORT -k $TMP -c listen_addresses=''" -w start >/dev/null
  cleanup() { "${RUN[@]}" "$PG_BIN/pg_ctl" -D "$TMP/data" -m immediate stop >/dev/null 2>&1 || true; rm -rf "$TMP"; }
  DATABASE_URL="postgresql://postgres@/postgres?host=$TMP&port=$PORT"
fi

run_sql() { psql "$DATABASE_URL" "${PSQL_OPTS[@]}" -f "$1"; }

echo "→ Supabase shim"
run_sql "$ROOT/supabase/tests/00_supabase_shim.sql"

for f in "$ROOT"/supabase/migrations/*.sql; do
  echo "→ migration $(basename "$f")"
  run_sql "$f"
done

echo "→ seed"
run_sql "$ROOT/supabase/seed.sql"

for f in "$ROOT"/supabase/content/*.sql; do
  echo "→ content $(basename "$f") (applied twice to check idempotency)"
  run_sql "$f"
  run_sql "$f"
done

status=0
for f in "$ROOT"/supabase/tests/rls/*.sql; do
  echo "→ test $(basename "$f")"
  if ! run_sql "$f"; then status=1; fi
done

if [[ $status -eq 0 ]]; then echo "✓ database tests passed"; else echo "✗ database tests failed" >&2; fi
exit $status
