import { SpotifyApi } from '@spotify/web-api-ts-sdk';

const getDeviceIdForUser = async (spotifySdk: SpotifyApi): Promise<string | null> => {
  const { devices } = await spotifySdk.player.getAvailableDevices();

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

export default getDeviceIdForUser;
