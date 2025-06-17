import { logger, task } from '@trigger.dev/sdk/v3';
import { refreshSpotifyPlaylists } from '../api/playlists/refresh/handler';
import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import prisma from '../../lib/prisma';
import { refreshSpotifyAccessToken } from '../api/spotify/utilities/refreshSpotifyAccessToken';

export const updatePlaylistData = task({
  id: 'update-playlist-data',
  maxDuration: 300, // Stop executing after 300 secs (5 mins) of compute
  run: async (payload: { userId: string }) => {
    logger.log('Task beginning');

    const userId = payload.userId;
    if (!userId) {
      throw new Error('Invalid Payload');
    }
    const user = await prisma.user.findUnique({ where: { id: userId } });
    logger.log('Refreshing access tokens for user', { userId: payload.userId });

    await refreshSpotifyAccessToken(user);
    logger.log('Refreshed access tokens for user');

    const accessTokens = await prisma.access_token.findUnique({ where: { user_id: userId } });
    const spotifySdk = SpotifyApi.withAccessToken(process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID, accessTokens);
    logger.log('Updating playlist data', { payload });

    await refreshSpotifyPlaylists(spotifySdk, userId);

    logger.log('Task complete');
  }
});
