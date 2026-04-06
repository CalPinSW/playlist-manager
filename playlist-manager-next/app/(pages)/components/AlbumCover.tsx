import { FC } from 'react';
import PlaylistIcon from './PlaylistIcon';
import Image from 'next/image';

interface AlbumCoverProps {
  name: string;
  imageUrl?: string;
  blur?: boolean;
  className?: string;
}

export const AlbumCover: FC<AlbumCoverProps> = ({ name, imageUrl, blur, className }) => {
  if (imageUrl) {
    return (
      <Image
        width={128}
        height={128}
        src={imageUrl}
        title={name}
        alt={`${name} artwork`}
        className={`size-full transition-all duration-500 ${blur && 'opacity-70 blur-[2px]'} ${className}`}></Image>
    );
  }
  return <PlaylistIcon className={`size-full fill-primary ${className}`} />;
};
