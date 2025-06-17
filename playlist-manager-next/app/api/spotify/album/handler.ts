import { SpotifyApi, Album, MaxInt } from '@spotify/web-api-ts-sdk';

export const getSpotifyAlbum = async (spotifySdk: SpotifyApi, albumId: string): Promise<Album> => {
  const album = await spotifySdk.albums.get(albumId);
  const limit: MaxInt<50> = album.tracks.limit as MaxInt<50>;

  let offset = 0;
  const tracks = album.tracks.items;
  while (tracks.length != album.tracks.total) {
    offset += limit;
    const extraTracks = await spotifySdk.albums.tracks(albumId, undefined, limit, offset);
    tracks.push(...extraTracks.items);
  }
  return {
    ...album,
    tracks: { ...album.tracks, items: tracks, next: null, previous: null, offset: 0, limit: tracks.length }
  };
};
