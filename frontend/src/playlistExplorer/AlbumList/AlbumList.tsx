import React, { FC, useEffect, useRef, useState } from "react";
import { Album } from "../../interfaces/Album";
import { AlbumContainer } from "./AlbumContainer";
import { Playlist } from "../../interfaces/Playlist";
import Carousel from "../../components/Carousel/Carousel";
import AlbumInfo from "./AlbumInfo";
import AlbumActions from "./AlbumActions";
import Box from "../../components/Box";

interface AlbumListProps {
  albumList: Album[];
  contextPlaylist: Playlist;
  associatedPlaylists: Playlist[];
  activeAlbumId?: string;
}
export const AlbumList: FC<AlbumListProps> = ({
  albumList,
  contextPlaylist,
  associatedPlaylists,
  activeAlbumId,
}) => {
  const activeAlbumIndex = albumList.findIndex((album) => album.id === activeAlbumId);
  const [selectedAlbum, setSelectedAlbum] = useState<Album | undefined>(undefined)
  const onAlbumClick = (album: Album) => {
    if (selectedAlbum && selectedAlbum.id == album.id) {
      setSelectedAlbum(undefined)
    } else {
      setSelectedAlbum(album)
    }
  }
  const selectedAlbumIndex = selectedAlbum ? albumList.findIndex((album) => album.id === selectedAlbum.id) : undefined;
  const albumInfoRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (selectedAlbum && albumInfoRef.current) {
      albumInfoRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [selectedAlbum]);

  return (
    <div>
      <Carousel startIndex={activeAlbumIndex != -1 ? activeAlbumIndex : 0} selectedIndex={selectedAlbumIndex} slides={albumList.map((album) => (
          <AlbumContainer
            album={album}
            key={album.id}
            selected={album.id == selectedAlbum?.id}
            active={album.id == activeAlbumId}
            onClick={onAlbumClick}
          />
        )
      )}/>
      {selectedAlbum && 
      <Box className="my-2" > 
        <div ref={albumInfoRef}>
          <AlbumInfo album={selectedAlbum} />
          <AlbumActions album={selectedAlbum} associatedPlaylists={associatedPlaylists} contextPlaylist={contextPlaylist} />
        </div>
      </Box>}
    </div>
  );
  
};
