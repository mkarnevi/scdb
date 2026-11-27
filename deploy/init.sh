#!/usr/bin/env bash
# First-time setup on an empty database: tables, SQL functions and triggers,
# then the full stack. To move an existing database instead, see README.md.
set -euo pipefail
cd "$(dirname "$0")/.."

[[ -f .env ]] || { echo "Create .env first: cp deploy/env.example .env" >&2; exit 1; }

env_value() { grep -E "^$1=" .env | tail -n1 | cut -d= -f2-; }

missing=()
for name in POSTGRES_PASSWORD NEXTAUTH_URL NEXTAUTH_SECRET GOOGLE_CLIENT_ID GOOGLE_CLIENT_SECRET; do
  [[ -n $(env_value "$name") ]] || missing+=("$name")
done
if (( ${#missing[@]} )); then
  echo "Set these in .env first: ${missing[*]}" >&2
  echo "Make secrets with: openssl rand -hex 32" >&2
  exit 1
fi

# The password goes into a database URL, so it must not contain URL characters
if [[ ! $(env_value POSTGRES_PASSWORD) =~ ^[A-Za-z0-9_-]+$ ]]; then
  echo "POSTGRES_PASSWORD in .env must be letters, digits, - or _ only." >&2
  echo "Make one with: openssl rand -hex 24" >&2
  exit 1
fi

if [[ ! $(env_value NEXTAUTH_URL) =~ ^https?://[^/]+$ ]]; then
  echo "NEXTAUTH_URL must be the site address only, e.g. https://host.tailnet.ts.net:9443" >&2
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
