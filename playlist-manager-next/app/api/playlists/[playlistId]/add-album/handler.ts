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
  await addAlbumToSpotifyPlaylist(spotifySdk, playlistId, requestBody);
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

  const result = await prisma.playlistalbumrelationship.create({
    data: {
      playlist_id: playlistId,
      album_id: requestBody.albumId,
      album_index: insertIndex
    }
  });

  return result;
};

const addAlbumToSpotifyPlaylist = async (
  spotifySdk: SpotifyApi,
  playlistId: string,
  requestBody: AddAlbumToSpotifyPlaylistRequest
) => {
  const album = await getSpotifyAlbum(spotifySdk, requestBody.albumId);
  const playlistTracks = await getAllPlaylistTracks(spotifySdk, playlistId);

  await saveAlbums(spotifySdk, [album.id]);

  if (await isAlbumInPlaylist(playlistTracks, album)) {
    throw new ErrorWithStatus('Album already present in playlist', 403);
  } else {
    const trackUris = album.tracks.items.map(item => item.uri);
    let trackPosition = undefined;
    if (requestBody.albumIndex || requestBody.albumIndex == 0) {
      trackPosition = convertAlbumIndexToPositionIndexForPlaylist(playlistTracks, requestBody.albumIndex);
    }
    await spotifySdk.playlists.addItemsToPlaylist(playlistId, trackUris, trackPosition);
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
