import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { withAuth } from '../../../withAuth';
import prisma from '../../../../../lib/prisma';
import { getUserFromRequest } from '../../../user/handler';
import { ALBUM_INFO_STALE_DAYS } from '../../utilities/enrichAlbumInfo';
import { triggerAlbumEnrichmentNow } from '../../utilities/triggerAlbumEnrichment';

/**
 * GET /api/albums/[albumId]/info — cached MusicBrainz/Wikipedia/Last.fm enrichment for an
 * album (type, summary, Last.fm listener/playcount stats). Genres from these sources are
 * already in the main album response (GET /api/albums/[albumId]) via the shared
 * genre/albumgenrerelationship tables.
 *
 * Always returns whatever is cached (possibly nothing yet, `pending: true`). If the cache
 * is missing or older than ALBUM_INFO_STALE_DAYS, it queues enrichAlbumInfoTask (deduped
 * per album, prioritised ahead of sweep backlog) — MusicBrainz's ~1 req/sec limit makes
 * the enrichment itself unsuitable to run inline, so the client polls this route while
 * `pending` to pick up the result once the background task completes. The trigger call
 * itself is awaited (it's one quick HTTP call) rather than deferred to `after()`, so a
 * failure to queue is reported to Sentry and surfaced as `enrichmentQueued: false` instead
 * of leaving the client polling for a run that will never happen. The hourly
 * enrich-missing-album-info sweep is the safety net either way.
 */
const getAlbumInfoHandler = async (request: NextRequest, { params }: { params: Promise<{ albumId: string }> }) => {
  try {
    const { albumId } = await params;
    const user = await getUserFromRequest(request);

    const album = await prisma.album.findFirst({
      where: {
        id: albumId,
        playlistalbumrelationship: { some: { playlist: { user_id: user.id } } }
      },
      include: { album_info: true }
    });

    if (!album) {
      return NextResponse.json({ error: 'Album not found' }, { status: 404 });
    }

    const staleMs = ALBUM_INFO_STALE_DAYS * 24 * 60 * 60 * 1000;
    const isStale = !album.album_info || Date.now() - album.album_info.fetched_at.getTime() > staleMs;

    let queued = false;
    if (isStale) {
      try {
        await triggerAlbumEnrichmentNow(albumId);
        queued = true;
      } catch (error) {
        console.error('[albums/info] failed to trigger enrichment', { albumId, error: String(error) });
        Sentry.captureException(error, { tags: { route: 'albums/info' }, extra: { albumId } });
      }
    }

    const info = album.album_info;
    return NextResponse.json(
      {
        albumId,
        type: info?.mb_type ?? null,
        summary: info?.summary ?? null,
        summaryHtml: info?.summary_html ?? null,
        listeners: info?.lastfm_listeners ?? null,
        playcount: info?.lastfm_playcount ?? null,
        fetchedAt: info?.fetched_at ?? null,
        pending: !info,
        // Whether an enrichment run is queued as of this response. `pending` without this
        // means queuing failed, so the client shouldn't poll for a result that isn't coming.
        enrichmentQueued: queued
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: error.status || 500 });
  }
};

export const GET = withAuth(getAlbumInfoHandler);
