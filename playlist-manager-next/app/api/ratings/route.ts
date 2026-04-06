/**
 * GET  /api/ratings  — all rated albums for the current user, newest/highest first.
 * POST /api/ratings  — upsert a rating (1–10) for an album. Last-write-wins on rated_at.
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '../withAuth';
import prisma from '../../../lib/prisma';
import { getUserFromRequest } from '../user/handler';

// ── GET ────────────────────────────────────────────────────────────────────────

const getRatingsHandler = async (request: NextRequest) => {
  try {
    const user = await getUserFromRequest(request);

    const ratings = await prisma.album_rating.findMany({
      where: { user_id: user.id },
      orderBy: [{ rating: 'desc' }, { rated_at: 'desc' }],
      include: {
        album: {
          include: {
            albumartistrelationship: { include: { artist: true } },
            albumgenrerelationship: { include: { genre: true } }
          }
        }
      }
    });

    const shaped = ratings.map(r => ({
      albumId: r.album_id,
      albumName: r.album.name,
      albumImageUrl: r.album.image_url ?? '',
      albumUri: r.album.uri,
      artists: r.album.albumartistrelationship.map(rel => ({
        id: rel.artist.id,
        name: rel.artist.name
      })),
      genres: r.album.albumgenrerelationship.map(rel => rel.genre.name),
      rating: r.rating,
      ratedAt: r.rated_at
    }));

    return NextResponse.json(shaped, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: error.status || 500 });
  }
};

// ── POST ───────────────────────────────────────────────────────────────────────

const postRatingHandler = async (request: NextRequest) => {
  try {
    const user = await getUserFromRequest(request);
    const body = await request.json();

    const { albumId, rating } = body as { albumId?: string; rating?: number };

    if (!albumId || typeof albumId !== 'string') {
      return NextResponse.json({ error: 'albumId is required' }, { status: 400 });
    }
    if (rating === undefined || typeof rating !== 'number' || !Number.isInteger(rating) || rating < 1 || rating > 10) {
      return NextResponse.json({ error: 'rating must be an integer 1–10' }, { status: 400 });
    }

    // Verify the album belongs to this user (is in one of their playlists).
    const album = await prisma.album.findFirst({
      where: {
        id: albumId,
        playlistalbumrelationship: { some: { playlist: { user_id: user.id } } }
      }
    });
    if (!album) {
      return NextResponse.json({ error: 'Album not found' }, { status: 404 });
    }

    const now = new Date();

    // Upsert: if a rating already exists, only overwrite if the new one is newer
    // (last-write-wins). Since this is a direct user action we always treat it
    // as the latest — just upsert unconditionally.
    const upserted = await prisma.album_rating.upsert({
      where: { album_id_user_id: { album_id: albumId, user_id: user.id } },
      create: { album_id: albumId, user_id: user.id, rating, rated_at: now },
      update: { rating, rated_at: now }
    });

    return NextResponse.json(
      { albumId: upserted.album_id, rating: upserted.rating, ratedAt: upserted.rated_at },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: error.status || 500 });
  }
};

export const GET = withAuth(getRatingsHandler);
export const POST = withAuth(postRatingHandler);
