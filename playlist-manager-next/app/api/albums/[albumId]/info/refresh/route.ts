import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { withAuth } from '../../../../withAuth';
import prisma from '../../../../../../lib/prisma';
import { getUserFromRequest } from '../../../../user/handler';
import { triggerAlbumEnrichmentManual } from '../../../utilities/triggerAlbumEnrichment';

/**
 * POST /api/albums/[albumId]/info/refresh — the info screen's manual "Check again".
 *
 * Queues a forced enrichment run for the album regardless of its state: complete albums
 * and ones whose automatic retries have run out are otherwise never looked up again. The
 * run is asynchronous (202) — the client polls GET /api/albums/[albumId]/info until
 * `fetchedAt` changes. Repeat taps within a minute collapse into one run.
 */
const refreshAlbumInfoHandler = async (request: NextRequest, { params }: { params: Promise<{ albumId: string }> }) => {
  try {
    const { albumId } = await params;
    const user = await getUserFromRequest(request);

    const album = await prisma.album.findFirst({
      where: {
        id: albumId,
        playlistalbumrelationship: { some: { playlist: { user_id: user.id } } }
      },
      select: { id: true }
    });
    if (!album) {
      return NextResponse.json({ error: 'Album not found' }, { status: 404 });
    }

    try {
      await triggerAlbumEnrichmentManual(albumId);
    } catch (error) {
      console.error('[albums/info/refresh] failed to trigger enrichment', { albumId, error: String(error) });
      Sentry.captureException(error, { tags: { route: 'albums/info/refresh' }, extra: { albumId } });
      return NextResponse.json({ error: 'Could not queue a refresh' }, { status: 502 });
    }

    return NextResponse.json({ albumId, enrichmentQueued: true }, { status: 202 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: error.status || 500 });
  }
};

export const POST = withAuth(refreshAlbumInfoHandler);
