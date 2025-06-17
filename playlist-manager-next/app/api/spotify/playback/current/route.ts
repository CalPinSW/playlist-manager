import { access_token } from '../../../../../generated/prisma';
import { NextResponse } from 'next/server';
import { withAuth } from '../../../withAuth';
import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import { withSpotifyAccessToken } from '../../utilities/getAccessTokensFromRequest';
import { getPlayback } from './handler';
import { getUserFromRequest } from '../../../user/handler';

const getPlaybackHandler = async (access_tokens: access_token) => {
  const spotifySdk = SpotifyApi.withAccessToken(process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID, access_tokens);
  const user = await getUserFromRequest();
  const playbackState = await getPlayback(spotifySdk, user.id);
  return NextResponse.json(playbackState, { status: 200 });
};

export const GET = withAuth(withSpotifyAccessToken(getPlaybackHandler));
