import { Playlist, SpotifyApi, Track } from '@spotify/web-api-ts-sdk';
import { playlist } from '../../../../../generated/prisma';
import prisma from '../../../../../lib/prisma';
import getAllPlaylistTracks from '../../../spotify/utilities/spotify/getAllPlaylistTracks';
import { createTrackOrNone, getOrCreateAlbum } from '../../../spotify/utilities/spotifyUtils';

/**
 * Refresh a single playlist from Spotify.
 *
 * IMPORTANT: we UPDATE the existing playlist row rather than deleting and
 * recreating it.  Deleting the row cascades to listening_progress (via the
 * onDelete: Cascade FK), which would silently wipe all listening history for
 * that playlist.  Instead we only replace the album-relationship rows and
 * update the metadata columns in place.
 */
export const refreshSpotifyPlaylist = async (
  spotifySdk: SpotifyApi,
  userId: string,
  playlistId: string
): Promise<void> => {
  const spotifyPlaylist = await spotifySdk.playlists.getPlaylist(playlistId);
  await refreshPlaylistAlbumsInDb(spotifySdk, userId, spotifyPlaylist);
};

/**
 * Core in-place refresh: replaces album relationships without touching the
 * playlist row's identity, so listening_progress is never cascade-deleted.
 *
 * Used by both the single-playlist refresh endpoint and the new
 * syncPlaylistTask trigger.
 */
export async function refreshPlaylistAlbumsInDb(
  spotifySdk: SpotifyApi,
  userId: string,
  spotifyPlaylist: Playlist<Track>
): Promise<void> {
  // Verify ownership before doing anything destructive.
  const existing = await prisma.playlist.findUnique({
    where: { id: spotifyPlaylist.id, user_id: userId }
  });
  if (!existing) {
    throw new Error(`Playlist ${spotifyPlaylist.id} not found or does not belong to user ${userId}`);
  }

  // Replace album memberships (safe — no cascade to listening_progress).
  await prisma.playlistalbumrelationship.deleteMany({
    where: { playlist_id: spotifyPlaylist.id }
  });

  // Update playlist metadata and stamp the sync time.
  await prisma.playlist.update({
    where: { id: spotifyPlaylist.id },
    data: {
      name: spotifyPlaylist.name,
      description: spotifyPlaylist.description ?? '',
      image_url: spotifyPlaylist.images?.[0]?.url ?? null,
      snapshot_id: spotifyPlaylist.snapshot_id,
      last_synced_at: new Date()
    }
  });

  // Re-populate album memberships from Spotify.
  let album_index = 0;
  const tracks = await getAllPlaylistTracks(spotifySdk, spotifyPlaylist.id);
  for (const track of tracks) {
    const dbAlbum = await getOrCreateAlbum(spotifySdk, track.track.album, true);
    const existingRel = await prisma.playlistalbumrelationship.findUnique({
      where: {
        playlist_id_album_id: {
          playlist_id: spotifyPlaylist.id,
          album_id: dbAlbum.id
        }
      }
    });
    if (!existingRel) {
      await prisma.playlistalbumrelationship.create({
        data: {
          playlist_id: spotifyPlaylist.id,
          album_id: dbAlbum.id,
          album_index: album_index
        }
      });
      album_index += 1;
    }
    await createTrackOrNone(track.track, track.track.album);
  }
}

/**
 * Add a brand-new playlist (not yet in the DB) from Spotify.
 * Sets last_synced_at so the throttle window starts from creation.
 */
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
      uri: playlist.uri,
      last_synced_at: new Date()
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
    await createTrackOrNone(track.track, track.track.album);
  }
  return dbPlaylist;
}

/**
 * @deprecated  Do not delete the playlist row — it cascades to
 * listening_progress.  Use refreshPlaylistAlbumsInDb for updates instead.
 * Kept only so existing callers compile until they are migrated.
 */
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
    where: { playlist_id: playlistId }
  });
  return prisma.playlist.delete({
    where: { id: playlistId }
  });
}
