'use client';

import { FC } from 'react';
import AsyncButton from '../../components/AsyncButton';
import { ArrowDownTrayIcon, ArrowPathIcon, ClipboardIcon, PlayIcon } from '@heroicons/react/24/outline';
import { useDownloadImages } from '../../../hooks/useDownload';
import { ResumePlaybackRequest } from '../../../utils/interfaces/PlaybackRequest';
import renderArtistList from '../../../utils/renderArtistsList';
import { playlist } from '../../../../generated/prisma';
import { AlbumWithAdditionalDetails } from './PlaylistAlbums/PlaylistAlbums';
import { useQueryClient } from '@tanstack/react-query';

interface PlaylistActionsProps {
  playlist: playlist;
  playlistAlbums: AlbumWithAdditionalDetails[];
}

const PlaylistActions: FC<PlaylistActionsProps> = ({ playlist, playlistAlbums }) => {
  const { handleZip } = useDownloadImages();
  const queryClient = useQueryClient();

  const playlistImages = playlistAlbums.map((album, i) => ({
    url: album.image_url,
    name: `${i + 1}_${album.name} - ${renderArtistList(album.artists)}`
  }));
  const downloadImagesHandler = () => handleZip(playlist.name, playlistImages);

  const copyArtistsHandler = async () => {
    const albumArtistList = playlistAlbums
      .map(album => {
        const artistNames = renderArtistList(album.artists);
        return `${album.name} - ${artistNames}`;
      })
      .join('\n');
    await navigator.clipboard.writeText(albumArtistList);
  };

  const updatePlaylistHandler = async () => {
    await fetch(`/api/playlists/${playlist.id}/refresh`);
    await queryClient.invalidateQueries({ queryKey: ['playlistAlbums', playlist.id] });
  };

  const resumePlaylistHandler = async () => {
    const requestBody: ResumePlaybackRequest = { id: playlist.id };
    await fetch('/api/spotify/playback/resume', {
      method: 'POST',
      body: JSON.stringify(requestBody)
    });
  };

  return (
    <div className="grid grid-cols-2 justify-between sm:flex sm:justify-end flex-row my-4 gap-2">
      <AsyncButton className="flex bg-primary hover:bg-primary-darker justify-center" onClick={resumePlaylistHandler}>
        <div className="flex gap-2 sm:p-2 flex-row">
          <PlayIcon className="m-auto" width={24} height={24} />
          Resume Playlist
        </div>
      </AsyncButton>
      <AsyncButton className="flex bg-primary hover:bg-primary-darker justify-center" onClick={updatePlaylistHandler}>
        <div className="flex gap-2 sm:p-2 flex-row">
          <ArrowPathIcon className="m-auto" width={24} height={24} />
          Refresh Playlist Data
        </div>
      </AsyncButton>
      <AsyncButton className="flex bg-primary hover:bg-primary-darker justify-center" onClick={downloadImagesHandler}>
        <div className="flex gap-2 sm:p-2 flex-row">
          <ArrowDownTrayIcon className="m-auto" width={24} height={24} />
          Download Album Images
        </div>
      </AsyncButton>
      <AsyncButton
        className="flex bg-primary hover:bg-primary-darker justify-center"
        onClick={copyArtistsHandler}
        successMessage="Artist List copied">
        <div className="flex gap-2 sm:p-2 sflex-row">
          <ClipboardIcon className="m-auto" width={24} height={24} />
          Copy Artist List
        </div>
      </AsyncButton>
    </div>
  );
};

export default PlaylistActions;
