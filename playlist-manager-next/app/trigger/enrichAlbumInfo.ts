import { task, logger } from '@trigger.dev/sdk';
import { enrichAlbumInfo } from '../api/albums/utilities/enrichAlbumInfo';

/**
 * enrichAlbumInfoTask — fetches MusicBrainz genres/type and a Wikipedia summary for one
 * album and persists them (album_info, plus genre/albumgenrerelationship).
 *
 * Fired async (fire-and-forget) by GET /api/albums/[albumId]/info whenever an album's
 * cached info is missing or stale, and by the one-off backfill for existing albums.
 * MusicBrainz enforces a ~1 req/sec rate limit, which is exactly why this runs as a
 * background task rather than inline in the request path.
 */
export const enrichAlbumInfoTask = task({
  id: 'enrich-album-info',
  maxDuration: 60,
  // MusicBrainz enforces ~1 req/sec per client, and that limit is only respected within
  // a single process — so cap this task to one execution at a time across the whole
  // environment rather than relying on musicbrainz-api's in-process queue alone.
  queue: {
    concurrencyLimit: 1
  },
  run: async (payload: { albumId: string }) => {
    const { albumId } = payload;
    logger.log('enrich-album-info triggered', { albumId });

    await enrichAlbumInfo(albumId);

    logger.log('enrich-album-info complete', { albumId });
    return { albumId };
  }
});
