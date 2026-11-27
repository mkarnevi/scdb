# Self-hosting on a Hetzner server

A private copy of the site, reachable only over Tailscale:

```
your devices ──Tailscale HTTPS──> tailscale serve ──> Caddy (127.0.0.1:8080)
                                                        ├── /media/*  Storage Box mount (/mnt/tv)
                                                        └── /*        app ──> Postgres
```

- **app**: the site, built from this repo. Images are stored on local disk in `data/images` (no S3).
- **db**: Postgres 17 in a Docker volume.
- **caddy**: serves only browser-ready video files (`.mp4`, `.m4v`, `.webm`, never `.orig.mp4`) from the Storage Box, with seeking, and passes everything else to the app.

The fork is private by default: no analytics, no search engine pings, and robots and page metadata tell crawlers to stay out. `PUBLIC_SITE=true` restores upstream's behaviour.

## 1. Prerequisites on the server

```
apt install docker.io docker-compose-v2 restic fuse3   # or Docker's own packages
curl https://rclone.org/install.sh | bash              # current rclone
git clone https://github.com/mkarnevi/scdb /opt/scdb
cd /opt/scdb
```

Your rclone remote (`hetzner:`) must be configured for root: `rclone config show hetzner` should print it.

## 2. Mount the Storage Box

```
mkdir -p /mnt/tv
cp deploy/rclone-tv.service /etc/systemd/system/
systemctl daemon-reload && systemctl enable --now rclone-tv
ls /mnt/tv | head    # your show folders
```

## 3. Configure

```
cp deploy/env.example .env
chmod 600 .env
```

Fill in `.env`. Every setting without a `#` in front is required. `deploy/init.sh` checks them and stops if one is missing. Generate `POSTGRES_PASSWORD` with `openssl rand -hex 24` and `NEXTAUTH_SECRET` with `openssl rand -hex 32`. If you change `.env` later, apply it with `docker compose up -d`: `docker compose restart` keeps the old values. `NEXTAUTH_URL` is the address from step 5, such as `https://hetzner-server1.your-tailnet.ts.net`. In the Google Cloud console, add `<NEXTAUTH_URL>/api/auth/callback/google` as an authorised redirect URI.

## 4. Start it

Either a fresh, empty database:

```
deploy/init.sh
```

Or move the database from your Mac. On the Mac:

```
docker exec scdb-db pg_dump -U scdb -d scdb -Fc > scdb.dump
scp scdb.dump root@hetzner-server1:/opt/scdb/
```

Then on the server:

```
mkdir -p data/images && chown 1000:1000 data/images
docker compose up -d --wait db
docker compose exec -T db pg_restore -U scdb -d scdb --no-owner --clean --if-exists < scdb.dump
docker compose up -d --build
```

Video URLs entered on the Mac as `http://localhost:8080/...` need pointing at `/media/...`:

```
docker compose exec db psql -U scdb -d scdb -c \
  "UPDATE sketch SET video_urls = ARRAY(SELECT replace(u, 'http://localhost:8080/', '/media/') FROM unnest(video_urls) u)"
```

## 5. HTTPS over Tailscale

```
tailscale serve --bg --https=443 http://127.0.0.1:8080
tailscale serve status
```

If something else already uses port 443 on the Tailscale address, pick another, such as `--https=8443`, and include it in `NEXTAUTH_URL`.

Open the address, sign in with Google, then make yourself admin:

```
docker compose exec db psql -U scdb -d scdb -c "UPDATE \"user\" SET role='Admin' WHERE email='you@example.com'"
```

## 6. Backups

```
mkdir -p /root/.config/scdb
openssl rand -hex 32 > /root/.config/scdb/restic-password
chmod 600 /root/.config/scdb/restic-password
RESTIC_PASSWORD_FILE=/root/.config/scdb/restic-password restic -r rclone:hetzner:backups/scdb init
cp deploy/scdb-backup.service deploy/scdb-backup.timer /etc/systemd/system/
systemctl daemon-reload && systemctl enable --now scdb-backup.timer
systemctl start scdb-backup && journalctl -u scdb-backup -n 20    # first run now
```

Store a copy of the restic password somewhere else, such as your password manager: without it the backups can't be read.

Each night the job dumps the database, checks the dump can be read, and sends it with `data/images` to `hetzner:backups/scdb`. It keeps 7 daily, 4 weekly and 12 monthly copies. To be alerted when a night is missed, put `HEALTHCHECK_URL=https://hc-ping.com/<id>` in `/root/.config/scdb/backup.env`.

Once a month, check that a restore works:

```
deploy/restore-test.sh
```

It loads the latest backup into a throwaway Postgres container and prints row counts to compare with the site.

## Updating

```
cd /opt/scdb
git pull
docker compose up -d --build
```

Database schema changes come with a SQL script under `database/sql/scripts/`. Apply it with `docker compose exec -T db psql -U scdb -d scdb -v ON_ERROR_STOP=1 < <script>`.

## Notes

- Nothing listens publicly: Caddy is bound to `127.0.0.1:8080`, and Postgres has no published port.
- The build doesn't pre-render pages (Next's compile build mode, which is experimental), so no database is needed to build. Pages render on first visit.
- If the rclone mount restarts, Caddy sees the new mount automatically. If videos ever 404 after a restart, run `docker compose restart caddy`.
- Storage Boxes allow 10 simultaneous connections. The mount uses up to 4, so the conversion script and backups still have room.
