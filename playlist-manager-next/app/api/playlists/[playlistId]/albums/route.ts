import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '../../../withAuth';
import { getPlaylistAlbumsWithGenres } from './handler';

export interface AddAlbumToSpotifyPlaylistRequest {
  albumId: string;
  albumIndex?: number;
}

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

export const POST = withAuth(postAddAlbumPlaylistHandler);
