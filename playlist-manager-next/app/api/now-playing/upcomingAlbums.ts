import prisma from '../../../lib/prisma';

// Enough for a long gap between app opens without sending the whole playlist on every poll.
const UPCOMING_ALBUM_LIMIT = 3;

/**
 * The albums after albumIndex in a playlist, with their tracks, so the app can
 * estimate playback rolling over from one album to the next.
 */
export async function getUpcomingAlbums(playlistId: string, albumIndex: number | null) {
  if (albumIndex === null) return [];

  const rows = await prisma.playlistalbumrelationship.findMany({
    where: { playlist_id: playlistId, album_index: { gt: albumIndex } },
    orderBy: { album_index: 'asc' },
    take: UPCOMING_ALBUM_LIMIT,
    select: {
      album: {
        select: {
          id: true,
          name: true,
          image_url: true,
          uri: true,
          albumartistrelationship: {
            select: { artist: { select: { name: true } } },
            orderBy: { artist: { name: 'asc' } }
          },
          tracks: {
            select: { name: true, duration_ms: true },
            orderBy: [{ disc_number: 'asc' }, { track_number: 'asc' }]
          }
        }
      }
    }
  });

  return rows.map(({ album }) => ({
    albumId: album.id,
    albumName: album.name,
    albumImageUrl: album.image_url ?? '',
    albumUri: album.uri,
    artistNames: album.albumartistrelationship.map(r => r.artist.name),
    tracks: album.tracks.map(t => ({ name: t.name, durationMs: t.duration_ms }))
  }));
}
