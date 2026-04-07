import { SpotifyApi, PlaylistedTrack, Track, Album } from '@spotify/web-api-ts-sdk';
import prisma from '../../../../../lib/prisma';
import { ErrorWithStatus } from '../../../../utils/errors/ErrorWithStatus';
import getAllPlaylistTracks from '../../../spotify/utilities/spotify/getAllPlaylistTracks';
import { AddAlbumToSpotifyPlaylistRequest } from './route';
import { getSpotifyAlbum } from '../../../spotify/album/handler';

export const addAlbumToPlaylist = async (
  spotifySdk: SpotifyApi,
  playlistId: string,
  requestBody: AddAlbumToSpotifyPlaylistRequest
): Promise<void> => {
  // Attempt to add to Spotify. A 403 means the album is already present in
  // the playlist (all tracks matched), which is acceptable — we still want
  // to ensure the DB row exists so the mobile UI stays consistent.
  try {
    await addAlbumToSpotifyPlaylist(spotifySdk, playlistId, requestBody);
  } catch (err) {
    if (err?.status !== 403) {
      throw err; // real Spotify error — propagate so the client knows
    }
    // 403 = already in Spotify playlist: fall through and upsert DB row below
  }

  // Always upsert the DB row so mobile and web stay in sync regardless of
  // whether the Spotify add was a fresh insert or a no-op (already present).
  await addAlbumToDbPlaylist(playlistId, requestBody);
};

const addAlbumToDbPlaylist = async (playlistId: string, requestBody: AddAlbumToSpotifyPlaylistRequest) => {
  const maxAlbumIndexObj = await prisma.playlistalbumrelationship.aggregate({
    where: { playlist_id: playlistId },
    _max: { album_index: true }
  });
  const maxAlbumIndex = maxAlbumIndexObj._max.album_index ?? -1;

  const insertIndex =
    (requestBody.albumIndex || requestBody.albumIndex == 0) && requestBody.albumIndex <= maxAlbumIndex
      ? requestBody.albumIndex
      : maxAlbumIndex + 1;

  // Use upsert so this is idempotent — calling it when the row already exists
  // (e.g. because the album was already in the Spotify playlist and the 15-min
  // sync had already created the DB row) doesn't throw a unique-constraint error.
  const result = await prisma.playlistalbumrelationship.upsert({
    where: {
      playlist_id_album_id: {
        playlist_id: playlistId,
        album_id: requestBody.albumId
      }
    },
    create: {
      playlist_id: playlistId,
      album_id: requestBody.albumId,
      album_index: insertIndex
    },
    update: {} // row already exists — leave album_index unchanged
  });

  return result;
};

/** Maximum URIs Spotify accepts per addItemsToPlaylist call. */
const SPOTIFY_ADD_CHUNK_SIZE = 100;

const addAlbumToSpotifyPlaylist = async (
  spotifySdk: SpotifyApi,
  playlistId: string,
  requestBody: AddAlbumToSpotifyPlaylistRequest
) => {
  const album = await getSpotifyAlbum(spotifySdk, requestBody.albumId);
  const playlistTracks = await getAllPlaylistTracks(spotifySdk, playlistId);

  // Save to Spotify library (liked albums) — best-effort, not critical.
  // A missing user-library-modify scope or an expired token should NOT
  // prevent the album from being added to the playlist.
  try {
    await saveAlbums(spotifySdk, [album.id]);
  } catch (err) {
    console.warn('[add-album] saveAlbums failed (non-fatal):', err?.message ?? err);
  }

  if (await isAlbumInPlaylist(playlistTracks, album)) {
    throw new ErrorWithStatus('Album already present in playlist', 403);
  }

  const trackUris = album.tracks.items.map(item => item.uri);
  let trackPosition: number | undefined = undefined;
  if (requestBody.albumIndex || requestBody.albumIndex == 0) {
    trackPosition = convertAlbumIndexToPositionIndexForPlaylist(playlistTracks, requestBody.albumIndex);
  }

  // Spotify rejects batches of more than 100 URIs — chunk the requests.
  for (let i = 0; i < trackUris.length; i += SPOTIFY_ADD_CHUNK_SIZE) {
    const chunk = trackUris.slice(i, i + SPOTIFY_ADD_CHUNK_SIZE);
    // Only pass a position for the first chunk; subsequent chunks append.
    const position = i === 0 ? trackPosition : undefined;
    await spotifySdk.playlists.addItemsToPlaylist(playlistId, chunk, position);
  }
};

async function isAlbumInPlaylist(playlistTracks: PlaylistedTrack<Track>[], album: Album): Promise<boolean> {
  return album.tracks.items.every(item => playlistTracks.map(pt => pt.track.id).includes(item.id));
}

const convertAlbumIndexToPositionIndexForPlaylist = (
  playlistTracks: PlaylistedTrack<Track>[],
  albumIndex: number
): number => {
  if (albumIndex === 0) return 0;
  let position = 0;
  let albumsSeen = 0;
  let lastAlbumId = '';
  for (const track of playlistTracks) {
    if (track.track.album.id !== lastAlbumId) {
      albumsSeen++;
      lastAlbumId = track.track.album.id;
      if (albumsSeen === albumIndex) {
        break;
      }
    }
    position++;
  }
  return position;
};

const saveAlbums = async (spotifySdk: SpotifyApi, albumIds: string[]) => {
  const access_token = await spotifySdk.getAccessToken();
  const response = await fetch('https://api.spotify.com/v1/me/albums', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${access_token.access_token}`
    },
    body: JSON.stringify({ ids: albumIds })
  });

  // Optionally handle the response as needed
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Spotify API error: ${error}`);
  }

  return response;
};
