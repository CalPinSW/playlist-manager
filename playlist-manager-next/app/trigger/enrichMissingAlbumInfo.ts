import { schedules, logger } from '@trigger.dev/sdk';
import prisma from '../../lib/prisma';
import { triggerAlbumEnrichmentBatch } from '../api/albums/utilities/triggerAlbumEnrichment';

// Each enrich-album-info run takes a few seconds and they run one at a time, so cap how
// much backlog one sweep adds; anything left over is picked up by the next tick.
const MAX_ALBUMS_PER_SWEEP = 200;

/**
 * enrichMissingAlbumInfoTask — hourly sweep that queues enrich-album-info for any album
 * with no album_info row yet (i.e. albums added by playlist syncs since the last sweep).
 *
 * The info route only enriches on demand when someone opens an album's info screen; this
 * makes sure albums are already enriched by then, and recovers anything the on-demand
 * trigger missed. Re-queues are deduped by the per-album idempotency key, so an album
 * that's still queued from a previous tick (or from the route) isn't queued twice.
 */
export const enrichMissingAlbumInfoTask = schedules.task({
  id: 'enrich-missing-album-info',
  cron: '0 * * * *',
  maxDuration: 120,
  run: async () => {
    const albums = await prisma.album.findMany({
      where: { album_info: null },
      select: { id: true },
      take: MAX_ALBUMS_PER_SWEEP
    });

    logger.log('enrich-missing-album-info: albums needing enrichment', { count: albums.length });
    if (albums.length > 0) {
      await triggerAlbumEnrichmentBatch(albums.map(album => album.id));
    }

    return { triggered: albums.length };
  }
});
