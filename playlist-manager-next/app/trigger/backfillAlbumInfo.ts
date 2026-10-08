import { task, logger } from '@trigger.dev/sdk';
import prisma from '../../lib/prisma';
import { triggerAlbumEnrichmentBatch } from '../api/albums/utilities/triggerAlbumEnrichment';

/**
 * backfillAlbumInfoTask — one-off backfill for albums that predate the enrich-album-info
 * pipeline: anything with no album_info row yet, or with zero genres linked (the bug this
 * pipeline fixes). Not scheduled — trigger manually once from the Trigger.dev dashboard
 * (or `npx trigger.dev@latest trigger backfill-album-info`) after deploying.
 *
 * Safe to batch-trigger every match at once: enrich-album-info has
 * queue.concurrencyLimit: 1, so Trigger.dev serializes the actual MusicBrainz calls
 * regardless of how many runs are queued here.
 */
export const backfillAlbumInfoTask = task({
  id: 'backfill-album-info',
  maxDuration: 120,
  run: async () => {
    const albums = await prisma.album.findMany({
      where: {
        OR: [{ album_info: null }, { albumgenrerelationship: { none: {} } }]
      },
      select: { id: true }
    });

    logger.log('backfill-album-info: albums needing enrichment', { count: albums.length });

    await triggerAlbumEnrichmentBatch(albums.map(album => album.id));

    return { triggered: albums.length };
  }
});
