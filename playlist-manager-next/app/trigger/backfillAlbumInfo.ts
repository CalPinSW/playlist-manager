import { task, logger } from '@trigger.dev/sdk';
import prisma from '../../lib/prisma';
import { triggerAlbumEnrichmentBatch } from '../api/albums/utilities/triggerAlbumEnrichment';

/**
 * backfillAlbumInfoTask — queues enrich-album-info for existing albums in one go, instead
 * of waiting for the hourly sweep to work through them 200 at a time. Not scheduled —
 * trigger manually from the Trigger.dev dashboard (Test tab) or
 * `npx trigger.dev@latest trigger backfill-album-info`.
 *
 * Payload (all optional):
 *   - `all: true`  — re-enrich every album, including complete ones and ones whose
 *                    automatic retries have run out, re-fetching artist bios too.
 *   - default      — albums with no album_info row, plus incomplete ones whose scheduled
 *                    re-check has come up. Right after the artist-bio/reception migration
 *                    that is every existing album, since it marks them all due.
 *
 * Safe to batch-trigger every match at once: enrich-album-info has
 * queue.concurrencyLimit: 1, so Trigger.dev serializes the actual MusicBrainz calls
 * regardless of how many runs are queued here. Expect roughly 5-10 seconds per album.
 * Albums queued within the last 6h are skipped by the per-album idempotency key.
 */
export const backfillAlbumInfoTask = task({
  id: 'backfill-album-info',
  maxDuration: 300,
  run: async (payload: { all?: boolean } | undefined) => {
    const all = payload?.all === true;
    const albums = await prisma.album.findMany({
      where: all
        ? {}
        : {
            OR: [{ album_info: null }, { album_info: { next_refresh_at: { lte: new Date() } } }]
          },
      select: { id: true }
    });

    logger.log('backfill-album-info: albums to enrich', { count: albums.length, all });

    await triggerAlbumEnrichmentBatch(
      albums.map(album => album.id),
      { force: all }
    );

    return { triggered: albums.length, all };
  }
});
