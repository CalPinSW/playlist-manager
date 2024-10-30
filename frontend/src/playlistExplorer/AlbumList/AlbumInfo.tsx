import React, { FC } from "react";
import { Album } from "../../interfaces/Album";

interface AlbumInfoProps {
    album: Album
}

const AlbumInfo: FC<AlbumInfoProps> = ({album}) => {
    return (
        <div className="flex flex-col">
          <div>album: {album.name}</div>
          <div>
            artists: {album.artists.map((artist) => artist.name).join(", ")}
          </div>
          <div>genres: {album.genres}</div>
          <div>label: {album.label}</div>
        </div>
    )
}

export default AlbumInfo