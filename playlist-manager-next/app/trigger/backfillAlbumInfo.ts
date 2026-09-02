import { task, logger } from '@trigger.dev/sdk';
import prisma from '../../lib/prisma';
import { enrichAlbumInfoTask } from './enrichAlbumInfo';

// Trigger.dev enforces a max of 1000 items per batchTrigger call.
const BATCH_SIZE = 1000;

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

    for (let i = 0; i < albums.length; i += BATCH_SIZE) {
      const chunk = albums.slice(i, i + BATCH_SIZE);
      await enrichAlbumInfoTask.batchTrigger(chunk.map(album => ({ payload: { albumId: album.id } })));
    }

    return { triggered: albums.length };
  }
});
