'use client';

import { FC } from 'react';
import { album, playlist } from '../../../../../generated/prisma';
import { StartPlaybackRequest } from '../../../../utils/interfaces/PlaybackRequest';
import { AddAlbumToSpotifyPlaylistRequest } from '../../../../api/playlists/[playlistId]/add-album/route';
import AsyncButton from '../../../components/AsyncButton';
import Link from 'next/link';

interface AlbumActionsProps {
  selectedAlbum: album | null;
  currentPlaylist: playlist;
  associatedPlaylists: playlist[];
}

const AlbumActions: FC<AlbumActionsProps> = ({ selectedAlbum, currentPlaylist, associatedPlaylists }) => {
  if (!selectedAlbum) {
    return null;
  }
  const handlePlayAlbumClick = async () => {
    const startPlaybackRequest: StartPlaybackRequest = {
      context_uri: currentPlaylist.uri,
      offset: { type: 'album_id', album_id: selectedAlbum.id }
    };
    await fetch('/api/spotify/playback/start', { method: 'POST', body: JSON.stringify(startPlaybackRequest) });
  };

  const handleAddAlbumToPlaylistClick = async (playlistId: string) => {
    const requestBody: AddAlbumToSpotifyPlaylistRequest = {
      albumId: selectedAlbum.id
    };
    const response = await fetch(`/api/playlists/${playlistId}/add-album`, {
      method: 'POST',
      body: JSON.stringify(requestBody)
    });
    if (!response.ok) {
      throw new Error(response.statusText);
    }
  };

  return (
    <div className="flex flex-col w-2/3 gap-2 p-2 m-auto bg-background-offset rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
      {associatedPlaylists.map(ap => (
        <AsyncButton
          key={`Add To Playlist ${ap.id} Button`}
          successMessage={`Added ${selectedAlbum.name} to ${ap.name}`}
          onClick={async () => {
            await handleAddAlbumToPlaylistClick(ap.id);
          }}
          className="border-background-interactive border-1 sm:border-0">
          Add to {ap.name}
        </AsyncButton>
      ))}
      <AsyncButton className="border-background-interactive border-1 sm:border-0" onClick={handlePlayAlbumClick}>
        Play Album
      </AsyncButton>
      <Link
        className={
          'border-background-interactive border-1 sm:border-0 text-center p-2 rounded hover:bg-background-interactive cursor-pointer active:bg-primary'
        }
        href={`/album/${selectedAlbum.id}`}>
        View Album Info
      </Link>
    </div>
  );
};

export default AlbumActions;
