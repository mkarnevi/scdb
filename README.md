## The Sketch Comedy Database

The code behind [www.SketchTV.lol](https://www.sketchtv.lol).
If you find this code useful, please give back by adding your favorite sketch!

### Technologies

- Frontend
  - React
  - MUI
  - Server Actions
  - Accessibility / ARIA / a11y
- Backend
  - Next.js 15
  - App Router
  - NextAuth.js
  - RSC (React Server Components)
  - ISR (Incremental Static Regeneration)
  - AWS S3
- Database
  - Prisma
  - Postgres
  - SQL Triggers and Functions
- Development
  - Next Turbopack
  - TypeScript
  - ESLint
- Other
  - A light/custom CMS for page editing
  - Caching - ISR, React cache, unstable_cache, and prefetch

### Google indexing request tracking

Apply `database/sql/scripts/add_google_indexing_requested_at.sql` before deploying this schema change.
Existing rows default to null; they have no recorded request, regardless of their actual Google indexing status.

- `GET /api/indexing/unrequested?limit=30` lists the newest non-flagged sketches without a recorded request, with canonical page URLs and the total remaining count (limit 1–100).
- Request indexing for a page in Google Search Console. Only after it confirms **Indexing requested**, call authenticated `PUT /api/indexing/{id}` with `{"google_indexing_requested":true}`.
- `GET /api/indexing/{id}` returns `{id, google_indexing_requested_at}`. The nullable timestamp is also returned in sketch list and detail responses.
- The timestamp records when the confirmation was saved. Retrying true preserves it; false clears an incorrect mark. This API neither sends a request to Google nor verifies actual indexing.

### Panel shows and local video (fork additions)

- **Show format:** each show is a `Sketch` or `Panel` show. Panel shows call their segments "rounds" on show, season, episode and recurring pages, and offer `Captain`/`Panellist` cast roles. Internally every segment is still a `sketch` row.
- **Segment times:** a segment can have a start and end time inside its video, entered as `12:34` or `1:02:03`. YouTube embeds play just that range.
- **Local video:** a video URL that is a path on this site (`/media/ep1.mp4`) or a direct link to a video file plays in a built-in player. It starts at the segment, pauses at its end, and shows the episode's other segments in the same file as markers on the progress bar.
- **Database:** apply `database/sql/scripts/add_panel_show_support.sql` before deploying.

Serve the video files next to the app with range requests, for example with Caddy:

```
scdb.example.com {
  handle_path /media/* {
    root * /srv/comedy
    file_server
  }
  handle {
    reverse_proxy localhost:3000
  }
}
```

### Resources

The official website [www.sketchtv.lol](https://www.sketchtv.lol/)

The search website [www.sketchcomedydatabase.com](https://www.sketchcomedydatabase.com/)

Talk about comedy and website ideas on our [Discord server](https://discord.gg/UKE8gSYp)

On X [@sketchtvlol](https://x.com/sketchtvlol) and [@swax](https://x.com/swax)
