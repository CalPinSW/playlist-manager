import { access_token } from '../../../../../generated/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '../../../withAuth';
import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import { withSpotifyAccessToken } from '../../utilities/getAccessTokensFromRequest';
import { StartPlaybackRequest } from '../../../../utils/interfaces/PlaybackRequest';
import { startSpotifyPlayback } from './handler';
import { parseRequestBody } from '../../../_utils/parseRequestBody';

const postStartPlaybackHandler = async (access_tokens: access_token, request: NextRequest) => {
  try {
    const requestBody: StartPlaybackRequest = await parseRequestBody(request);
    const spotifySdk = SpotifyApi.withAccessToken(process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID, access_tokens);
    const playback = await startSpotifyPlayback(spotifySdk, requestBody);
    return NextResponse.json({ playback }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: error.status || 500 });
  }
};

export const POST = withAuth(withSpotifyAccessToken(postStartPlaybackHandler));
