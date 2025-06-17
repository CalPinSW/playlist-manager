import { Playlist, SpotifyApi, Track } from '@spotify/web-api-ts-sdk';
import { playlist } from '../../../../../generated/prisma';
import prisma from '../../../../../lib/prisma';
import getAllPlaylistTracks from '../../../spotify/utilities/spotify/getAllPlaylistTracks';
import { createTrackOrNone, getOrCreateAlbum } from '../../../spotify/utilities/spotifyUtils';

export const refreshSpotifyPlaylist = async (
  spotifySdk: SpotifyApi,
  userId: string,
  playlistId: string
): Promise<void> => {
  const playlist = await spotifySdk.playlists.getPlaylist(playlistId);
  await deleteDbPlaylist(userId, playlistId);
  await addPlaylistToDb(spotifySdk, userId, playlist);
};

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
