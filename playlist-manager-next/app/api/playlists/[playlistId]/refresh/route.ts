import { NextRequest, NextResponse } from 'next/server';
import { refreshSpotifyPlaylist } from './handler';
import { access_token } from '../../../../../generated/prisma';
import { getUserFromRequest } from '../../../user/handler';
import { withAuth } from '../../../withAuth';
import { withSpotifyAccessToken } from '../../../spotify/utilities/getAccessTokensFromRequest';
import { SpotifyApi } from '@spotify/web-api-ts-sdk';

const getRefreshSpotifyPlaylistHandler = async (
  access_tokens: access_token,
  _request: NextRequest,
  { params }: { params: Promise<{ playlistId: string }> }
) => {
  try {
    const { playlistId } = await params;
    const user = await getUserFromRequest();
    const spotifySdk = SpotifyApi.withAccessToken(process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID, access_tokens);
    await refreshSpotifyPlaylist(spotifySdk, user.id, playlistId);
    return new NextResponse(null, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: error.status || 500 });
  }
};

export const GET = withAuth(withSpotifyAccessToken(getRefreshSpotifyPlaylistHandler));
