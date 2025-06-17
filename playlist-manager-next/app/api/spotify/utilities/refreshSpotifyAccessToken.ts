import prisma from '../../../../lib/prisma';
import { user } from '../../../generated/prisma';
import { getSpotifyAccessTokensFromRequest } from './getAccessTokensFromRequest';

export const refreshSpotifyAccessToken = async (user: user) => {
  const tokens = await getSpotifyAccessTokensFromRequest();
  if (!tokens || !tokens.refresh_token) {
    throw new Error('No refresh token found for user');
  }
  const basicAuth = Buffer.from(`${process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_SECRET}`).toString(
    'base64'
  );
  const params = new URLSearchParams();
  params.append('grant_type', 'refresh_token');
  params.append('refresh_token', tokens.refresh_token);

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${basicAuth}`
    },
    body: params.toString()
  });

  if (!response.ok) {
    throw new Error(`Spotify token refresh failed: ${response.statusText}`);
  }

  const tokenResponse = await response.json();

  const accessToken = tokenResponse.access_token;

  await prisma.access_token.update({
    where: { user_id: user.id },
    data: {
      access_token: accessToken,
      refresh_token: tokenResponse.refresh_token || tokens.refresh_token,
      expires_in: tokenResponse.expires_in,
      token_type: tokenResponse.token_type
    }
  });
};
