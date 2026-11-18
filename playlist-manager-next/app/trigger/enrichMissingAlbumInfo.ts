import { schedules, logger } from '@trigger.dev/sdk';
import prisma from '../../lib/prisma';
import { triggerAlbumEnrichmentBatch } from '../api/albums/utilities/triggerAlbumEnrichment';

// Each enrich-album-info run takes several seconds and they run one at a time, so cap how
// much backlog one sweep adds; anything left over is picked up by the next tick.
const MAX_ALBUMS_PER_SWEEP = 200;

/**
 * enrichMissingAlbumInfoTask — hourly sweep that queues enrich-album-info for any album
 * with no album_info row yet, then (with whatever capacity is left) for incomplete albums
 * whose next_refresh_at has passed. Rows with next_refresh_at null are complete or have
 * used up their retries, and are never picked up here.
 *
 * The re-check half is what fills in new releases over time — on release day there is
 * usually no Wikipedia article or review to find, so enrichAlbumInfo schedules re-checks
 * with exponential backoff (see scheduleNextRefresh) and this sweep runs them.
 *
 * Playlist syncs and the info route also queue enrichment directly; this is the safety
 * net for both. Re-queues are deduped by the per-album idempotency key, so an album
 * that's still queued from a previous tick (or from the route) isn't queued twice.
 */
export const enrichMissingAlbumInfoTask = schedules.task({
  id: 'enrich-missing-album-info',
  cron: '0 * * * *',
  maxDuration: 120,
  run: async () => {
    const missing = await prisma.album.findMany({
      where: { album_info: null },
      select: { id: true },
      take: MAX_ALBUMS_PER_SWEEP
    });

    const due =
      missing.length < MAX_ALBUMS_PER_SWEEP
        ? await prisma.album_info.findMany({
            where: { next_refresh_at: { lte: new Date() } },
            select: { album_id: true },
            orderBy: { next_refresh_at: 'asc' }, // most overdue first
            take: MAX_ALBUMS_PER_SWEEP - missing.length
          })
        : [];

    logger.log('enrich-missing-album-info: albums needing enrichment', {
      missing: missing.length,
      dueRefresh: due.length
    });

    const albumIds = [...missing.map(album => album.id), ...due.map(info => info.album_id)];
    if (albumIds.length > 0) {
      await triggerAlbumEnrichmentBatch(albumIds);
    }

    return { triggered: albumIds.length, missing: missing.length, dueRefresh: due.length };
  }
});
