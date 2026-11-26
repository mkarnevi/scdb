#!/usr/bin/env bash
# First-time setup on an empty database: tables, SQL functions and triggers,
# then the full stack. To move an existing database instead, see README.md.
set -euo pipefail
cd "$(dirname "$0")/.."

[[ -f .env ]] || { echo "Create .env first: cp deploy/env.example .env" >&2; exit 1; }

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
