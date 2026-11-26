#!/usr/bin/env bash
# Nightly backup: a database dump plus the uploaded images, to a restic
# repository on the Storage Box. Run by scdb-backup.timer.
#
# One-time setup: apt install restic, then
#   mkdir -p /root/.config/scdb && openssl rand -hex 32 > /root/.config/scdb/restic-password
#   chmod 600 /root/.config/scdb/restic-password
#   RESTIC_PASSWORD_FILE=/root/.config/scdb/restic-password restic -r rclone:hetzner:backups/scdb init
# Keep a copy of that password somewhere else: without it the backups can't be read.
set -euo pipefail
cd "$(dirname "$0")/.."

export RESTIC_REPOSITORY="${RESTIC_REPOSITORY:-rclone:hetzner:backups/scdb}"
export RESTIC_PASSWORD_FILE="${RESTIC_PASSWORD_FILE:-/root/.config/scdb/restic-password}"
DUMP_DIR="${DUMP_DIR:-/var/backups/scdb}"

mkdir -p "$DUMP_DIR"
chmod 700 "$DUMP_DIR"

# Dump, then check the dump can be read before it replaces the last one
docker compose exec -T db pg_dump -U scdb -d scdb -Fc > "$DUMP_DIR/scdb.dump.new"
docker compose exec -T db pg_restore --list < "$DUMP_DIR/scdb.dump.new" > /dev/null
mv "$DUMP_DIR/scdb.dump.new" "$DUMP_DIR/scdb.dump"

restic backup --tag scdb --host scdb "$DUMP_DIR/scdb.dump" "$PWD/data/images"
restic forget --tag scdb --host scdb --keep-daily 7 --keep-weekly 4 --keep-monthly 12 --prune

# Optional dead man's switch (e.g. healthchecks.io): only pinged on success
if [[ -n ${HEALTHCHECK_URL:-} ]]; then
  curl -fsS -m 10 --retry 3 "$HEALTHCHECK_URL" > /dev/null
fi
echo "Backup done."
