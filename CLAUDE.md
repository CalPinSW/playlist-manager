# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repo layout

This is two independent apps, each with its own `package.json` and lockfile — there is no root workspace tooling (the root `package.json`/`package-lock.json` are empty stubs, ignore them):

- **`playlist-manager-next/`** — Next.js 15 (App Router) web app, deployed to Vercel. Also *is* the backend: Postgres (Prisma) access, Spotify API calls, Auth0, and Trigger.dev background jobs all live here behind `/api` routes. The native app talks to this as its only backend.
- **`playlist-manager-native/`** — Expo / React Native app (Expo Router, dev-client build, not Expo Go — native modules like the iOS widget extension require prebuild).

`README.md`, `install.sh`, and `compose.yaml` at the repo root describe an older Flask/React `backend`/`frontend` split that no longer exists — ignore them, they're stale.

`docs/DESIGN.md` and `docs/DESIGN-REVIEW.md` are a design doc from `/office-hours` for the native app's initial build; treat it as historical context, not a current spec — much of it has since shipped or diverged. `TODOS.md` lists follow-up work captured from a past `/plan-eng-review`; check it against current code before assuming an item is still outstanding (e.g. the `withAuth()` Bearer-token item it lists is already implemented).

## Commands

### Web app (`playlist-manager-next/`)

```bash
npm run dev              # next dev
npm run build             # prisma generate; next build
npm run lint               # next lint
npm run lint:fix
npm run typecheck          # tsc --noEmit
npm test                   # vitest run (single run)
npm run test:watch         # vitest watch
```

Run a single Vitest test file: `npx vitest run tests/app/api/progress/getProgress.test.ts`

```bash
npm run test:integration        # starts the app, runs Cypress headless against it
npm run test:integration:watch  # starts the app, opens Cypress interactively
npm run prisma:generate
npm run prisma:migrate:deploy
npm run trigger:deploy          # npx trigger.dev@latest deploy
```

Env vars live in `.env.local` (see `.env.local.template`).

### Native app (`playlist-manager-native/`)

```bash
npm start                 # expo start
npm run ios                # expo run:ios
npm run android            # expo run:android
npm run build:ios          # eas build --platform ios --profile development
npm run build:ios:preview  # eas build --platform ios --profile preview
npm run build:android      # eas build --platform android --profile development
```

There is no lint/test script configured in this app. Env vars live in `.env` (`EXPO_PUBLIC_*` prefix — bundled into the client, never put secrets here); see `.env.example`.

This app ships a prebuilt `ios/` project (widget extension, App Group entitlements) rather than generating it fresh each time — running `npx expo prebuild` will regenerate it and can clobber those native customizations, so avoid it unless you specifically mean to reconfigure native config and know what you're touching.

## Architecture

### Auth: two schemes into one middleware

`app/api/withAuth.ts` accepts *either* an Auth0 session cookie (web, via `@auth0/nextjs-auth0` in `lib/auth0.ts`) *or* an `Authorization: Bearer` Auth0 access token verified against Auth0's JWKS endpoint (`lib/auth0-bearer.ts`) — the mobile app has no cookie jar, so it sends the token it stores in SecureStore. Bearer is checked first (cheaper, no session lookup) before falling back to the cookie session. Any new API route should wrap its handler in `withAuth()` rather than reimplementing either check.

On the native side (`playlist-manager-native/lib/auth.ts`), Auth0 PKCE runs through `expo-auth-session`; tokens are cached in SecureStore, refreshed silently on expiry via a shared in-flight promise (Auth0 rotates refresh tokens on use, so concurrent refreshes must not race and both spend the same token), and only cleared on a `ReauthRequiredError` — a transient network failure during refresh must not log the user out. `app/_layout.tsx` is the auth gate that reads this state on mount.

### Data model & the `listening_progress` migration

`prisma/schema.prisma` is mid-migration: `playback_state` / `playbackstatealbumrelationship` / `playbackstateplaylistrelationship` are the legacy progress-tracking tables, being replaced by `listening_progress` (plus new `sync_log` and `album_rating` tables). Check which model a given piece of code is reading before extending it — new work should target `listening_progress`, not the legacy tables. `sync_log` stores a per-user `played_at` cursor for the retroactive-history sync described below. Genres reuse the existing `genre`/`albumgenrerelationship` tables — there is no separate genre table for the new features.

### Retroactive playback sync (why there's no live playback tracking)

Rather than requiring the native app to be foregrounded to track listening, `app/trigger/syncRecentlyPlayed.ts` (a Trigger.dev cron task, currently every 15 min) polls Spotify's `recently_played` endpoint per-user, matches played track IDs back to albums/playlists using data already synced into Postgres (no extra Spotify calls), and upserts `listening_progress` — never regressing `last_track_index`. This is also invoked on app open/resume so progress feels near-real-time without waiting for the cron. Playlist discovery (`refreshSpotifyPlaylists` in `app/api/playlists/refresh/handler.ts`) runs on a similar on-open + cron pattern to pick up new "New Albums DD/MM/YY" playlists quickly: weekly via the `updatePlaylistData` / `updateUsersPlaylistDataScheduled.ts` Trigger.dev task, and on app open as a background job (`after()`) kicked from `POST /api/sync-history`, throttled per-user to once every 12h via `sync_log.last_playlist_discovery_at`.

Background jobs use Trigger.dev v4 (`@trigger.dev/sdk` — see the Trigger.dev rules block below for the required task/trigger API); `trigger.config.ts` wires in Prisma client generation and Vercel env var syncing for the worker build.

### Spotify integration

Spotify-facing logic is split between `app/api/spotify/*` (routes + `utilities/`, including token refresh — note `refreshSpotifyAccessToken.ts` wraps the token-fetch-then-DB-write in a transaction since Spotify sometimes rotates the refresh token on use) and `lib/spotify.ts`. `app/utils/playlistFilters.ts` holds the shared regexes (`NEW_ALBUMS_REGEX`, `ALL_ALBUMS_REGEX`) for identifying "New Albums"/"Best Albums" playlists by name — use these rather than ad-hoc string matching.

### Native app structure

Expo Router file-based nav under `app/`: `(auth)` group for login, `(tabs)` group for the four main tabs (Now/`index.tsx`, Albums, Ratings, Settings — a fifth "Discover" tab is planned but intentionally not shown yet). `lib/api.ts` calls the Vercel backend (base URL from `constants/api.ts`, overridable via `EXPO_PUBLIC_API_BASE_URL` for local dev over ngrok); `lib/db.ts` is a write-through SQLite cache (via `expo-sqlite`) so playlists/progress render immediately and survive offline — the server is always the source of truth, there are no local-only writes. `modules/widget-bridge/` is a native module bridging to an iOS WidgetKit extension via an App Group (shared UserDefaults for now-playing data, shared Keychain for the auth token so the widget can make authenticated calls without opening the app); all calls are no-ops on non-iOS platforms.

### Error tracking

Both apps report errors to Sentry (org `softwire-zd`; projects `playlist-manager-web` and `playlist-manager-mobile`), sampled at `tracesSampleRate: 0.2`. Web: `instrumentation.ts` / `instrumentation-client.ts` / `sentry.server.config.ts` / `sentry.edge.config.ts` share their `Sentry.init` options via `sentry.shared.ts`, plus `app/global-error.tsx` for React render errors; DSN in `NEXT_PUBLIC_SENTRY_DSN`. Environment is tagged from `VERCEL_ENV`/`NEXT_PUBLIC_VERCEL_ENV` (falling back to `NODE_ENV`), not `NODE_ENV` alone — Next.js sets `NODE_ENV=production` for every `next build`, including Vercel preview deploys, so `NODE_ENV` alone can't tell preview and production apart. Native: initialized (with an `if (!Sentry.getClient())` guard against Fast Refresh re-init) at the top of `app/_layout.tsx`, root component wrapped in `Sentry.wrap(...)`, DSN in `EXPO_PUBLIC_SENTRY_DSN`; environment comes from `EXPO_PUBLIC_SENTRY_ENVIRONMENT`, set per build profile in `eas.json` (falling back to `__DEV__`) so EAS preview builds don't tag themselves as production — `__DEV__` alone is `false` for any release-mode build. The Expo config plugin is `@sentry/react-native/expo` in `app.json` (org/project set there, not secret).

Source-map upload (readable production stack traces) needs a `SENTRY_AUTH_TOKEN` — both SDKs pick it up from the env automatically, no code references it directly:
- **Web**: `SENTRY_AUTH_TOKEN` in `.env.local` for local builds; must also be set in Vercel's project env vars for deploy builds, since Vercel doesn't read `.env.local`.
- **Native**: `SENTRY_AUTH_TOKEN` in `.env` works for local builds (`expo prebuild` / `run:ios` / `run:android`); for EAS Build it must be set as an EAS secret/env var instead (`eas secret:create` or the Expo dashboard), since EAS's cloud build doesn't see the local `.env`.

Neither is configured yet, so production source maps aren't uploaded until one is added.

<!-- TRIGGER.DEV basic START -->
# Trigger.dev Basic Tasks (v4)

**MUST use `@trigger.dev/sdk`, NEVER `client.defineJob`**

## Basic Task

```ts
import { task } from "@trigger.dev/sdk";

export const processData = task({
  id: "process-data",
  retry: {
    maxAttempts: 10,
    factor: 1.8,
    minTimeoutInMs: 500,
    maxTimeoutInMs: 30_000,
    randomize: false,
  },
  run: async (payload: { userId: string; data: any[] }) => {
    // Task logic - runs for long time, no timeouts
    console.log(`Processing ${payload.data.length} items for user ${payload.userId}`);
    return { processed: payload.data.length };
  },
});
```

## Schema Task (with validation)

```ts
import { schemaTask } from "@trigger.dev/sdk";
import { z } from "zod";

export const validatedTask = schemaTask({
  id: "validated-task",
  schema: z.object({
    name: z.string(),
    age: z.number(),
    email: z.string().email(),
  }),
  run: async (payload) => {
    // Payload is automatically validated and typed
    return { message: `Hello ${payload.name}, age ${payload.age}` };
  },
});
```

## Triggering Tasks

### From Backend Code

```ts
import { tasks } from "@trigger.dev/sdk";
import type { processData } from "./trigger/tasks";

// Single trigger
const handle = await tasks.trigger<typeof processData>("process-data", {
  userId: "123",
  data: [{ id: 1 }, { id: 2 }],
});

// Batch trigger (up to 1,000 items, 3MB per payload)
const batchHandle = await tasks.batchTrigger<typeof processData>("process-data", [
  { payload: { userId: "123", data: [{ id: 1 }] } },
  { payload: { userId: "456", data: [{ id: 2 }] } },
]);
```

### Debounced Triggering

Consolidate multiple triggers into a single execution:

```ts
// Multiple rapid triggers with same key = single execution
await myTask.trigger(
  { userId: "123" },
  {
    debounce: {
      key: "user-123-update",  // Unique key for debounce group
      delay: "5s",              // Wait before executing
    },
  }
);

// Trailing mode: use payload from LAST trigger
await myTask.trigger(
  { data: "latest-value" },
  {
    debounce: {
      key: "trailing-example",
      delay: "10s",
      mode: "trailing",  // Default is "leading" (first payload)
    },
  }
);
```

**Debounce modes:**
- `leading` (default): Uses payload from first trigger, subsequent triggers only reschedule
- `trailing`: Uses payload from most recent trigger

### From Inside Tasks (with Result handling)

```ts
export const parentTask = task({
  id: "parent-task",
  run: async (payload) => {
    // Trigger and continue
    const handle = await childTask.trigger({ data: "value" });

    // Trigger and wait - returns Result object, NOT task output
    const result = await childTask.triggerAndWait({ data: "value" });
    if (result.ok) {
      console.log("Task output:", result.output); // Actual task return value
    } else {
      console.error("Task failed:", result.error);
    }

    // Quick unwrap (throws on error)
    const output = await childTask.triggerAndWait({ data: "value" }).unwrap();

    // Batch trigger and wait
    const results = await childTask.batchTriggerAndWait([
      { payload: { data: "item1" } },
      { payload: { data: "item2" } },
    ]);

    for (const run of results) {
      if (run.ok) {
        console.log("Success:", run.output);
      } else {
        console.log("Failed:", run.error);
      }
    }
  },
});

export const childTask = task({
  id: "child-task",
  run: async (payload: { data: string }) => {
    return { processed: payload.data };
  },
});
```

> Never wrap triggerAndWait or batchTriggerAndWait calls in a Promise.all or Promise.allSettled as this is not supported in Trigger.dev tasks.

## Waits

```ts
import { task, wait } from "@trigger.dev/sdk";

export const taskWithWaits = task({
  id: "task-with-waits",
  run: async (payload) => {
    console.log("Starting task");

    // Wait for specific duration
    await wait.for({ seconds: 30 });
    await wait.for({ minutes: 5 });
    await wait.for({ hours: 1 });
    await wait.for({ days: 1 });

    // Wait until specific date
    await wait.until({ date: new Date("2024-12-25") });

    // Wait for token (from external system)
    await wait.forToken({
      token: "user-approval-token",
      timeoutInSeconds: 3600, // 1 hour timeout
    });

    console.log("All waits completed");
    return { status: "completed" };
  },
});
```

> Never wrap wait calls in a Promise.all or Promise.allSettled as this is not supported in Trigger.dev tasks.

## Key Points

- **Result vs Output**: `triggerAndWait()` returns a `Result` object with `ok`, `output`, `error` properties - NOT the direct task output
- **Type safety**: Use `import type` for task references when triggering from backend
- **Waits > 5 seconds**: Automatically checkpointed, don't count toward compute usage
- **Debounce + idempotency**: Idempotency keys take precedence over debounce settings

## NEVER Use (v2 deprecated)

```ts
// BREAKS APPLICATION
client.defineJob({
  id: "job-id",
  run: async (payload, io) => {
    /* ... */
  },
});
```

Use SDK (`@trigger.dev/sdk`), check `result.ok` before accessing `result.output`

<!-- TRIGGER.DEV basic END -->
