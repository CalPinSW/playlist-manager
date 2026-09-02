import { NextRequest, NextResponse, after } from 'next/server';
import { withAuth } from '../../../withAuth';
import prisma from '../../../../../lib/prisma';
import { getUserFromRequest } from '../../../user/handler';
import { enrichAlbumInfoTask } from '../../../../trigger/enrichAlbumInfo';
import { ALBUM_INFO_STALE_DAYS } from '../../utilities/enrichAlbumInfo';

/**
 * GET /api/albums/[albumId]/info — cached MusicBrainz/Wikipedia/Last.fm enrichment for an
 * album (type, summary, Last.fm listener/playcount stats). Genres from these sources are
 * already in the main album response (GET /api/albums/[albumId]) via the shared
 * genre/albumgenrerelationship tables.
 *
 * Always returns whatever is cached (possibly nothing yet, `pending: true`). If the cache
 * is missing or older than ALBUM_INFO_STALE_DAYS, it fires enrichAlbumInfoTask after the
 * response is sent (`after()`) — MusicBrainz's ~1 req/sec limit makes it unsuitable to
 * run inline, so the client just re-fetches this route on a later visit to pick up the
 * result once the background task completes.
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

    if (isStale) {
      after(async () => {
        try {
          await enrichAlbumInfoTask.trigger({ albumId });
        } catch (error) {
          console.error('[albums/info] failed to trigger enrichment', { albumId, error: String(error) });
        }
      });
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
        pending: !info
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: error.status || 500 });
  }
};

export const GET = withAuth(getAlbumInfoHandler);
