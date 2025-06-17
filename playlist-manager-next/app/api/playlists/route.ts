import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '../withAuth';
import { searchPlaylists } from './handler';
import { getUserFromRequest } from '../user/handler';

const getPlaylistsHandler = async (request: NextRequest) => {
  try {
    const user = await getUserFromRequest();
    const searchParams = request.nextUrl.searchParams;
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sort_by');
    const asc = searchParams.get('asc');

    const playlists = await searchPlaylists(user.id, {
      search,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
      sortBy,
      asc
    });

    return NextResponse.json(playlists, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: error.status || 500 });
  }
};

export const GET = withAuth(getPlaylistsHandler);
