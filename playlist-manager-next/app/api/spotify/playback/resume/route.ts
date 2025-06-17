import { access_token } from '../../../../generated/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '../../../withAuth';
import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import { withSpotifyAccessToken } from '../../utilities/getAccessTokensFromRequest';
import { ResumePlaybackRequest, StartPlaybackRequest, UriOffset } from '../../../../utils/interfaces/PlaybackRequest';
import prisma from '../../../../../lib/prisma';
import { getUserFromRequest } from '../../../user/route';
import { startSpotifyPlayback } from '../start/route';

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

export const buildStartPlaybackRequest = async (
  user_id: string,
  resumePlaybackRequestBody: ResumePlaybackRequest
): Promise<StartPlaybackRequest> => {
  const playlistPlaybackState = await getPlaybackStateForPlaylist(user_id, resumePlaybackRequestBody.id);
  const albumPlaybackState = await getPlaybackStateForAlbum(user_id, resumePlaybackRequestBody.id);

  if (playlistPlaybackState && playlistPlaybackState.playback_state) {
    return {
      context_uri: `spotify:playlist:${resumePlaybackRequestBody.id}`,
      offset: {
        type: 'uri',
        uri: `spotify:track:${playlistPlaybackState.playback_state.item_id}`
      } as UriOffset,
      position_ms: Number(playlistPlaybackState.playback_state.progress_ms)
    };
  } else if (albumPlaybackState && albumPlaybackState.playback_state) {
    return {
      context_uri: resumePlaybackRequestBody.context_uri || `spotify:album:${resumePlaybackRequestBody.id}`,
      offset: {
        type: 'uri',
        uri: `spotify:track:${albumPlaybackState.playback_state.item_id}`
      } as UriOffset,
      position_ms: Number(albumPlaybackState.playback_state.progress_ms)
    };
  } else {
    return {
      context_uri: resumePlaybackRequestBody.context_uri
    };
  }
};

const getPlaybackStateForPlaylist = async (user_id: string, playlist_id: string) => {
  return prisma.playbackstateplaylistrelationship.findFirst({
    where: {
      user_id,
      playlist_id
    },
    include: {
      playback_state: true
    }
  });
};

const getPlaybackStateForAlbum = async (user_id: string, album_id: string) => {
  return prisma.playbackstatealbumrelationship.findFirst({
    where: {
      user_id,
      album_id
    },
    include: {
      playback_state: true
    }
  });
};
