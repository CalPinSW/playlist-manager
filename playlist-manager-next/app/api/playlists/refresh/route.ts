import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '../../withAuth';
import getSpotifySdk from '../../../utils/getSpotifySdk';
import { refreshSpotifyPlaylists } from './handler';
import { getUserFromRequest } from '../../user/handler';

const getRefreshSpotifyPlaylistsHandler = async (_request: NextRequest) => {
  try {
    const user = await getUserFromRequest();
    const spotifySdk = await getSpotifySdk();
    await refreshSpotifyPlaylists(spotifySdk, user.id);
    return new NextResponse(null, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: error.status || 500 });
  }
};

export const GET = withAuth(getRefreshSpotifyPlaylistsHandler);
