'use client';

import { FC, useEffect, useRef, useState } from 'react';
import { album, album_notes, artist, genre, playlist } from '../../../../../generated/prisma';
import Carousel from '../../../components/carousel/Carousel';
import { usePlaybackContext } from '../../../../hooks/usePlaybackContext';
import { AlbumContainer } from './AlbumContainer';
import PlaylistActions from './AlbumActions';

export interface AlbumWithAdditionalDetails extends album {
  genres: genre[];
  notes: album_notes[];
  artists: artist[];
}

export interface PlaylistWithAlbums extends playlist {
  albums: AlbumWithAdditionalDetails[];
}

interface PlaylistAlbumsProps {
  playlistWithAlbums: PlaylistWithAlbums;
  associatedPlaylists: playlist[];
}

const PlaylistAlbums: FC<PlaylistAlbumsProps> = ({
  playlistWithAlbums: { albums, ...playlist },
  associatedPlaylists
}) => {
  const { playbackInfo } = usePlaybackContext();
  const activeAlbumId = playbackInfo?.album_id;
  const activeAlbumIndex = albums.findIndex(album => album.id === activeAlbumId);
  const [selectedAlbum, setSelectedAlbum] = useState<album | undefined>(undefined);
  const onAlbumClick = (album: album) => {
    if (selectedAlbum && selectedAlbum.id == album.id) {
      setSelectedAlbum(undefined);
    } else {
      setSelectedAlbum(album);
    }
  };
  const selectedAlbumIndex = selectedAlbum ? albums.findIndex(album => album.id === selectedAlbum.id) : undefined;
  const albumInfoRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (selectedAlbum && albumInfoRef.current) {
      albumInfoRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [selectedAlbum]);

  return (
    <div className="flex flex-col gap-4">
      <Carousel
        startIndex={activeAlbumIndex != -1 ? activeAlbumIndex : 0}
        selectedIndex={selectedAlbumIndex}
        slides={albums.map((a, index) => (
          <AlbumContainer
            album={a}
            onClick={onAlbumClick}
            key={`playlistSearch ${index}`}
            selected={a.id == selectedAlbum?.id}
            active={a.id == activeAlbumId}
          />
        ))}
      />
      <div className="flex">
        <PlaylistActions
          selectedAlbum={selectedAlbum}
          currentPlaylist={playlist}
          associatedPlaylists={associatedPlaylists}
        />
      </div>
    </div>
  );
};

export default PlaylistAlbums;
