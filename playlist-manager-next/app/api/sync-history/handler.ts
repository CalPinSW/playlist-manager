import { NextRequest, after } from 'next/server';
import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import prisma from '../../../lib/prisma';
import { getUserFromRequest } from '../user/handler';
import { syncForUser } from '../../trigger/syncRecentlyPlayed';
import { refreshSpotifyPlaylists } from '../playlists/refresh/handler';

/**
 * How many hours must pass before an app-open will kick another background
 * playlist-discovery refresh for the same user. The weekly
 * `update-users-playlist-data-scheduled` cron is the backstop; this just makes
 * newly-created "New Albums DD/MM/YY" playlists show up within hours instead of
 * up to a week.
 */
export const PLAYLIST_DISCOVERY_THROTTLE_HOURS = 12;

/**
 * On-demand recently-played sync for the authenticated user.
 *
 * Called by the Expo app on every open (after auth) so that listening progress
 * is up to date before the user sees the Now tab. Runs synchronously — the
 * Spotify recently_played call + batch DB ops typically complete in <3 seconds.
 *
 * The Trigger.dev scheduled task (every 15 min) is a background safety net;
 * this route is the foreground trigger for a fresh experience on app open.
 *
 * After the response is sent, and at most once per
 * PLAYLIST_DISCOVERY_THROTTLE_HOURS, it also kicks a background playlist
 * discovery/refresh so new playlists are picked up without waiting for the
 * weekly cron. This runs in `after()` so it never adds latency to app open.
 */
export const syncHistory = async (req: NextRequest): Promise<{ synced: boolean; message: string }> => {
  const user = await getUserFromRequest(req);

  // Fetch user with access_token included (required by syncForUser).
  const userWithToken = await prisma.user.findUnique({
    where: { id: user.id },
    include: { access_token: true }
  });

  if (!userWithToken) {
    throw new Error('User not found');
  }

  await syncForUser(userWithToken);

  await maybeSchedulePlaylistDiscovery(user.id);

  return { synced: true, message: 'Sync complete' };
};

/**
 * If this user's last playlist discovery was long enough ago, stamp the cursor
 * now (so rapid re-opens don't double-run) and schedule the refresh to run
 * after the response is sent.
 */
async function maybeSchedulePlaylistDiscovery(userId: string): Promise<void> {
  const syncLog = await prisma.sync_log.findUnique({ where: { user_id: userId } });
  const lastRun = syncLog?.last_playlist_discovery_at?.getTime();
  const throttleMs = PLAYLIST_DISCOVERY_THROTTLE_HOURS * 60 * 60 * 1000;

  if (lastRun && Date.now() - lastRun < throttleMs) {
    return;
  }

  // Stamp up front — a failure just means we wait for the next window (or the
  // weekly cron), consistent with the no-retries policy on the sync tasks.
  await prisma.sync_log.upsert({
    where: { user_id: userId },
    create: { user_id: userId, last_playlist_discovery_at: new Date() },
    update: { last_playlist_discovery_at: new Date() }
  });

  after(async () => {
    try {
      // syncForUser has just refreshed the Spotify access token, so the stored
      // row is fresh — build an SDK straight from it.
      const tokens = await prisma.access_token.findUnique({ where: { user_id: userId } });
      if (!tokens?.access_token) {
        console.warn('[sync-history] playlist discovery skipped — no access token', { userId });
        return;
      }

      const spotifyClientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
      if (!spotifyClientId) {
        throw new Error('NEXT_PUBLIC_SPOTIFY_CLIENT_ID is not set');
      }

      const spotifySdk = SpotifyApi.withAccessToken(spotifyClientId, {
        access_token: tokens.access_token,
        token_type: tokens.token_type ?? 'Bearer',
        expires_in: tokens.expires_in ?? 3600,
        refresh_token: ''
      });

      await refreshSpotifyPlaylists(spotifySdk, userId);
      console.log('[sync-history] background playlist discovery complete', { userId });
    } catch (err) {
      console.error('[sync-history] background playlist discovery failed', {
        userId,
        error: String(err)
      });
    }
  });
}
