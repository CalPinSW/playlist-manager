import { idempotencyKeys, tasks } from '@trigger.dev/sdk';
import type { enrichAlbumInfoTask } from '../../../trigger/enrichAlbumInfo';

// enrich-album-info runs one at a time (MusicBrainz rate limit), so an album that's
// already queued must not be queued again every time someone re-opens its info screen
// or the sweep re-finds it. A global idempotency key per album dedupes those for this
// long; after it expires a still-missing album can be retried.
const ENRICHMENT_DEDUPE_TTL = '6h';

// Someone is looking at this album's info screen right now, so jump it ahead of any
// sweep/backfill backlog in the concurrency-1 queue (priority is in seconds).
const ON_DEMAND_PRIORITY_SECONDS = 3600;

const BATCH_SIZE = 1000; // Trigger.dev's max items per batchTrigger call

async function enrichmentKey(albumId: string) {
  // scope: 'global' — inside a task the default ('run') would scope the key to the
  // parent run, so the route and the sweep wouldn't dedupe against each other.
  return idempotencyKeys.create(`enrich-album-info:${albumId}`, { scope: 'global' });
}

/** Queue enrichment for one album the user is actively viewing. */
export async function triggerAlbumEnrichmentNow(albumId: string) {
  return tasks.trigger<typeof enrichAlbumInfoTask>(
    'enrich-album-info',
    { albumId },
    {
      idempotencyKey: await enrichmentKey(albumId),
      idempotencyKeyTTL: ENRICHMENT_DEDUPE_TTL,
      priority: ON_DEMAND_PRIORITY_SECONDS
    }
  );
}

/** Queue background enrichment for many albums (sweep / backfill). */
export async function triggerAlbumEnrichmentBatch(albumIds: string[]) {
  for (let i = 0; i < albumIds.length; i += BATCH_SIZE) {
    const chunk = albumIds.slice(i, i + BATCH_SIZE);
    const items = await Promise.all(
      chunk.map(async albumId => ({
        payload: { albumId },
        options: { idempotencyKey: await enrichmentKey(albumId), idempotencyKeyTTL: ENRICHMENT_DEDUPE_TTL }
      }))
    );
    await tasks.batchTrigger<typeof enrichAlbumInfoTask>('enrich-album-info', items);
  }
}
