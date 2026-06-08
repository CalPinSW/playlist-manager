import { task, logger } from '@trigger.dev/sdk';
import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import prisma from '../../lib/prisma';
import { refreshSpotifyAccessToken } from '../api/spotify/utilities/refreshSpotifyAccessToken';
import { refreshSpotifyPlaylist } from '../api/playlists/[playlistId]/refresh/handler';

/**
 * How many hours must pass since the last successful sync before we will
 * re-fetch this playlist from Spotify.
 */
const PLAYLIST_SYNC_THROTTLE_HOURS = 4;

/**
 * syncPlaylistTask — triggered by syncRecentlyPlayed whenever it records new
 * listening progress for an album in a playlist.
 *
 * Self-throttles: if the playlist was already synced within
 * PLAYLIST_SYNC_THROTTLE_HOURS it logs a skip and exits early, so the 15-min
 * recently-played cron doesn't hammer the Spotify API needlessly.
 *
 * Safe to trigger multiple times concurrently for different playlists; each
 * run is isolated by (userId, playlistId).
 */
export const syncPlaylistTask = task({
  id: 'sync-playlist',
  maxDuration: 300,
  run: async (payload: { userId: string; playlistId: string }) => {
    const { userId, playlistId } = payload;
    logger.log('sync-playlist triggered', { userId, playlistId });

    // ── Throttle check ────────────────────────────────────────────────────────
    const playlist = await prisma.playlist.findFirst({
      where: { id: playlistId, user_id: userId },
      select: { id: true, name: true, last_synced_at: true }
    });

    if (!playlist) {
      logger.warn('Playlist not found, skipping', { playlistId, userId });
      return { skipped: true, reason: 'not-found' };
    }

    if (playlist.last_synced_at) {
      const hoursSince =
        (Date.now() - playlist.last_synced_at.getTime()) / (1000 * 60 * 60);
      if (hoursSince < PLAYLIST_SYNC_THROTTLE_HOURS) {
        logger.log('Playlist synced recently — skipping', {
          playlistId,
          playlistName: playlist.name,
          hoursSince: hoursSince.toFixed(2),
          throttleHours: PLAYLIST_SYNC_THROTTLE_HOURS
        });
        return { skipped: true, reason: 'throttled', hoursSince };
      }
    }

    // ── Build Spotify SDK ─────────────────────────────────────────────────────
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      logger.warn('User not found', { userId });
      return { skipped: true, reason: 'user-not-found' };
    }

    await refreshSpotifyAccessToken(
      user as unknown as Parameters<typeof refreshSpotifyAccessToken>[0]
    );

    const tokens = await prisma.access_token.findUnique({ where: { user_id: userId } });
    if (!tokens?.access_token) {
      logger.warn('No access token after refresh', { userId });
      return { skipped: true, reason: 'no-token' };
    }

    const spotifyClientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
    if (!spotifyClientId) throw new Error('NEXT_PUBLIC_SPOTIFY_CLIENT_ID is not set');

    const spotifySdk = SpotifyApi.withAccessToken(spotifyClientId, {
      access_token: tokens.access_token,
      token_type: tokens.token_type ?? 'Bearer',
      expires_in: tokens.expires_in ?? 3600,
      refresh_token: ''
    });

    // ── Sync ──────────────────────────────────────────────────────────────────
    logger.log('Syncing playlist from Spotify', {
      playlistId,
      playlistName: playlist.name
    });

    await refreshSpotifyPlaylist(spotifySdk, userId, playlistId);

    logger.log('Playlist sync complete', { playlistId, playlistName: playlist.name });
    return { synced: true, playlistId, playlistName: playlist.name };
  }
});
