'use client';

import { FC } from 'react';
import AsyncButton from '../../../components/AsyncButton';
import { ArrowDownTrayIcon, ClipboardIcon } from '@heroicons/react/24/outline';
import { useDownloadImages } from '../../../hooks/useDownload';
import { PlaylistWithAlbums } from './PlaylistAlbums/PlaylistAlbums';

interface PlaylistActionsProps {
  playlist: PlaylistWithAlbums;
}

const PlaylistActions: FC<PlaylistActionsProps> = ({ playlist }) => {
  const { handleZip } = useDownloadImages();
  const playlistImages = playlist.albums.map((album, i) => ({
    url: album.image_url,
    name: `${i + 1}_${album.name} - ${album.artists.map(artist => artist.name).join(', ')}`
  }));
  const downloadImagesHandler = () => handleZip(playlist.name, playlistImages);

  const copyArtistsHandler = async () => {
    const albumArtistList = playlist.albums
      .map(album => {
        const artistNames = album.artists.map(artist => artist.name).join(', ');
        return `${album.name} - ${artistNames}`;
      })
      .join('\n');
    await navigator.clipboard.writeText(albumArtistList);
  };

  return (
    <div className="flex justify-between sm:justify-end flex-row my-4 space-x-2">
      <AsyncButton className="bg-primary hover:bg-primary-darker justify-center w-fit" onClick={downloadImagesHandler}>
        <div className="flex gap-2">
          <ArrowDownTrayIcon className="" width={24} height={24} />
          Download Album Images
        </div>
      </AsyncButton>
      <AsyncButton
        className="bg-primary hover:bg-primary-darker justify-center w-fit"
        onClick={copyArtistsHandler}
        successMessage="Artist List copied">
        <div className="flex gap-2">
          <ClipboardIcon className="" width={24} height={24} />
          Copy Artist List
        </div>
      </AsyncButton>
    </div>
  );
};

export default PlaylistActions;
