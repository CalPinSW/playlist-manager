import { FC } from 'react';
import { album } from '../../../generated/prisma';
import PlaylistIcon from './PlaylistIcon';
import Image from 'next/image';

interface AlbumCoverProps {
  album: album;
  blur?: boolean;
  className?: string;
}

export const AlbumCover: FC<AlbumCoverProps> = ({ album, blur, className }) => {
  if (album.image_url) {
    return (
      <Image
        width={128}
        height={128}
        src={album.image_url}
        title={album.name}
        alt={`${album.name} artwork`}
        className={`size-full transition-all duration-500 ${blur && 'opacity-70 blur-[2px]'} ${className}`}></Image>
    );
  }
  return <PlaylistIcon className={`size-full fill-primary ${className}`} />;
};
