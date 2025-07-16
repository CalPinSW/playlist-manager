import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import getDeviceIdForUser from '../../../../utils/spotifyPlayback/getDeviceIdForUser';

export const pausePlayback = async (spotifySdk: SpotifyApi): Promise<void> => {
  const deviceId = await getDeviceIdForUser(spotifySdk);
  const accessToken = await spotifySdk.getAccessToken();
  await fetch(`https://api.spotify.com/v1/me/player/pause${deviceId ? '?deviceId=' + deviceId : ''}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken.access_token}`
    }
  });
};
