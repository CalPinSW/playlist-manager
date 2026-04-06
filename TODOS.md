# TODOS

Captured by /plan-eng-review on 2026-04-04 (branch: claude/great-dijkstra).

---

## [ ] Migrate web app playback reads to `listening_progress`

**What:** Update all web app code that reads `playbackstatealbumrelationship`,
`playbackstateplaylistrelationship`, and `playback_state` to instead read from the
new `listening_progress` model.

**Why:** Weekend 1 renames/replaces these tables. If the web app still reads the old
tables, the album progress UI will show stale or missing data after the migration.

**Context:** The migration in Weekend 1 creates `listening_progress` and copies data
across. But the web app routes (anything using `playbackstatealbumrelationship` in
Prisma queries) still reference the old model names. This needs to happen in the same
PR as the data migration — not before, not after.

Search for: `prisma.playback_state`, `prisma.playbackstatealbumrelationship`,
`prisma.playbackstateplaylistrelationship` across `app/` and `lib/`.

**Depends on:** Weekend 1 schema migration.

---

## [ ] Extend `withAuth()` to accept Auth0 Bearer tokens from mobile

**What:** Update `app/api/withAuth.ts` to validate Auth0 Bearer tokens sent from the
native Expo app alongside the existing Auth0 session cookie approach.

**Why:** The current `withAuth()` only calls `auth0.getSession()` which reads a
session cookie. The native app sends an Auth0 access token as a `Authorization: Bearer`
header. Without this change, every native app API call returns 401.

**Context:** Use Auth0's JWKS endpoint to verify the token:
```ts
// In withAuth(), check Authorization header first:
const authHeader = req.headers.get('Authorization');
if (authHeader?.startsWith('Bearer ')) {
  const token = authHeader.slice(7);
  // Verify against Auth0 JWKS: https://{AUTH0_DOMAIN}/.well-known/jwks.json
  // Library: jose (already available) or auth0's own verifier
}
```
Auth0 domain is already in env vars. The JWT contains `sub` which maps to `auth0_id`
on the user model.

**Depends on:** Weekend 2 (Expo app scaffold).

---

## [ ] Drop legacy `playback_state` tables after validating `listening_progress`

**What:** Run a cleanup Prisma migration to drop `playback_state`,
`playbackstatealbumrelationship`, and `playbackstateplaylistrelationship`.

**Why:** After the rename migration in Weekend 1, these legacy tables still exist in
the DB. They occupy space and create confusion. Once `listening_progress` has been
running correctly for ~1 week, the legacy tables should be dropped.

**Context:** Do NOT drop in the same migration as the rename — too risky. The safe
sequence is: (1) add new tables + copy data, (2) update all app reads/writes, (3)
deploy and validate for ~1 week, (4) then drop old tables in a separate migration.

**Depends on:** "Migrate web app playback reads" TODO above being complete and
validated in production.

---

## [ ] Add pull-to-refresh on Albums tab to trigger playlist + progress sync

**What:** Add a `RefreshControl` to the Albums tab `FlatList`. On pull, call both
`updatePlaylistData` and `syncRecentlyPlayed` for the current user.

**Why:** The Saturday midnight cron is too infrequent for the Friday ritual. A new
"New Albums DD/MM/YY" playlist created on Friday won't appear in the app until Saturday
without this. Pull-to-refresh is the manual escape hatch.

**Context:** Also call `updatePlaylistData` on every app open (not just `syncRecentlyPlayed`).
The Trigger.dev scheduled task remains as a safety net.

**Depends on:** Weekend 2 (Expo app scaffold with Albums tab).

---

## [ ] Add accessibilityLabel to all interactive native elements

**What:** Before shipping the native app to TestFlight, add `accessibilityLabel`,
`accessibilityRole`, and `accessibilityValue` props to: album art images, star rating
touchables, promote button, progress bar view, track row touchables.

**Why:** Without these, VoiceOver reads nothing useful. 10 lines of code, non-negotiable
for a well-made app even for personal use.

**Context:** Progress bar specifically needs:
```tsx
<View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: pct }} />
```
iOS widget: set `.accessibilityLabel` on the root WidgetKit view (whole widget = one label).

**Depends on:** Weekend 2–3 (when the screens exist).
