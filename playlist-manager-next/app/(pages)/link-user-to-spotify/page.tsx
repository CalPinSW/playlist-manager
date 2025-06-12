'use client';
import React from 'react';
import { spotifyScopes } from '../../../lib/spotify';

export default function Index() {
  const linkToSpotifyHandler = async () => {
    const queryString = new URL('https://accounts.spotify.com/authorize');
    queryString.searchParams.append('response_type', 'code');
    queryString.searchParams.append('client_id', process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID || '');
    queryString.searchParams.append('scope', spotifyScopes.join(' '));
    queryString.searchParams.append('redirect_uri', process.env.SPOTIFY_REDIRECT_URI);
    queryString.searchParams.append('state', 'some-random-state');
    window.open(queryString.toString(), '_self');
  };

  const refreshUserDataHandler = async () => {
    await fetch('/api/spotify/user/refetch-data');
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="text-5xl m-3 p-4">Link User to Spotify</div>
      <button className="m-3 p-4 bg-primary rounded-sm cursor-pointer" onClick={linkToSpotifyHandler}>
        Click to Connect
      </button>
      <button className="m-3 p-4 bg-primary rounded-sm cursor-pointer" onClick={refreshUserDataHandler}>
        Refetch User Data
      </button>
    </div>
  );
}
