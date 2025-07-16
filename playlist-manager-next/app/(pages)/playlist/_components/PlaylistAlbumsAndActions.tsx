import { FC } from 'react';
import { playlist } from '../../../../generated/prisma';
import PlaylistAlbums, { AlbumWithAdditionalDetails } from './PlaylistAlbums/PlaylistAlbums';
import PlaylistActions from './PlaylistActions';

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
  const playlistAlbums = initialPlaylistAlbums;

  return (
    <div>
      <PlaylistActions playlist={playlist} playlistAlbums={playlistAlbums} />
      <PlaylistAlbums playlist={playlist} playlistAlbums={playlistAlbums} associatedPlaylists={associatedPlaylists} />
    </div>
  );
};

export default PlaylistAlbumAndActions;
