import React, { FC, useEffect, useRef, useState } from "react";
import { Album } from "../../interfaces/Album";
import PlaylistIcon from "../../components/PlaylistIcon";
import { RotatingBorderBox } from "../../components/RotatingBorderBox";
import Modal from "../../components/Modal";
import { Playlist } from "../../interfaces/Playlist";
import { addAlbumToPlaylist } from "../../api";
import { useModal } from "../../hooks/useModal";
import Button from "../../components/Button";

interface AlbumContainerProps {
  album: Album;
  associatedPlaylists: Playlist[];
  active?: boolean;
}

export const AlbumContainer: FC<AlbumContainerProps> = ({
  album,
  associatedPlaylists,
  active,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (active && ref.current) {
      ref.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [active]);
  const [showMoreInfo, setShowMoreInfo] = useState(false);
  const { isModalOpen, openModal, closeModal } = useModal();
  return (
    <>
      <Modal isModalOpen={isModalOpen} closeModal={closeModal}>
        <AlbumActionsModalContent
          associatedPlaylists={associatedPlaylists}
          album={album}
          closeModal={closeModal}
        />
      </Modal>
      <div
        className={`group max-h-80 max-w-80 [perspective:1000px]`}
        onClick={() => {
          setShowMoreInfo((current) => !current);
        }}
      >
        <RotatingBorderBox active={active}>
          <div
            ref={ref}
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
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openModal();
                    }}
                  >
                    Actions
                  </button>
                </div>
              </div>
            )}
          </div>
        </RotatingBorderBox>
      </div>
    </>
  );
};

interface AlbumActionsModalContentProps {
  album: Album;
  associatedPlaylists: Playlist[];
  closeModal: () => void;
}
const AlbumActionsModalContent: FC<AlbumActionsModalContentProps> = ({
  album,
  associatedPlaylists,
  closeModal,
}) => {
  const addAlbumToAssociatedPlaylist = (targetPlaylist: Playlist): void => {
    addAlbumToPlaylist(targetPlaylist.id, album.id);
    closeModal();
  };
  return (
    <div>
      <div className="flex flex-row justify-between">
        <h2 className="my-auto text-m">Actions:</h2>
        <button onClick={closeModal}>X</button>
      </div>
      <div className="my-2 space-y-2">
        {associatedPlaylists.map((associatedPlaylist) => (
          <Button
            onClick={() => addAlbumToAssociatedPlaylist(associatedPlaylist)}
            key={associatedPlaylist.id}
          >
            Add to {associatedPlaylist.name}
          </Button>
        ))}
      </div>
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
