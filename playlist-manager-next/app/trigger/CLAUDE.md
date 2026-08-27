# Trigger.dev tasks (`app/trigger/`)

Background jobs for the web app, run on Trigger.dev (SDK v4, `@trigger.dev/sdk`).
Config lives in `playlist-manager-next/trigger.config.ts`; tasks are auto-discovered
from `dirs: ['./app/trigger']`. See the Trigger.dev v4 API rules in the repo-root
`CLAUDE.md` — always `task` / `schemaTask` / `schedules.task`, never `client.defineJob`.

## The four tasks

| id | file | kind | trigger | purpose |
|----|------|------|---------|---------|
| `sync-recently-played` | `syncRecentlyPlayed.ts` | `schedules.task` | cron `*/15 * * * *` | Poll each user's Spotify `recently_played`, advance `listening_progress` |
| `sync-playlist` | `syncPlaylist.ts` | `task` | fired by `sync-recently-played` | Re-fetch one playlist's albums from Spotify when new listening activity is seen |
| `update-users-playlist-data-scheduled` | `updateUsersPlaylistDataScheduled.ts` | `schedules.task` | cron `0 0 * * 6` (00:00 Sat UTC) | Fan out `update-playlist-data` over every user |
| `update-playlist-data` | `updatePlaylistData.ts` | `task` | fired by the weekly scheduled task | Discover/refresh all of one user's "…Albums…" playlists |

Cron expressions are **UTC**.

### `sync-recently-played` (+ exported `syncForUser`)

Every 15 min, for every user, calls `syncForUser(user)` (per-user `try/catch` — one
user's failure never aborts the run). `syncForUser` is **also exported and called
synchronously** by the `POST /api/sync-history` route, which the native app hits on
every app open/resume (and login). The cron is the background safety net; the route
is the foreground path so the Now tab is fresh on open.

Per user, `syncForUser`:
1. Refreshes the Spotify access token (`refreshSpotifyAccessToken`, transaction-wrapped
   because Spotify sometimes rotates the refresh token).
2. Finds the user's playlists whose name matches `NEW_ALBUMS_REGEX` (`app/utils/playlistFilters.ts`).
3. `GET /me/player/recently-played` (limit 50), using `sync_log.last_played_at` as the
   `after` cursor. If >50 tracks played since last run, the overflow is lost (accepted).
4. Resolves track → album → playlist in **one** Prisma query against data already synced
   into Postgres — no extra Spotify calls, no N+1.
5. Groups by `(album, playlist)`, keeping the highest track index seen, and upserts
   `listening_progress` — **advance-only, never regresses `last_track_index`**
   (`source: 'recently_played'`).
6. For each playlist that gained activity, fires `sync-playlist` (it self-throttles, so
   firing every run is safe).
7. Advances the `sync_log` cursor to the newest `played_at`.

`maxDuration: 120`.

> The 15-min cadence runs on top of the inline app-open call, which already covers the
> interactive case. If Spotify rate limits or Trigger.dev compute cost become a concern,
> this cron is the first knob to loosen (or gate to only recently-active users).

### `sync-playlist`

Payload `{ userId, playlistId }`. Self-throttles: if `playlist.last_synced_at` is within
`PLAYLIST_SYNC_THROTTLE_HOURS` (4h) it logs a skip and returns `{ skipped: true }`.
Otherwise refreshes the token and calls `refreshSpotifyPlaylist` →
`refreshPlaylistAlbumsInDb` (`app/api/playlists/[playlistId]/refresh/handler.ts`), which
updates the playlist row **in place** and replaces only the album-relationship rows —
deleting the playlist row would cascade-delete `listening_progress`. Isolated by
`(userId, playlistId)`; safe to run concurrently for different playlists. `maxDuration: 300`.

### `update-users-playlist-data-scheduled` → `update-playlist-data`

Weekly (Sat 00:00 UTC), loops users and `await`s `update-playlist-data.triggerAndWait`
one at a time. `maxDuration: 3600` on the parent, `300` on the child.

`update-playlist-data` (payload `{ userId }`) refreshes the token, then
`refreshSpotifyPlaylists` (`app/api/playlists/refresh/handler.ts`) pages all the user's
Spotify playlists, keeps those matching `ALL_ALBUMS_REGEX`, and for each that is new or
whose `snapshot_id` changed does `addPlaylistToDb` / `refreshPlaylistAlbumsInDb`.

The same `refreshSpotifyPlaylists` is also:
- exposed at `GET /api/playlists/refresh` for an on-demand refresh, and
- kicked as a **background job from `POST /api/sync-history`** (via Next's `after()`) on
  app open, throttled to once per `PLAYLIST_DISCOVERY_THROTTLE_HOURS` (12h) per user using
  `sync_log.last_playlist_discovery_at`. This is the on-open half of the "on-open + cron"
  pattern — `update-playlist-data` the task still only runs weekly, but a newly created
  "New Albums DD/MM/YY" playlist now shows up within hours instead of up to a week.
  See `app/api/sync-history/handler.ts`.

## Config (`trigger.config.ts`)

- `project: 'proj_tfntodmewfoejnqnhfwh'`, `runtime: 'node'`, default `maxDuration: 600`.
- **`retries.default.maxAttempts: 1`** — tasks do **not** retry, by design: the next cron
  tick (or next app-open) recovers a failed poll, and retrying risks duplicate writes and
  wasted Spotify quota. Don't add per-task `retry` without a specific reason.
- Build extensions:
  - `syncVercelEnvVars()` — worker env vars are pulled from Vercel at build time. Set any
    new env var (e.g. `NEXT_PUBLIC_SPOTIFY_CLIENT_ID`, DB URL, Auth0) in **Vercel**, not
    just `.env.local`, or the deployed worker won't see it.
  - `prismaExtension({ mode: 'legacy', clientGenerator: 'client', version: '6.9.0', schema: 'prisma/schema.prisma' })`
    — regenerates the Prisma client (output `generated/prisma`, imported via `lib/prisma`)
    in the worker build.
- `.trigger/` is the local build cache (gitignored).

## Conventions when adding / editing a task

- `schedules.task({ id, cron, run })` for cron jobs; `task({ id, run })` for jobs fired by
  code. `id` is the stable identifier used for triggering and in the dashboard.
- Always refresh the Spotify token with `refreshSpotifyAccessToken(user)` **before**
  building `SpotifyApi.withAccessToken(process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID, tokens)`.
- Import Prisma from `../../lib/prisma`, log via `logger` from `@trigger.dev/sdk` (or
  `console.*`, which Trigger captures).
- Keep per-user work in its own `try/catch` inside fan-out loops.
- Target `listening_progress` / `sync_log` / `album_rating`, not the legacy
  `playback_state*` tables.
- Reuse the shared handlers in `app/api/**/handler.ts` rather than reimplementing Spotify
  sync logic, and reuse `NEW_ALBUMS_REGEX` / `ALL_ALBUMS_REGEX` from
  `app/utils/playlistFilters.ts`.
- Deploy with `npm run trigger:deploy` (`npx trigger.dev@latest deploy`). Declarative
  schedules attach on deploy — no dashboard cron setup needed.
