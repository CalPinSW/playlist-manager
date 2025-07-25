import React from 'react';
import prisma from '../../../../lib/prisma';
import PlaylistTitle from '../_components/PlaylistTitle';
import PlaylistAlbums from '../_components/PlaylistAlbums/PlaylistAlbums';
import { playlist } from '../../../../generated/prisma';
import { auth0 } from '../../../../lib/auth0';
import PlaylistActions from '../_components/PlaylistActions';
import { searchPlaylists } from '../../../api/playlists/handler';
import { getPlaylistAlbumsWithGenres } from '../../../api/playlists/[playlistId]/albums/handler';

export default async function Page({ params }: { params: Promise<{ playlistId: string }> }) {
  const { playlistId } = await params;
  const { user: auth0User } = await auth0.getSession();
  const user = await prisma.user.findFirst({
    where: {
      auth0_id: auth0User.sub
    }
  });

  const playlist = await prisma.playlist.findUnique({ where: { id: playlistId } });
  const playlistAlbums = await getPlaylistAlbumsWithGenres(playlistId);

  const associatedPlaylists = await getAssociatedPlaylists(user.id, playlist);

  return (
    <div className="flex flex-col p-2 text-sm sm:text-base h-full flex-1">
      <div className="flex flex-col space-y-4 h-full flex-1 grow">
        <PlaylistTitle playlist={playlist} />
        <PlaylistActions playlist={playlist} playlistAlbums={playlistAlbums} />
        <PlaylistAlbums playlist={playlist} playlistAlbums={playlistAlbums} associatedPlaylists={associatedPlaylists} />
      </div>
    </div>
  );
}

// async function getPlaylistTracks(playlist_id: string) {
//   // Find all tracks for the playlist, ordered by album_index, disc_number, track_number
//   const playlistAlbums = await prisma.playlistalbumrelationship.findMany({
//     where: { playlist_id },
//     orderBy: { album_index: 'asc' },
//     include: {
//       album: {
//         select: {
//           id: true,
//           name: true,
//           track: {
//             orderBy: [{ disc_number: 'asc' }, { track_number: 'asc' }],
//             include: {
//               trackartistrelationship: {
//                 include: { artist: { select: { name: true } } }
//               }
//             }
//           }
//         }
//       }
//     }
//   });

//   // Flatten tracks from all albums, preserving album_index order
//   const result: Array<any> = [];
//   for (const rel of playlistAlbums) {
//     const album = rel.album;
//     for (const track of album.track) {
//       result.push({
//         id: track.id,
//         name: track.name,
//         album: { name: album.name },
//         artists: track.trackartistrelationship.map(rel => ({ name: rel.artist.name }))
//       });
//     }
//   }
//   return result;
// }

const getAssociatedPlaylists = async (userId, playlist: playlist): Promise<playlist[]> => {
  if (playlist?.name.startsWith('New Albums')) {
    const similarPlaylists = await searchPlaylists(userId, { search: playlist.name.slice(11) });
    return similarPlaylists.filter(sp => sp.id !== playlist.id);
  }
  return [];
};
