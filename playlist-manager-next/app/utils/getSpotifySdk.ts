import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import prisma from '../../lib/prisma';
import getActiveUser from './getActiveUser';

const getSpotifySdk = async (): Promise<SpotifyApi> => {
  const user = await getActiveUser();
  const access_tokens = await prisma.access_token.findUniqueOrThrow({ where: { user_id: user.id } });
  return SpotifyApi.withAccessToken(process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID, access_tokens);
};

export default getSpotifySdk;
