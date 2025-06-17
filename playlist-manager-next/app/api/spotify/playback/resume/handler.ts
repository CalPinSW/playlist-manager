import prisma from '../../../../../lib/prisma';
import { ResumePlaybackRequest, StartPlaybackRequest, UriOffset } from '../../../../utils/interfaces/PlaybackRequest';

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
