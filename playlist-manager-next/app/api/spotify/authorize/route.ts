import { NextResponse } from 'next/server';
import { spotifyScopes } from '../../../../lib/spotify';

const getAuthorizeHandler = async () => {
  try {
    const queryString = new URL('https://accounts.spotify.com/authorize');
    queryString.searchParams.append('response_type', 'code');
    queryString.searchParams.append('client_id', process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID || '');
    queryString.searchParams.append('scope', spotifyScopes.join(' '));
    queryString.searchParams.append(
      'redirect_uri',
      process.env.NEXT_PUBLIC_BASE_URL + process.env.SPOTIFY_REDIRECT_ENDPOINT
    );
    queryString.searchParams.append('state', 'some-random-state');
    return NextResponse.redirect(queryString);
  } catch (error) {
    console.log('Error in getAuthorizeHandler:', error);
    return NextResponse.json({ error: error.message }, { status: error.status || 500 });
  }
};

export const GET = getAuthorizeHandler;
