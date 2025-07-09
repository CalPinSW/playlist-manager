import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import getDeviceIdForUser from '../../../../utils/spotifyPlayback/getDeviceIdForUser';

export const pausePlayback = async (spotifySdk: SpotifyApi): Promise<void> => {
  const deviceId = await getDeviceIdForUser(spotifySdk);
  await spotifySdk.player.pausePlayback(deviceId);
};
