import { SpotifyApi, PlaylistedTrack, Track } from '@spotify/web-api-ts-sdk';

export default async function getAllPlaylistTracks(
  spotifySdk: SpotifyApi,
  playlistId: string
): Promise<PlaylistedTrack<Track>[]> {
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
