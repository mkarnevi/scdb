#!/usr/bin/env bash
# First-time setup on an empty database: tables, SQL functions and triggers,
# then the full stack. To move an existing database instead, see README.md.
set -euo pipefail
cd "$(dirname "$0")/.."

[[ -f .env ]] || { echo "Create .env first: cp deploy/env.example .env" >&2; exit 1; }

# The password goes into a database URL, so it must not contain URL characters
pw=$(grep -E '^POSTGRES_PASSWORD=' .env | tail -n1 | cut -d= -f2-)
if [[ ! $pw =~ ^[A-Za-z0-9_-]+$ ]]; then
  echo "POSTGRES_PASSWORD in .env must be letters, digits, - or _ only." >&2
  echo "Make one with: openssl rand -hex 24" >&2
  exit 1
fi

mkdir -p data/images
chown 1000:1000 data/images   # the app runs as the image's node user

docker compose up -d --wait db
docker compose --profile tools run --rm tools npx prisma db push

for f in database/sql/functions/*.sql database/sql/triggers/*.sql \
         database/sql/scripts/add_panel_show_support.sql; do
  echo "Applying $f"
  docker compose exec -T db psql -U scdb -d scdb -v ON_ERROR_STOP=1 < "$f"
done

docker compose up -d --build
echo "Up. Next: tailscale serve (see deploy/README.md)."
