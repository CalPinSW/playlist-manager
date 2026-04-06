import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '../../../withAuth';
import { getPlaylistAlbumsWithGenres } from './handler';
import { getUserFromRequest } from '../../../user/handler';
import prisma from '../../../../../lib/prisma';

export interface AddAlbumToSpotifyPlaylistRequest {
  albumId: string;
  albumIndex?: number;
}

const getPlaylistAlbumsHandler = async (
  _request: NextRequest,
  { params }: { params: Promise<{ playlistId: string }> }
) => {
  try {
    const { playlistId } = await params;
    const user = await getUserFromRequest();

    // Verify the playlist belongs to the user
    const playlist = await prisma.playlist.findFirst({
      where: { id: playlistId, user_id: user.id }
    });
    if (!playlist) {
      return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });
    }

    const albums = await getPlaylistAlbumsWithGenres(playlistId);

    // Attach listening progress for each album
    const progressRows = await prisma.listening_progress.findMany({
      where: { user_id: user.id, playlist_id: playlistId }
    });
    const progressByAlbum = Object.fromEntries(progressRows.map(p => [p.album_id, p]));

    const shaped = albums.map(album => {
      const prog = progressByAlbum[album.id] ?? null;
      return {
        id: album.id,
        name: album.name,
        imageUrl: album.image_url,
        uri: album.uri,
        totalTracks: album.total_tracks,
        artists: album.artists.map((a: { id: string; name: string }) => ({ id: a.id, name: a.name })),
        genres: album.genres.map((g: { name: string }) => g.name),
        progress: prog
          ? {
              lastTrackIndex: prog.last_track_index,
              totalTracks: prog.total_tracks,
              progressPercent: Math.round(((prog.last_track_index + 1) / prog.total_tracks) * 100)
            }
          : null
      };
    });

    return NextResponse.json(shaped, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: error.status || 500 });
  }
};

const postAddAlbumPlaylistHandler = async (
  request: NextRequest,
  { params }: { params: Promise<{ playlistId: string }> }
) => {
  try {
    const { playlistId } = await params;
    await getPlaylistAlbumsWithGenres(playlistId);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: error.status || 500 });
  }
};

export const GET = withAuth(getPlaylistAlbumsHandler);
export const POST = withAuth(postAddAlbumPlaylistHandler);
