import PlaylistIcon from '../../../../../components/PlaylistIcon';
import { RotatingBorderBox } from '../../../../../components/RotatingBorderBox';
import { album } from '../../../../generated/prisma';
import { FC } from 'react';
import { AlbumWithAdditionalDetails } from './PlaylistAlbums';

interface AlbumContainerProps {
  album: AlbumWithAdditionalDetails;
  onClick: (album: album) => void;
  selected: boolean;
  active?: boolean;
}

export const AlbumContainer: FC<AlbumContainerProps> = ({ album, onClick, selected, active }) => {
  return (
    <div
      className={`group size-40 max-size-40 lg:size-72 lg:max-size-72 [perspective:1000px]`}
      onClick={() => {
        onClick(album);
      }}>
      <RotatingBorderBox active={active}>
        <div
          className={`size-full p-1 relative transition-all duration-500 [transform-style:preserve-3d] ${
            selected && '[transform:rotateY(180deg)]'
          }`}>
          <AlbumCover album={album} blur={selected} />
          {selected && (
            <div className="absolute top-0 [transform:rotateY(180deg)] [backface-visibility:hidden]">
              <div className="flex flex-col space-y-2 m-2">
                <div>{album.name}</div>
                <div>{album.artists.map(artist => artist.name).join(', ')}</div>
              </div>
            </div>
          )}
        </div>
      </RotatingBorderBox>
    </div>
  );
};

interface AlbumCoverProps {
  album: album;
  blur?: boolean;
}

export const AlbumCover: FC<AlbumCoverProps> = ({ album, blur }) => {
  if (album.image_url) {
    return (
      <img
        src={album.image_url}
        title={album.name}
        className={`size-full transition-all duration-500 ${blur && 'opacity-70 blur-[2px]'}`}></img>
    );
  }
  return <PlaylistIcon className="size-full fill-primary" />;
};
