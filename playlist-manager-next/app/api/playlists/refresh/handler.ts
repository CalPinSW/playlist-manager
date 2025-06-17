import { MaxInt, Page, Playlist, SimplifiedPlaylist, SpotifyApi, Track } from '@spotify/web-api-ts-sdk';
import prisma from '../../../../lib/prisma';
import executeWithRetries from '../../../utils/executeWithRetries';
import getAllPlaylistTracks from '../../spotify/utilities/spotify/getAllPlaylistTracks';
import { getOrCreateAlbum, createTrackOrNone } from '../../spotify/utilities/spotifyUtils';
import { playlist } from '../../../../generated/prisma';

export const refreshSpotifyPlaylists = async (spotifySdk: SpotifyApi, userId: string): Promise<void> => {
  console.log('Fetching spotify playlists:');
  const simplifiedPlaylists = await getAllPlaylists(spotifySdk);

  let numberOfPlaylistsUpdated = 0;
  console.info({
    message: 'Populating user playlists',
    userId,
    number_of_playlists_found: simplifiedPlaylists.length
  });

  for (const simplifiedPlaylist of simplifiedPlaylists) {
    try {
      if (simplifiedPlaylist.name.includes('Albums')) {
        const dbPlaylist = await prisma.playlist.findUnique({
          where: { id: simplifiedPlaylist.id, user_id: userId }
        });

        if (!dbPlaylist || dbPlaylist.snapshot_id !== simplifiedPlaylist.snapshot_id) {
          if (dbPlaylist) {
            await deleteDbPlaylist(userId, dbPlaylist.id);
          }
          const playlist = await getPlaylist(spotifySdk, simplifiedPlaylist.id);
          await addPlaylistToDb(spotifySdk, userId, playlist);
          numberOfPlaylistsUpdated += 1;
        }
      }
    } catch (e) {
      const failingPlaylistId = (typeof simplifiedPlaylist !== 'undefined' && simplifiedPlaylist.id) || 'N/A';
      console.error({
        message: 'Error populating user playlists',
        userId,
        number_of_playlists_found: simplifiedPlaylists.length,
        number_of_playlists_successfully_updated: numberOfPlaylistsUpdated,
        failing_playlist_id: failingPlaylistId,
        error: e.message
      });
      throw e;
    }
  }

  console.info({
    message: 'Completed populating user playlists',
    userId,
    number_of_playlists_found: simplifiedPlaylists.length,
    number_of_playlists_updated: numberOfPlaylistsUpdated
  });
};

export async function getAllPlaylists(spotifySdk: SpotifyApi) {
  const limit: MaxInt<50> = 50;
  let offset = 0;
  let allPlaylists: SimplifiedPlaylist[] = [];
  while (true) {
    const page = await executeWithRetries(() => getPlaylists(spotifySdk, limit, offset));
    allPlaylists = allPlaylists.concat(page.items);
    if (!page.next) break; // No more pages
    offset += limit;
  }
  return allPlaylists;
}

export async function getPlaylists(
  spotifySdk: SpotifyApi,
  limit: MaxInt<50>,
  offset = 0
): Promise<Page<SimplifiedPlaylist>> {
  return spotifySdk.currentUser.playlists.playlists(limit, offset);
}

export async function getPlaylist(spotifySdk: SpotifyApi, playlistId: string): Promise<Playlist<Track>> {
  return spotifySdk.playlists.getPlaylist(playlistId);
}

export async function addPlaylistToDb(
  spotifySdk: SpotifyApi,
  userId: string,
  playlist: Playlist<Track>
): Promise<playlist> {
  const dbPlaylist = await prisma.playlist.create({
    data: {
      id: playlist.id,
      name: playlist.name,
      description: playlist.description ?? '',
      image_url: playlist.images?.[0]?.url ?? null,
      user_id: userId,
      snapshot_id: playlist.snapshot_id,
      uri: playlist.uri
    }
  });

  let album_index = 0;
  const tracks = await getAllPlaylistTracks(spotifySdk, playlist.id);
  for (const track of tracks) {
    const dbAlbum = await getOrCreateAlbum(spotifySdk, track.track.album, true);
    const existing = await prisma.playlistalbumrelationship.findUnique({
      where: {
        playlist_id_album_id: {
          playlist_id: dbPlaylist.id,
          album_id: dbAlbum.id
        }
      }
    });

    if (!existing) {
      await prisma.playlistalbumrelationship.create({
        data: {
          playlist_id: dbPlaylist.id,
          album_id: dbAlbum.id,
          album_index: album_index
        }
      });
      album_index += 1;
    }

    createTrackOrNone(track.track, track.track.album);
  }
  return dbPlaylist;
}

export async function deleteDbPlaylist(userId: string, playlistId: string): Promise<playlist> {
  const playlist = await prisma.playlist.findUnique({
    where: { id: playlistId, user_id: userId }
  });
  if (!playlist) {
    throw new Error(
      `Error deleting playlist with id ${playlistId}: Playlist not found, or it does not belong to requesting user`
    );
  }
  await prisma.playlistalbumrelationship.deleteMany({
    where: {
      playlist_id: playlistId
    }
  });
  return prisma.playlist.delete({
    where: {
      id: playlistId
    }
  });
}
