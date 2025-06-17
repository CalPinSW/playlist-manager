import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import prisma from '../../../../../lib/prisma';
import { ErrorWithStatus } from '../../../../utils/errors/ErrorWithStatus';
import {
  StartPlaybackRequest,
  PlaybackOffset,
  AlbumIdOffset,
  UriOffset
} from '../../../../utils/interfaces/PlaybackRequest';

export const startSpotifyPlayback = async (
  spotifySdk: SpotifyApi,
  startPlaybackRequest: StartPlaybackRequest
): Promise<void> => {
  const deviceId = await getDeviceIdForUser(spotifySdk);
  if (startPlaybackRequest && startPlaybackRequest.offset) {
    const offset = startPlaybackRequest.offset as PlaybackOffset;
    if (offset.type === 'album_id') {
      // Fetch album's tracks, order by disc_number, track_number
      const album = await prisma.album.findUnique({
        where: { id: (offset as AlbumIdOffset).album_id },
        include: {
          track: {
            orderBy: [{ disc_number: 'asc' }, { track_number: 'asc' }]
          }
        }
      });
      if (!album || !album.track || album.track.length === 0) {
        throw new ErrorWithStatus('Album or tracks not found', 400);
      }
      const firstTrackUri = album.track[0].uri;
      startPlaybackRequest.offset = { type: 'uri', uri: firstTrackUri } as UriOffset;
    }
  }
  return spotifySdk.player.startResumePlayback(
    deviceId,
    startPlaybackRequest.context_uri,
    startPlaybackRequest.uris,
    startPlaybackRequest.offset,
    startPlaybackRequest.position_ms
  );
};

const getDeviceIdForUser = async (spotifySdk: SpotifyApi): Promise<string | null> => {
  const { devices } = await spotifySdk.player.getAvailableDevices();
  console.log(devices);
  if (!devices || devices.length === 0) {
    return null;
  }

  let device_id: string;
  const active_device = devices.find(device => device.is_active);
  if (active_device) {
    device_id = active_device.id;
  } else {
    const smartphone_device = devices.find(device => device.type && device.type.toLowerCase() === 'smartphone');
    device_id = smartphone_device ? smartphone_device.id : devices[0].id;
  }
  return device_id;
};
