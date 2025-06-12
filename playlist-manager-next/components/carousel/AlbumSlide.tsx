'use client';

import React, { FC } from 'react';
import Link from 'next/link';
import PlaylistIcon from '../PlaylistIcon';
import { album } from '../../app/generated/prisma';
import ImageWithFallback from '../ImageWithFallback';

interface AlbumSlideProps {
  album: album | undefined;
}

const AlbumSlide: FC<AlbumSlideProps> = ({ album }) => {
  return (
    <Link className="flex-col space-y-2 max-w-32" href={album ? `album/${album.id}` : '#'}>
      <img className="max-w-32 max-h-32 rounded-md object-cover" src={album?.image_url} alt={album?.name} />
      <div className="px-2 max-w-32 mx-auto text-center text-wrap">{album ? album.name : 'playlist'}</div>
    </Link>
  );
};

export default AlbumSlide;
