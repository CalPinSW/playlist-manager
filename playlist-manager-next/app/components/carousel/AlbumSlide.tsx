'use client';

import React, { FC } from 'react';
import Link from 'next/link';
import { AlbumWithPlaylists } from '../../(pages)/(index)/AlbumSearch';
import Image from 'next/image';

interface AlbumSlideProps {
  album: AlbumWithPlaylists | undefined;
  selected?: boolean;
  active?: boolean;
}

const AlbumSlide: FC<AlbumSlideProps> = ({ album }) => {
  return (
    <Link className="group flex-col space-y-2 max-w-32 " href={album ? `album/${album.id}` : '#'}>
      <Image
        className="max-w-32 max-h-32 rounded-md object-cover"
        width={128}
        height={128}
        src={album?.image_url}
        alt={album?.name}
      />
      <div className="px-2 max-w-32 mx-auto text-center group-hover:line-clamp-none sm:line-clamp-2 line-clamp-4 wrap-break-word hyphens-auto">
        {album?.name}
      </div>
      <div className="px-2 max-w-32 mx-auto text-center group-hover:line-clamp-none sm:line-clamp-2 line-clamp-3 wrap-break-word hyphens-auto">
        {album?.artists.map(a => a.name).join(', ')}
      </div>
    </Link>
  );
};

export default AlbumSlide;
