import { AlbumWithAdditionalDetails } from '../../../../(pages)/playlist/_components/PlaylistAlbums/PlaylistAlbums';
import prisma from '../../../../../lib/prisma';

export const getPlaylistAlbumsWithGenres = async (playlist_id: string): Promise<AlbumWithAdditionalDetails[]> => {
  const playlistAlbums = await prisma.playlistalbumrelationship.findMany({
    where: { playlist_id },
    orderBy: { album_index: 'asc' },
    include: {
      album: {
        select: {
          id: true,
          name: true,
          image_url: true,
          uri: true,
          album_type: true,
          total_tracks: true,
          release_date: true,
          release_date_precision: true,
          label: true,
          albumgenrerelationship: {
            include: { genre: true }
          },
          albumartistrelationship: {
            include: { artist: true }
          },
          album_notes: true
        }
      }
    }
  });

  return playlistAlbums.map(rel => {
    const album = rel.album;
    return {
      ...album,
      genres: album.albumgenrerelationship.map(g => g.genre),
      artists: album.albumartistrelationship.map(a => a.artist),
      notes: album.album_notes
    };
  });
};
