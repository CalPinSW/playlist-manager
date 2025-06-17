import prisma from '../../../lib/prisma';
import { playlist } from '../../../generated/prisma';

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
