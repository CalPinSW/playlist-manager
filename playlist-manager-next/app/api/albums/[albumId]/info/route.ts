import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { withAuth } from '../../../withAuth';
import prisma from '../../../../../lib/prisma';
import { getUserFromRequest } from '../../../user/handler';
import { albumInfoIsDue } from '../../utilities/enrichAlbumInfo';
import { triggerAlbumEnrichmentNow } from '../../utilities/triggerAlbumEnrichment';

/**
 * GET /api/albums/[albumId]/info — cached enrichment for an album: MusicBrainz type, a
 * summary (Wikipedia, else Last.fm), the Wikipedia "Critical reception" section, review
 * links from MusicBrainz, Last.fm listener/playcount stats, and a bio for each of the
 * album's artists that has one cached (artist_info). Genres from these sources are
 * already in the main album response (GET /api/albums/[albumId]) via the shared
 * genre/albumgenrerelationship tables.
 *
 * Always returns whatever is cached (possibly nothing yet, `pending: true`). If the cache
 * is missing or an incomplete album's scheduled re-check (next_refresh_at) has come up, it queues enrichAlbumInfoTask (deduped per
 * album, prioritised ahead of sweep backlog) — MusicBrainz's ~1 req/sec limit makes the
 * enrichment itself unsuitable to run inline, so the client polls this route while
 * `enrichmentQueued` to pick up the result once the background task completes. The
 * trigger call itself is awaited (it's one quick HTTP call) rather than deferred to
 * `after()`, so a failure to queue is reported to Sentry and surfaced as
 * `enrichmentQueued: false` instead of leaving the client polling for a run that will
 * never happen. The hourly enrich-missing-album-info sweep is the safety net either way.
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
      include: {
        album_info: true,
        albumartistrelationship: { orderBy: { id: 'asc' }, include: { artist: { include: { artist_info: true } } } }
      }
    });

    if (!album) {
      return NextResponse.json({ error: 'Album not found' }, { status: 404 });
    }

    const isStale = albumInfoIsDue(album.album_info);

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
    const artists = album.albumartistrelationship
      .filter(rel => rel.artist.artist_info?.bio)
      .map(rel => ({
        id: rel.artist.id,
        name: rel.artist.name,
        description: rel.artist.artist_info.description,
        bio: rel.artist.artist_info.bio,
        bioSource: rel.artist.artist_info.bio_source,
        url: rel.artist.artist_info.url
      }));
    return NextResponse.json(
      {
        albumId,
        type: info?.mb_type ?? null,
        summary: info?.summary ?? null,
        summaryHtml: info?.summary_html ?? null,
        summarySource: info?.summary_source ?? null,
        wikipediaUrl: info?.wikipedia_url ?? null,
        reception: info?.reception ?? null,
        reviewLinks: Array.isArray(info?.review_links) ? info.review_links : [],
        artists,
        listeners: info?.lastfm_listeners ?? null,
        playcount: info?.lastfm_playcount ?? null,
        fetchedAt: info?.fetched_at ?? null,
        // When the next automatic re-check is scheduled; null once the info is complete or
        // the retries have run out (POST .../info/refresh still re-checks on demand).
        nextRefreshAt: info?.next_refresh_at ?? null,
        pending: !info,
        // Whether an enrichment run is queued as of this response — either the first one
        // (`pending`) or a refresh of info that was due. `pending` without this means
        // queuing failed, so the client shouldn't poll for a result that isn't coming.
        enrichmentQueued: queued
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: error.status || 500 });
  }
};

export const GET = withAuth(getAlbumInfoHandler);
