import { access_token } from '../../../../../generated/prisma';
import { NextResponse } from 'next/server';
import { withAuth } from '../../../withAuth';
import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import { withSpotifyAccessToken } from '../../utilities/getAccessTokensFromRequest';
import { pausePlayback } from './handler';

const getPlaybackPauseHandler = async (access_tokens: access_token) => {
  try {
    const spotifySdk = SpotifyApi.withAccessToken(process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID, access_tokens);
    await pausePlayback(spotifySdk);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: error.status || 500 });
  }
};

export const GET = withAuth(withSpotifyAccessToken(getPlaybackPauseHandler));
