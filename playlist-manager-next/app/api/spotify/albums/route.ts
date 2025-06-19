import { access_token } from './../../../../generated/prisma/index.d';
import { NextRequest, NextResponse } from 'next/server';
import { searchSpotifyAlbums } from './handler';
import { getUserFromRequest } from '../../user/handler';
import { withAuth } from '../../withAuth';
import { withSpotifyAccessToken } from '../utilities/getAccessTokensFromRequest';
import { MaxInt, SpotifyApi } from '@spotify/web-api-ts-sdk';

const getSpotifyAlbumsHandler = async (access_tokens: access_token, request: NextRequest) => {
  try {
    const user = await getUserFromRequest();
    const searchParams = request.nextUrl.searchParams;
    const _limit = searchParams.get('limit');
    const limit = parseLimitParam(_limit);
    const offset = searchParams.get('offset');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sort_by');
    const asc = searchParams.get('asc');

    const spotifySdk = SpotifyApi.withAccessToken(process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID, access_tokens);

    const albums = await searchSpotifyAlbums(spotifySdk, {
      search,
      limit: limit,
      offset: offset ? parseInt(offset) : undefined
    });

    return NextResponse.json(albums, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: error.status || 500 });
  }
};

const parseLimitParam = (param: string | undefined): MaxInt<50> | undefined => {
  const parsedLimit = param ? parseInt(param) : undefined;
  const limit: MaxInt<50> | undefined = parsedLimit > 50 ? 50 : (parsedLimit as MaxInt<50> | undefined);
  return limit;
};

export const GET = withAuth(withSpotifyAccessToken(getSpotifyAlbumsHandler));
