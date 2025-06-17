'use client';
import { UserProfile } from '@spotify/web-api-ts-sdk';
import React, { FC } from 'react';
import AsyncButton from '../../components/AsyncButton';
import Image from 'next/image';

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
      </div>
      <a href={user.external_urls.spotify} className="text-primary underline m-3 p-2">
        View Spotify profile
      </a>
    </div>
  );
};

export default SpotifyConnectedSettings;
