import React, { FC } from "react";
import { Album } from "../../interfaces/Album";
import { renderArtistList } from "../../utils/renderArtistList";

interface AlbumInfoProps {
    album: Album
}

const AlbumInfo: FC<AlbumInfoProps> = ({album}) => {
    return (
        <div className="flex flex-col">
          <div>album: {album.name}</div>
          <div>
            artists: {renderArtistList(album.artists)}
          </div>
          <div>genres: {album.genres}</div>
          <div>label: {album.label}</div>
        </div>
    )
}

export default AlbumInfo