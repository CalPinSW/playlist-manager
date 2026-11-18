import { task, logger } from '@trigger.dev/sdk';
import { enrichAlbumInfo } from '../api/albums/utilities/enrichAlbumInfo';

/**
 * enrichAlbumInfoTask — for one album, fetches MusicBrainz genres/type and review links, a
 * Wikipedia summary + critical-reception section, Last.fm stats, and a bio for its
 * artists, and persists them (album_info, artist_info, genre/albumgenrerelationship).
 *
 * Queued (via app/api/albums/utilities/triggerAlbumEnrichment.ts, deduped per album) when
 * a playlist sync adds a new album, by GET /api/albums/[albumId]/info whenever an album's
 * cached info is missing or due a re-check, by POST /api/albums/[albumId]/info/refresh
 * (the info screen's manual "Check again"), by the hourly enrich-missing-album-info
 * sweep, and by the backfill.
 * MusicBrainz enforces a ~1 req/sec rate limit, which is exactly why this runs as a
 * background task rather than inline in the request path.
 */
export const enrichAlbumInfoTask = task({
  id: 'enrich-album-info',
  // Up to ~6 rate-limited MusicBrainz calls plus Wikipedia/Last.fm round trips.
  maxDuration: 120,
  // MusicBrainz enforces ~1 req/sec per client, and that limit is only respected within
  // a single process — so cap this task to one execution at a time across the whole
  // environment rather than relying on musicbrainz-api's in-process queue alone.
  queue: {
    concurrencyLimit: 1
  },
  run: async (payload: { albumId: string; force?: boolean }) => {
    const { albumId, force } = payload;
    logger.log('enrich-album-info triggered', { albumId, force: !!force });

    await enrichAlbumInfo(albumId, { force });

    logger.log('enrich-album-info complete', { albumId });
    return { albumId };
  }
});
