import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '../withAuth';
import { getUserFromRequest } from '../user/route';
import prisma from '../../../lib/prisma';
import { playlist } from '../../generated/prisma';

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

interface SearchParams {
  search?: string;
  limit?: number;
  offset?: number;
  sortBy?: string;
  asc?: string;
}

export const searchPlaylists = async (userId: string, searchParams: SearchParams): Promise<playlist[]> => {
  const search = searchParams.search || '';
  const limit = searchParams.limit || 20;
  const offset = searchParams.offset || 0;
  const sortBy = searchParams.sortBy || 'created_at';
  const asc = searchParams.asc === 'true';

  return prisma.playlist.findMany({
    where: {
      user_id: userId,
      name: { contains: search, mode: 'insensitive' }
    },
    ...(sortBy
      ? {
          orderBy: {
            [sortBy]: asc ? 'asc' : 'desc'
          }
        }
      : {}),
    skip: offset,
    take: limit
  });
};
