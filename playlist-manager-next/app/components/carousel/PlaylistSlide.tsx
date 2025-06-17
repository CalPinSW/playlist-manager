import React, { FC } from 'react';
import Link from 'next/link';
import { playlist } from '../../../generated/prisma';
import Image from 'next/image';
import PlaylistIcon from '../icons/PlaylistIcon';

interface PlaylistSlideProps {
  playlist: playlist;
}

const PlaylistSlide: FC<PlaylistSlideProps> = ({ playlist }) => {
  const url = playlist?.image_url && playlist?.image_url !== '' ? playlist.image_url : null;
  return (
    <Link className="flex-col space-y-2 max-w-32" href={playlist ? `playlist/${playlist?.id}` : '#'}>
      {url ? (
        <Image
          className="max-w-32 max-h-32 rounded-md object-cover"
          width={128}
          height={128}
          src={url}
          alt={playlist?.name}
        />
      ) : (
        <PlaylistIcon className="fill-primary bg-background-offset rounded-md" />
      )}

      <div className="px-2 max-w-32 mx-auto text-center text-wrap">{playlist ? playlist.name : 'playlist'}</div>
    </Link>
  );
};

export default PlaylistSlide;
