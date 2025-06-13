'use client';

import { FC, useState } from 'react';
import { album, playlist } from '../../../../generated/prisma';
import LoadingSpinner from '../../../../../components/LoadingSpinner';
import { toast } from 'react-toastify';
import { ResumePlaybackRequest, StartPlaybackRequest } from '../../../../utils/interfaces/PlaybackRequest';
import { AddAlbumToSpotifyPlaylistRequest } from '../../../../api/playlists/[playlistId]/add-album/route';

interface PlaylistActionsProps {
  selectedAlbum: album | null;
  currentPlaylist: playlist;
  associatedPlaylists: playlist[];
}

const PlaylistActions: FC<PlaylistActionsProps> = ({ selectedAlbum, currentPlaylist, associatedPlaylists }) => {
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
    <div className="flex flex-col w-2/3 gap-2 m-auto bg-background-offset rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
      {associatedPlaylists.map(ap => (
        <PlaylistActionButton
          key={`Add To Playlist ${ap.id} Button`}
          text={`Add to ${ap.name}`}
          successMessage={`Added ${selectedAlbum.name} to ${ap.name}`}
          onClick={async () => {
            await handleAddAlbumToPlaylistClick(ap.id);
          }}
        />
      ))}
      <PlaylistActionButton text="Play Album" onClick={handlePlayAlbumClick} />
    </div>
  );
};

export default PlaylistActions;

interface PlaylistActionButtonProps {
  text: string;
  onClick(): Promise<void>;
  successMessage?: string;
}

const PlaylistActionButton: FC<PlaylistActionButtonProps> = ({ text, onClick, successMessage }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);
    setIsError(false);
    await onClick()
      .then(() => {
        if (successMessage) {
          toast(successMessage, {
            type: 'success',
            closeOnClick: true,
            position: 'bottom-right',
            theme: 'dark'
          });
        }
      })
      .catch((e: Error) => {
        setIsError(true);
        console.log(e);
        console.log('HERE');
        toast(e.message, {
          type: 'error',
          position: 'bottom-right',
          theme: 'dark',
          closeOnClick: true,
          onClose: () => {
            setIsError(false);
          }
        });
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  return (
    <button
      className={`hover:bg-background-interactive p-2 rounded active:bg-primary ${
        isLoading ? 'bg-primary-darker' : ''
      } ${isError ? 'bg-warning' : ''}`}
      onClick={handleClick}>
      <div className={`p-2 ${isLoading ? 'hidden' : ''}`}>{text}</div>
      <div className={`m-auto h-8 w-8 ${isLoading ? '' : 'hidden'}`}>
        <LoadingSpinner />
      </div>
    </button>
  );
};
