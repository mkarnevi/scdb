#!/usr/bin/env bash
# Monthly check that the latest backup restores: loads it into a throwaway
# Postgres container and counts what's in it. Touches nothing else.
set -euo pipefail

export RESTIC_REPOSITORY="${RESTIC_REPOSITORY:-rclone:hetzner:backups/scdb}"
export RESTIC_PASSWORD_FILE="${RESTIC_PASSWORD_FILE:-/root/.config/scdb/restic-password}"
DUMP_DIR="${DUMP_DIR:-/var/backups/scdb}"
NAME=scdb-restore-test

TMP=$(mktemp -d)
cleanup() { docker rm -f "$NAME" > /dev/null 2>&1 || true; rm -rf "$TMP"; }
trap cleanup EXIT

restic restore latest --tag scdb --host scdb --target "$TMP" --include "$DUMP_DIR/scdb.dump"
DUMP="$TMP$DUMP_DIR/scdb.dump"
[[ -s $DUMP ]] || { echo "No dump in the latest snapshot" >&2; exit 1; }

docker run -d --name "$NAME" -e POSTGRES_PASSWORD=test postgres:17 > /dev/null
until docker exec "$NAME" pg_isready -U postgres > /dev/null 2>&1; do sleep 1; done
sleep 2

docker exec -i "$NAME" pg_restore -U postgres -d postgres --no-owner --exit-on-error < "$DUMP"
docker exec "$NAME" psql -U postgres -d postgres -c \
  "SELECT 'shows' AS what, count(*) FROM show
   UNION ALL SELECT 'episodes', count(*) FROM episode
   UNION ALL SELECT 'segments', count(*) FROM sketch
   UNION ALL SELECT 'people', count(*) FROM person"
echo "Restore test passed: compare the counts with the live site."
