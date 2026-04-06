import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '../../withAuth';
import prisma from '../../../../lib/prisma';
import { getUserFromRequest } from '../../user/handler';

const getAlbumHandler = async (request: NextRequest, { params }: { params: Promise<{ albumId: string }> }) => {
  try {
    const { albumId } = await params;
    const user = await getUserFromRequest(request);

    const album = await prisma.album.findFirst({
      where: {
        id: albumId,
        playlistalbumrelationship: {
          some: { playlist: { user_id: user.id } }
        }
      },
      include: {
        albumartistrelationship: { include: { artist: true } },
        albumgenrerelationship: { include: { genre: true } },
        tracks: {
          orderBy: [{ disc_number: 'asc' }, { track_number: 'asc' }]
        },
        playlistalbumrelationship: {
          include: { playlist: true },
          where: { playlist: { user_id: user.id } }
        },
        listening_progress: {
          where: { user_id: user.id },
          orderBy: { listened_at: 'desc' },
          take: 1
        },
        album_rating: {
          where: { user_id: user.id },
          take: 1
        }
      }
    });

    if (!album) {
      return NextResponse.json({ error: 'Album not found' }, { status: 404 });
    }

    const shaped = {
      id: album.id,
      name: album.name,
      imageUrl: album.image_url,
      uri: album.uri,
      releaseDate: album.release_date,
      totalTracks: album.total_tracks,
      artists: album.albumartistrelationship.map(r => ({ id: r.artist.id, name: r.artist.name })),
      genres: album.albumgenrerelationship.map(r => r.genre.name),
      tracks: album.tracks.map(t => ({
        id: t.id,
        name: t.name,
        trackNumber: t.track_number,
        discNumber: t.disc_number,
        durationMs: t.duration_ms,
        uri: t.uri
      })),
      onPlaylists: album.playlistalbumrelationship.map(r => ({
        id: r.playlist.id,
        name: r.playlist.name
      })),
      progress: album.listening_progress[0]
        ? {
            lastTrackIndex: album.listening_progress[0].last_track_index,
            totalTracks: album.listening_progress[0].total_tracks,
            listenedAt: album.listening_progress[0].listened_at,
            playlistId: album.listening_progress[0].playlist_id
          }
        : null,
      rating: album.album_rating[0]?.rating ?? null
    };

    return NextResponse.json(shaped, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: error.status || 500 });
  }
};

export const GET = withAuth(getAlbumHandler);
