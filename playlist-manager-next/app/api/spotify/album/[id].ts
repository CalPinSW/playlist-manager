import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import { NextRequest, NextResponse } from 'next/server';
import { access_token } from '../../../generated/prisma';
import { withAuth } from '../../withAuth';
import { withSpotifyAccessToken } from '../utilities/getAccessTokensFromRequest';
import { getSpotifyAlbum } from './handler';

const getSpotifyAlbumHandler = async (
  access_tokens: access_token,
  _request: NextRequest,
  { params }: { params: Promise<{ albumId: string }> }
) => {
  try {
    const { albumId } = await params;
    const spotifySdk = SpotifyApi.withAccessToken(process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID, access_tokens);
    const album = await getSpotifyAlbum(spotifySdk, albumId);
    return NextResponse.json(album, { status: 204 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: error.status || 500 });
  }
};

export const GET = withAuth(withSpotifyAccessToken(getSpotifyAlbumHandler));
