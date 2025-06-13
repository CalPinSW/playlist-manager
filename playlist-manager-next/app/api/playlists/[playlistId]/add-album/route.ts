import { Album, PlaylistedTrack, SpotifyApi, Track } from '@spotify/web-api-ts-sdk';
import { NextRequest, NextResponse } from 'next/server';
import { access_token } from '../../../../generated/prisma';
import { withAuth } from '../../../withAuth';
import { withSpotifyAccessToken } from '../../../spotify/utilities/getAccessTokensFromRequest';
import prisma from '../../../../../lib/prisma';
import { getSpotifyAlbum } from '../../../spotify/album/[id]';
import { ErrorWithStatus } from '../../../../utils/errors/ErrorWithStatus';

export interface AddAlbumToSpotifyPlaylistRequest {
  albumId: string;
  albumIndex?: number;
}

const postAddAlbumPlaylistHandler = async (
  access_tokens: access_token,
  request: NextRequest,
  { params }: { params: { playlistId: string } }
) => {
  try {
    const { playlistId } = await params;
    const requestBody: AddAlbumToSpotifyPlaylistRequest = await request.json();
    const spotifySdk = SpotifyApi.withAccessToken(process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID, access_tokens);
    await addAlbumToPlaylist(spotifySdk, playlistId, requestBody);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: error.status || 500 });
  }
};

export const POST = withAuth(withSpotifyAccessToken(postAddAlbumPlaylistHandler));

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
  const playlistTracks = await getPlaylistTracks(spotifySdk, playlistId);

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

async function getPlaylistTracks(spotifySdk: SpotifyApi, playlistId: string): Promise<PlaylistedTrack<Track>[]> {
  let playlistTracks: PlaylistedTrack<Track>[] = [];
  let offset = 0;
  const limit = 50;
  let apiTracksObject = await spotifySdk.playlists.getPlaylistItems(playlistId, undefined, undefined, limit, offset);

  while (true) {
    playlistTracks = playlistTracks.concat(apiTracksObject.items);

    if (!apiTracksObject.next) {
      break;
    }
    offset += limit;
    // Wait 500ms to avoid rate limits (optional, as needed)
    await new Promise(res => setTimeout(res, 500));
    apiTracksObject = await spotifySdk.playlists.getPlaylistItems(playlistId, undefined, undefined, limit, offset);
  }

  return playlistTracks;
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
