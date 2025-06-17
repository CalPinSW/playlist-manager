import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '../withAuth';
import { getUserFromRequest } from '../user/route';
import prisma from '../../../lib/prisma';

const getAlbumsHandler = async (request: NextRequest) => {
  try {
    const user = await getUserFromRequest();
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search') || '';
    const sort_by = searchParams.get('sort_by') || 'release_date';
    const asc = searchParams.get('asc') === 'true';

    // 1. Find albums where album name or artist name matches search
    const albums = await prisma.album.findMany({
      where: {
        playlistalbumrelationship: {
          some: {
            playlist: {
              user_id: user.id
            }
          }
        },
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                {
                  albumartistrelationship: {
                    some: {
                      artist: {
                        name: { contains: search, mode: 'insensitive' }
                      }
                    }
                  }
                }
              ]
            }
          : {})
      },
      orderBy: {
        [sort_by]: asc ? 'asc' : 'desc'
      },
      skip: offset,
      take: limit,
      include: {
        playlistalbumrelationship: {
          include: {
            playlist: true
          }
        },
        albumartistrelationship: {
          include: {
            artist: true
          }
        }
      }
    });

    // 2. Shape the response: add onPlaylists property for each album
    const albumsWithPlaylists = albums.map(album => ({
      ...album,
      albumartistrelationship: undefined,
      playlistalbumrelationship: undefined,
      artists: album.albumartistrelationship.map(rel => rel.artist),
      onPlaylists: album.playlistalbumrelationship
        .filter(rel => rel.playlist && rel.playlist.user_id === user.id)
        .map(rel => rel.playlist)
    }));

    return NextResponse.json(albumsWithPlaylists, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: error.status || 500 });
  }
};

export const GET = withAuth(getAlbumsHandler);
