import { access_token } from '../../../../../generated/prisma';
import { NextResponse } from 'next/server';
import { withAuth } from '../../../withAuth';
import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import { withSpotifyAccessToken } from '../../utilities/getAccessTokensFromRequest';
import prisma from '../../../../../lib/prisma';

const getRefetchUserDataHandler = async (access_tokens: access_token) => {
  try {
    const spotifySdk = SpotifyApi.withAccessToken(process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID, access_tokens);
    const user = await spotifySdk.currentUser.profile();
    await prisma.user.update({
      where: { id: user.id },
      data: {
        display_name: user.display_name,
        image_url: user.images[user.images.length - 1].url,
        uri: user.uri
      }
    });
    return NextResponse.json(null, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: error.status || 500 });
  }
};

export const GET = withAuth(withSpotifyAccessToken(getRefetchUserDataHandler));
