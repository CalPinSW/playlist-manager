import { NextRequest } from 'next/server';
import prisma from '../../../lib/prisma';
import { getUserFromRequest } from '../user/handler';
import { NEW_ALBUMS_REGEX } from '../../utils/playlistFilters';

export interface ProgressEntry {
  albumId: string;
  albumName: string;
  albumImageUrl: string;
  playlistId: string;
  playlistName: string;
  lastTrackIndex: number; // 0-based
  totalTracks: number;
  listenedAt: string; // ISO string
  progressPercent: number; // 0-100, rounded to nearest integer
}

/**
 * Returns listening progress for all active New Albums playlists for the
 * authenticated user, ordered by most recently listened.
 *
 * The first item in the response is the "current album" shown on the Now tab.
 */
export const getProgress = async (req: NextRequest): Promise<ProgressEntry[]> => {
  const user = await getUserFromRequest(req);

  const rows = await prisma.listening_progress.findMany({
    where: { user_id: user.id },
    include: {
      album: {
        select: { id: true, name: true, image_url: true, total_tracks: true }
      },
      playlist: {
        select: { id: true, name: true }
      }
    },
    orderBy: { listened_at: 'desc' }
  });

  // Filter to New Albums playlists only — listening_progress may have rows from
  // playlists that have since been renamed or are outside the active scope.
  const activeRows = rows.filter(row => NEW_ALBUMS_REGEX.test(row.playlist.name));

  return activeRows.map(row => ({
    albumId: row.album_id,
    albumName: row.album.name,
    albumImageUrl: row.album.image_url,
    playlistId: row.playlist_id,
    playlistName: row.playlist.name,
    lastTrackIndex: row.last_track_index,
    totalTracks: row.total_tracks,
    listenedAt: row.listened_at.toISOString(),
    progressPercent: Math.round(((row.last_track_index + 1) / row.total_tracks) * 100)
  }));
};
