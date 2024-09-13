import React, { FC, useState } from "react";
import { Album } from "../../interfaces/Album";
import { AlbumContainer } from "./AlbumContainer";
import { Playlist } from "../../interfaces/Playlist";
import Carousel from "../../components/Carousel/Carousel";
import Button from "../../components/Button";
import { addAlbumToPlaylist, startPlayback } from "../../api";

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

  return (
    <div>
      <Carousel startIndex={activeAlbumIndex != -1 ? activeAlbumIndex : 0} slides={albumList.map((album) => (
          <AlbumContainer
            album={album}
            key={album.id}
            active={album.id == activeAlbumId}
            onClick={onAlbumClick}
          />
        )
      )}/>
      {selectedAlbum && 
      <div className="flex"> 
        <div className="flex flex-col">
          <div>album: {selectedAlbum.name}</div>
          <div>
            artists: {selectedAlbum.artists.map((artist) => artist.name).join(", ")}
          </div>
          <div>genres: {selectedAlbum.genres}</div>
          <div>label: {selectedAlbum.label}</div>
        </div>
        <div className="flex flex-col">
        {associatedPlaylists.map((associatedPlaylist) => (
          <Button
            onClick={() => addAlbumToPlaylist(associatedPlaylist.id, selectedAlbum.id)}
            key={associatedPlaylist.id}
          >
            Add to {associatedPlaylist.name}
        </Button>
        ))}
        <Button
            onClick={() => (startPlayback({context_uri: contextPlaylist.uri, offset: {album_id: selectedAlbum.id} }))}
          >
            Play Album
          </Button>
        </div>
      </div>}
    </div>
  );
  
};
