'use client';
import { FC } from 'react';
import { playlist } from '../../../../generated/prisma';
import PlaylistAlbums, { AlbumWithAdditionalDetails } from './PlaylistAlbums/PlaylistAlbums';
import PlaylistActions from './PlaylistActions';
import { useQuery } from '@tanstack/react-query';

interface PlaylistAlbumAndActionsProps {
  playlist: playlist;
  initialPlaylistAlbums: AlbumWithAdditionalDetails[];
  associatedPlaylists: playlist[];
}

const PlaylistAlbumAndActions: FC<PlaylistAlbumAndActionsProps> = ({
  playlist,
  initialPlaylistAlbums,
  associatedPlaylists
}) => {
  const playlistAlbumsQuery = useQuery<AlbumWithAdditionalDetails[]>({
    queryKey: ['playlistAlbums', playlist.id],
    queryFn: () => fetchPlaylistAlbums(playlist.id),
    initialData: initialPlaylistAlbums
  });

  return (
    <div>
      <PlaylistActions playlist={playlist} playlistAlbums={playlistAlbumsQuery.data} />
      <PlaylistAlbums
        playlist={playlist}
        playlistAlbums={playlistAlbumsQuery.data}
        associatedPlaylists={associatedPlaylists}
      />
    </div>
  );
};

const fetchPlaylistAlbums = async (playlistId: string): Promise<AlbumWithAdditionalDetails[]> => {
  const response = await fetch(`/api/playlists/${playlistId}/albums`);
  if (!response.ok) {
    throw new Error('Failed to fetch playlist albums');
  }
  return response.json();
};

export default PlaylistAlbumAndActions;
