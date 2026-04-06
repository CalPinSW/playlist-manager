'use client';
import { UserProfile } from '@spotify/web-api-ts-sdk';
import React, { FC } from 'react';
import AsyncButton from '../../components/AsyncButton';
import Image from 'next/image';
import { spotifyScopes } from '../../../../lib/spotify';

interface SpotifyConnectedSettingsProps {
  user: UserProfile;
}

const SpotifyConnectedSettings: FC<SpotifyConnectedSettingsProps> = ({ user }) => {
  const refreshUserDataHandler = async () => {
    await fetch('/api/spotify/user/refetch-data');
  };

  const refreshUserPlaylistsHandler = async () => {
    await fetch('/api/playlists/refresh');
  };

  const reauthorizeSpotifyHandler = () => {
    const queryString = new URL('https://accounts.spotify.com/authorize');
    queryString.searchParams.append('response_type', 'code');
    queryString.searchParams.append('client_id', process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID || '');
    queryString.searchParams.append('scope', spotifyScopes.join(' '));
    queryString.searchParams.append(
      'redirect_uri',
      process.env.NEXT_PUBLIC_BASE_URL + process.env.SPOTIFY_REDIRECT_ENDPOINT
    );
    queryString.searchParams.append('state', 'some-random-state');
    window.open(queryString.toString(), '_self');
  };

  return (
    <div className="flex flex-col items-center justify-center py-8 gap-4">
      <Image
        width={128}
        height={128}
        src={user.images[0].url ?? ''}
        alt="Profile"
        className="rounded-full w-20 h-20"
        data-testid="navbar-picture-desktop"
      />
      <div className="text-5xl m-3">{user.display_name}</div>
      <div className="text-text-secondary"> Followers: {user.followers.total}</div>
      <div className="flex flex-col gap-2">
        <AsyncButton
          successMessage="Successfully fetched Spotify user data"
          className="p-4 bg-primary rounded-sm cursor-pointer"
          onClick={refreshUserDataHandler}>
          Refetch user data
        </AsyncButton>
        <AsyncButton
          successMessage="Successfully refreshed Spotify playlists"
          className="p-4 bg-primary rounded-sm cursor-pointer"
          onClick={refreshUserPlaylistsHandler}>
          Refresh user playlists
        </AsyncButton>
        <button
          className="p-4 bg-primary rounded-sm cursor-pointer hover:bg-background-interactive"
          onClick={reauthorizeSpotifyHandler}>
          Re-authorize Spotify
        </button>
      </div>
      <a href={user.external_urls.spotify} className="text-primary underline m-3 p-2">
        View Spotify profile
      </a>
    </div>
  );
};

export default SpotifyConnectedSettings;
