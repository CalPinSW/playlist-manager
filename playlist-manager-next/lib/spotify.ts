export const spotifyScopes = [
  'user-library-read',
  'user-library-modify',
  'user-read-currently-playing',
  'user-read-playback-state',
  'playlist-modify-public',
  'playlist-modify-private',
  'playlist-read-private',
  'playlist-read-collaborative',
  'playlist-modify-private',
  'playlist-modify-public',
  'user-modify-playback-state',
  'user-read-recently-played'
];

/** The redirect URI registered with Spotify — shared by the authorize request and the code exchange. */
export const getSpotifyRedirectUri = () =>
  new URL(process.env.SPOTIFY_REDIRECT_ENDPOINT!, process.env.NEXT_PUBLIC_BASE_URL).toString();

export const buildSpotifyAuthorizeUrl = (state: string) => {
  const url = new URL('https://accounts.spotify.com/authorize');
  url.searchParams.append('response_type', 'code');
  url.searchParams.append('client_id', process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID || '');
  url.searchParams.append('scope', spotifyScopes.join(' '));
  url.searchParams.append('redirect_uri', getSpotifyRedirectUri());
  url.searchParams.append('state', state);
  return url;
};
