import { RotatingBorderBox } from '../../../components/RotatingBorderBox';
import { album } from '../../../../../generated/prisma';
import { FC } from 'react';
import { AlbumWithAdditionalDetails } from './PlaylistAlbums';
import { AlbumCover } from '../../../components/AlbumCover';
import Image from 'next/image';
import PlayingAlbumIcon from '../../../components/icons/PlayingAlbumIcon';
import renderArtistList from '../../../../utils/renderArtistsList';

interface AlbumContainerProps {
  album: AlbumWithAdditionalDetails;
  onClick: (album: album) => void;
  selected: boolean;
  active?: boolean;
}

export const foo: FC<AlbumContainerProps> = ({ album, onClick, selected, active }) => {
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
          <AlbumCover name={album.name} imageUrl={album.image_url} blur={selected} />
          {selected && (
            <div className="absolute top-0 [transform:rotateY(180deg)] [backface-visibility:hidden]">
              <div className="flex flex-col space-y-2 m-2">
                <div>{album.name}</div>
                <div>{renderArtistList(album.artists)}</div>
              </div>
            </div>
          )}
        </div>
      </RotatingBorderBox>
      <div className="w-full h-6 bg-background-offset"></div>
    </div>
  );
};

export const AlbumContainer: FC<AlbumContainerProps> = ({ album, onClick, active }) => {
  return (
    <button
      className="flex-col space-y-2 max-w-32"
      onClick={() => {
        onClick(album);
      }}>
      <RotatingBorderBox active={active}>
        {album?.image_url ? (
          <Image
            className="max-w-32 max-h-32 rounded-t-md object-cover"
            width={128}
            height={128}
            src={album?.image_url}
            alt={album?.name}
          />
        ) : (
          <PlayingAlbumIcon className="fill-primary bg-background-offset rounded-t-md" />
        )}
      </RotatingBorderBox>
      <div className="bg-background-offset rounded-b-md">
        <div className="px-2 max-w-32 mx-auto font-bold text-wrap">{album.name}</div>
        <div className="px-2 max-w-32 mx-auto text-wrap">{renderArtistList(album.artists)}</div>
      </div>
    </button>
  );
};
