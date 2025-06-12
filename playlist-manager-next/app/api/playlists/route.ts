import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '../withAuth';
import { getUserFromRequest } from '../user/route';
import prisma from '../../../lib/prisma';

const getPlaylistsHandler = async (request: NextRequest) => {
  try {
    const user = await getUserFromRequest();
    const searchParams = request.nextUrl.searchParams;
    const limit = searchParams.get('limit') || '20';
    const offset = searchParams.get('offset') || '0';
    const search = searchParams.get('search') || '';
    const sort_by = searchParams.get('sort_by') || 'created_at';
    const asc = searchParams.get('asc') === 'true';

    const playlists = await prisma.playlist.findMany({
      where: {
        user_id: user.id,
        name: { contains: search, mode: 'insensitive' }
      },
      ...(sort_by
        ? {
            orderBy: {
              [sort_by]: asc ? 'asc' : 'desc'
            }
          }
        : {}),
      skip: parseInt(offset),
      take: parseInt(limit)
    });
    return NextResponse.json(playlists, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: error.status || 500 });
  }
};

export const GET = withAuth(getPlaylistsHandler);
