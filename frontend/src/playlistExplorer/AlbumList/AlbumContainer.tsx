import React, { FC } from "react";
import { Album } from "../../interfaces/Album";
import PlaylistIcon from "../../components/PlaylistIcon";
import { RotatingBorderBox } from "../../components/RotatingBorderBox";

interface AlbumContainerProps {
  album: Album;
  onClick: (album: Album) => void;
  selected: boolean;
  active?: boolean;
}

export const AlbumContainer: FC<AlbumContainerProps> = ({
  album,
  onClick,
  selected,
  active,
}) => {
  return (
      <div
        className={`group size-40 max-size-40 lg:size-72 lg:max-size-72 [perspective:1000px]`}
        onClick={() => {
          onClick(album)
        }}
      >
        <RotatingBorderBox active={active}>
          <div
            className={`size-[100%-1px] m-1 relative transition-all duration-500 [transform-style:preserve-3d] ${
              selected && "[transform:rotateY(180deg)]"
            }`}
          >
            <AlbumCover album={album} blur={selected} />
            {selected && (
              <div className="absolute top-0 [transform:rotateY(180deg)] [backface-visibility:hidden]">
                <div className="flex flex-col space-y-2 m-2">
                  <div>{album.name}</div>
                </div>
              </div>
            )}
          </div>
        </RotatingBorderBox>
      </div>
  );
};

interface AlbumCoverProps {
  album: Album;
  blur?: boolean;
}

export const AlbumCover: FC<AlbumCoverProps> = ({ album, blur }) => {
  if (album.image_url) {
    return (
      <img
        src={album.image_url}
        title={album.name}
        className={`size-full transition-all duration-500 ${
          blur && "opacity-70 blur-[2px]"
        }`}
      ></img>
    );
  }
  return <PlaylistIcon className="size-full fill-primary" />;
};
