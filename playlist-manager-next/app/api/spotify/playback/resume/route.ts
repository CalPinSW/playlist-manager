import { access_token } from '../../../../generated/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '../../../withAuth';
import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import { withSpotifyAccessToken } from '../../utilities/getAccessTokensFromRequest';
import { ResumePlaybackRequest } from '../../../../utils/interfaces/PlaybackRequest';
import { buildStartPlaybackRequest } from './handler';
import { startSpotifyPlayback } from '../start/handler';
import { getUserFromRequest } from '../../../user/handler';

const postResumePlaybackHandler = async (access_tokens: access_token, request: NextRequest) => {
  try {
    const user = await getUserFromRequest();
    const requestBody: ResumePlaybackRequest = await request.json();
    const spotifySdk = SpotifyApi.withAccessToken(process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID, access_tokens);
    const playbackRequest = await buildStartPlaybackRequest(user.id, requestBody);
    const playback = await startSpotifyPlayback(spotifySdk, playbackRequest);
    return NextResponse.json({ playback }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: error.status || 500 });
  }
};

export const POST = withAuth(withSpotifyAccessToken(postResumePlaybackHandler));
