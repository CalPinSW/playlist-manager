import React, { FC, useState } from "react";
import { Album } from "../../interfaces/Album";
import PlaylistIcon from "../../components/PlaylistIcon";
import { RotatingBorderBox } from "../../components/RotatingBorderBox";

interface AlbumContainerProps {
  album: Album;
  active?: boolean;
}

export const AlbumContainer: FC<AlbumContainerProps> = ({ album, active }) => {
  const [showMoreInfo, setShowMoreInfo] = useState(false);
  return (
    <div
      className={`group max-h-80 max-w-80 [perspective:1000px]`}
      onClick={() => {
        setShowMoreInfo((current) => !current);
      }}
    >
      <RotatingBorderBox active={active}>
        <div
          className={`m-1 relative transition-all duration-500 [transform-style:preserve-3d] ${
            showMoreInfo && "[transform:rotateY(180deg)]"
          }`}
        >
          <AlbumCover album={album} blur={showMoreInfo} />
          {showMoreInfo && (
            <div className="absolute top-0 [transform:rotateY(180deg)] [backface-visibility:hidden]">
              <div className="flex flex-col space-y-2 m-2">
                <div>{album.name}</div>
                <div>
                  {album.artists.map((artist) => artist.name).join(", ")}
                </div>
                <div>{album.genres}</div>
                <div>{album.label}</div>
                <div>{album.popularity}</div>
              </div>
            </div>
          )}
        </div>
      </RotatingBorderBox>
    </div>
  );
};

export const AlbumInfo: FC<AlbumContainerProps> = ({ album }) => {
  return (
    <div className="relative">
      <AlbumCover album={album} blur />
      <div className="absolute top-0">
        <div className="flex flex-col space-y-2 m-2">
          <div>{album.name}</div>
          <div>{album.artists.map((artist) => artist.name).join(", ")}</div>
          <div>{album.genres}</div>
          <div>{album.label}</div>
          <div>{album.popularity}</div>
        </div>
      </div>
    </div>
  );
};

interface AlbumCoverProps {
  album: Album;
  blur?: boolean;
}

export const AlbumCover: FC<AlbumCoverProps> = ({ album, blur }) => {
  if (album.images[0].url) {
    return (
      <img
        src={album.images[0].url}
        title={album.name}
        className={`w-full transition-all duration-500 ${
          blur && "opacity-70 blur-[2px]"
        }`}
      ></img>
    );
  }
  return <PlaylistIcon className="w-full h-full fill-primary-500" />;
};
