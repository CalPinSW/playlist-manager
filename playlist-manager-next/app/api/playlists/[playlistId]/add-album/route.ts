import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import { NextRequest, NextResponse } from 'next/server';
import { access_token } from '../../../../../generated/prisma';
import { withAuth } from '../../../withAuth';
import { withSpotifyAccessToken } from '../../../spotify/utilities/getAccessTokensFromRequest';
import { addAlbumToPlaylist } from './handler';

export interface AddAlbumToSpotifyPlaylistRequest {
  albumId: string;
  albumIndex?: number;
}

const postAddAlbumPlaylistHandler = async (
  access_tokens: access_token,
  request: NextRequest,
  { params }: { params: Promise<{ playlistId: string }> }
) => {
  try {
    const { playlistId } = await params;
    const requestBody: AddAlbumToSpotifyPlaylistRequest = await request.json();
    const spotifySdk = SpotifyApi.withAccessToken(process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID, access_tokens);
    await addAlbumToPlaylist(spotifySdk, playlistId, requestBody);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: error.status || 500 });
  }
};

export const POST = withAuth(withSpotifyAccessToken(postAddAlbumPlaylistHandler));
