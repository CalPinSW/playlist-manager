import { SpotifyApi, SimplifiedTrack } from '@spotify/web-api-ts-sdk';

export default async function getAllAlbumTracks(spotifySdk: SpotifyApi, albumId: string) {
  let albumTracks: SimplifiedTrack[] = [];
  let offset = 0;
  const limit = 50;
  let apiTracksObject = await spotifySdk.albums.tracks(albumId, undefined, limit, offset);

  while (true) {
    albumTracks = albumTracks.concat(apiTracksObject.items);

    if (!apiTracksObject.next) {
      break;
    }
    offset += limit;
    // Wait 500ms to avoid rate limits (optional, as needed)
    await new Promise(res => setTimeout(res, 500));
    apiTracksObject = await spotifySdk.albums.tracks(albumId, undefined, limit, offset);
  }

  return albumTracks;
}
