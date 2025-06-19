import { Album } from '@spotify/web-api-ts-sdk';
import Image from 'next/image';
import { FC } from 'react';
import PlaylistIcon from '../../../components/PlaylistIcon';

interface SpotifyAlbumCoverProps {
  album: Album;
  blur?: boolean;
  className?: string;
}

export const SpotifyAlbumCover: FC<SpotifyAlbumCoverProps> = ({ album, blur, className }) => {
  if (album.images[0].url) {
    return (
      <Image
        width={128}
        height={128}
        src={album.images[0].url}
        title={album.name}
        alt={`${album.name} artwork`}
        className={`size-full transition-all duration-500 ${blur && 'opacity-70 blur-[2px]'} ${className}`}></Image>
    );
  }
  return <PlaylistIcon className={`size-full fill-primary ${className}`} />;
};
