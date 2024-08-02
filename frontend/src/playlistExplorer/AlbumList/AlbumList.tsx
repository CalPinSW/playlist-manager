import React, { FC } from "react";
import { Album } from "../../interfaces/Album";
import { AlbumContainer } from "./AlbumContainer";
import Box from "../../components/Box";
import { Playlist } from "../../interfaces/Playlist";

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
  return (
    <Box>
      <div className="grid grid-cols-2 gap-2 sm:mx-24 h-[60vh] overflow-auto">
        {albumList.map((album) => (
          <AlbumContainer
            album={album}
            key={album.id}
            contextPlaylist={contextPlaylist}
            associatedPlaylists={associatedPlaylists}
            active={album.id == activeAlbumId}
          />
        ))}
      </div>
    </Box>
  );
};
