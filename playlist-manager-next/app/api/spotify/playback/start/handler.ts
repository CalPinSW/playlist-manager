import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import prisma from '../../../../../lib/prisma';
import { ErrorWithStatus } from '../../../../utils/errors/ErrorWithStatus';
import {
  StartPlaybackRequest,
  PlaybackOffset,
  AlbumIdOffset,
  UriOffset
} from '../../../../utils/interfaces/PlaybackRequest';
import getDeviceIdForUser from '../../../../utils/spotifyPlayback/getDeviceIdForUser';

export const startSpotifyPlayback = async (
  spotifySdk: SpotifyApi,
  startPlaybackRequest?: StartPlaybackRequest
): Promise<void> => {
  const deviceId = await getDeviceIdForUser(spotifySdk);
  if (startPlaybackRequest && startPlaybackRequest.offset) {
    const offset = startPlaybackRequest.offset as PlaybackOffset;
    if (offset.type === 'album_id') {
      // Fetch album's tracks, order by disc_number, track_number
      const album = await prisma.album.findUnique({
        where: { id: (offset as AlbumIdOffset).album_id },
        include: {
          tracks: {
            orderBy: [{ disc_number: 'asc' }, { track_number: 'asc' }]
          }
        }
      });
      if (!album || !album.tracks || album.tracks.length === 0) {
        throw new ErrorWithStatus('Album or tracks not found', 400);
      }
      const firstTrackUri = album.tracks[0].uri;
      startPlaybackRequest.offset = { type: 'uri', uri: firstTrackUri } as UriOffset;
    }
  }
  const accessToken = await spotifySdk.getAccessToken();
  await fetch(`https://api.spotify.com/v1/me/player/play${deviceId ? '?deviceId=' + deviceId : ''}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken.access_token}`
    },
    body: JSON.stringify(startPlaybackRequest)
  });
};
