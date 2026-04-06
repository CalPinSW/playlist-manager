import { schedules } from '@trigger.dev/sdk';
import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import prisma from '../../lib/prisma';
import { refreshSpotifyAccessToken } from '../api/spotify/utilities/refreshSpotifyAccessToken';
import { NEW_ALBUMS_REGEX } from '../utils/playlistFilters';

/**
 * syncRecentlyPlayed — runs every 15 minutes via Trigger.dev scheduler.
 *
 * Algorithm:
 *   1. For each user, fetch their New Albums playlists from the DB.
 *   2. Call Spotify's GET /me/player/recently-played with a cursor from sync_log.
 *   3. Batch-resolve track → album → playlist using a single Prisma query
 *      (all data is already in the DB from updatePlaylistData).
 *   4. Group by album; upsert listening_progress only when last_track_index advances.
 *   5. Save the most recent played_at as the new cursor in sync_log.
 *
 * No Spotify API calls are made for reconciliation — only one call per user
 * for recently_played itself. Zero N+1 queries.
 */
export const syncRecentlyPlayedTask = schedules.task({
  id: 'sync-recently-played',
  cron: '*/15 * * * *',
  maxDuration: 120,
  run: async () => {
    const users = await prisma.user.findMany({
      include: { access_token: true }
    });

    console.log('Starting recently-played sync', { userCount: users.length });

    for (const user of users) {
      try {
        await syncForUser(user);
      } catch (err) {
        // Log and continue — a single user failure should not abort the whole run.
        console.error('Sync failed for user', { userId: user.id, error: String(err) });
      }
    }

    console.log('Sync run complete');
  }
});

export async function syncForUser(user: { id: string; access_token: { refresh_token: string | null } | null }) {
  if (!user.access_token?.refresh_token) {
    console.log('Skipping user — no refresh token', { userId: user.id });
    return;
  }

  const spotifyClientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
  if (!spotifyClientId) {
    throw new Error('NEXT_PUBLIC_SPOTIFY_CLIENT_ID is not set in server environment');
  }

  // Refresh the Spotify access token (transaction-wrapped to prevent token loss).
  await refreshSpotifyAccessToken(user as unknown as Parameters<typeof refreshSpotifyAccessToken>[0]);

  const tokens = await prisma.access_token.findUnique({ where: { user_id: user.id } });
  if (!tokens?.access_token) {
    console.warn('No access token after refresh, skipping', { userId: user.id });
    return;
  }

  const spotifySdk = SpotifyApi.withAccessToken(spotifyClientId, {
    access_token: tokens.access_token,
    token_type: tokens.token_type ?? 'Bearer',
    expires_in: tokens.expires_in ?? 3600,
    refresh_token: ''
  });

  // ── Step 1: Identify active New Albums playlists for this user ──────────────
  const playlists = await prisma.playlist.findMany({
    where: { user_id: user.id },
    select: { id: true, name: true }
  });

  const activePlaylistIds = playlists.filter(p => NEW_ALBUMS_REGEX.test(p.name)).map(p => p.id);

  if (activePlaylistIds.length === 0) {
    console.log('No New Albums playlists found, skipping', { userId: user.id });
    return;
  }

  // ── Step 2: Fetch recently played with cursor ────────────────────────────────
  const syncLog = await prisma.sync_log.findUnique({ where: { user_id: user.id } });
  const afterCursor = syncLog?.last_played_at?.getTime();

  // Spotify's recently_played returns up to 50 items, newest first.
  // If >50 tracks play between cron runs the gap is lost — acceptable in practice.
  const recentlyPlayedResponse = await spotifySdk.player.getRecentlyPlayedTracks(
    50,
    afterCursor ? { type: 'after', timestamp: afterCursor } : undefined
  );

  const items = recentlyPlayedResponse.items;
  if (items.length === 0) {
    console.log('No new recently-played items', { userId: user.id });
    await updateSyncLog(user.id, null);
    return;
  }

  console.log('Recently-played items fetched', { userId: user.id, count: items.length });

  // ── Step 3: Batch-resolve track → album → playlist (single Prisma query) ────
  const trackIds = [...new Set(items.map(item => item.track?.id).filter((id): id is string => typeof id === 'string'))];

  const trackMappings = await prisma.track.findMany({
    where: { id: { in: trackIds } },
    include: {
      album: {
        include: {
          playlistalbumrelationship: {
            where: { playlist_id: { in: activePlaylistIds } }
          }
        }
      }
    }
  });

  // Build a lookup: trackId → { albumId, totalTracks, playlistId }
  type TrackInfo = { albumId: string; totalTracks: number; playlistId: string };
  const trackInfoMap = new Map<string, TrackInfo>();

  for (const track of trackMappings) {
    for (const rel of track.album.playlistalbumrelationship) {
      // A track may appear in multiple playlists — record all.
      trackInfoMap.set(`${track.id}:${rel.playlist_id}`, {
        albumId: track.album_id,
        totalTracks: track.album.total_tracks,
        playlistId: rel.playlist_id
      });
    }
  }

  // ── Step 4: Group by (album, playlist), take highest track_number seen ───────
  // Key: `${albumId}:${playlistId}`
  type ProgressAccumulator = {
    albumId: string;
    playlistId: string;
    totalTracks: number;
    lastTrackIndex: number; // 0-based (track_number - 1)
    listenedAt: Date;
  };

  const progressMap = new Map<string, ProgressAccumulator>();

  for (const item of items) {
    const trackId = item.track?.id;
    if (!trackId) continue;

    const playedAt = new Date(item.played_at);

    // A track may match multiple playlists — process all.
    for (const [key, info] of trackInfoMap) {
      if (!key.startsWith(trackId + ':')) continue;

      const progressKey = `${info.albumId}:${info.playlistId}`;
      const existing = progressMap.get(progressKey);

      // Find the track's track_number from our fetched mappings.
      const trackRow = trackMappings.find(t => t.id === trackId);
      const trackIndex = (trackRow?.track_number ?? 1) - 1; // convert to 0-based

      if (!existing || trackIndex > existing.lastTrackIndex) {
        progressMap.set(progressKey, {
          albumId: info.albumId,
          playlistId: info.playlistId,
          totalTracks: info.totalTracks,
          lastTrackIndex: trackIndex,
          listenedAt: playedAt
        });
      } else if (trackIndex === existing.lastTrackIndex && playedAt > existing.listenedAt) {
        // Same index, more recent play — update timestamp only.
        progressMap.set(progressKey, { ...existing, listenedAt: playedAt });
      }
    }
  }

  // ── Step 5: Upsert listening_progress — only advance, never regress ──────────
  let upsertCount = 0;

  for (const progress of progressMap.values()) {
    const existing = await prisma.listening_progress.findUnique({
      where: {
        user_id_album_id_playlist_id: {
          user_id: user.id,
          album_id: progress.albumId,
          playlist_id: progress.playlistId
        }
      }
    });

    if (existing && existing.last_track_index >= progress.lastTrackIndex) {
      // Already at or past this point — do not regress.
      continue;
    }

    await prisma.listening_progress.upsert({
      where: {
        user_id_album_id_playlist_id: {
          user_id: user.id,
          album_id: progress.albumId,
          playlist_id: progress.playlistId
        }
      },
      create: {
        user_id: user.id,
        album_id: progress.albumId,
        playlist_id: progress.playlistId,
        last_track_index: progress.lastTrackIndex,
        total_tracks: progress.totalTracks,
        listened_at: progress.listenedAt,
        source: 'recently_played'
      },
      update: {
        last_track_index: progress.lastTrackIndex,
        total_tracks: progress.totalTracks,
        listened_at: progress.listenedAt,
        source: 'recently_played'
      }
    });

    upsertCount++;
  }

  console.log('Progress upserts complete', { userId: user.id, upsertCount });

  // ── Step 6: Advance the cursor ───────────────────────────────────────────────
  // items[0] is the most recent (Spotify returns newest first).
  const mostRecentPlayedAt = new Date(items[0].played_at);
  await updateSyncLog(user.id, mostRecentPlayedAt);
}

async function updateSyncLog(userId: string, lastPlayedAt: Date | null) {
  await prisma.sync_log.upsert({
    where: { user_id: userId },
    create: {
      user_id: userId,
      last_played_at: lastPlayedAt,
      last_run_at: new Date()
    },
    update: {
      ...(lastPlayedAt !== null && { last_played_at: lastPlayedAt }),
      last_run_at: new Date()
    }
  });
}
