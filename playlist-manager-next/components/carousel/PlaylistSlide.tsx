import React, { FC } from 'react'
import Link from 'next/link';
import PlaylistIcon from '../PlaylistIcon';
import { playlist } from '../../app/generated/prisma';
import ImageWithFallback from '../ImageWithFallback';

interface PlaylistSlideProps { 
      playlist: playlist | undefined
}

const PlaylistSlide: FC<PlaylistSlideProps> = ({playlist}) => {
      return (
      <Link className="flex-col space-y-2 max-w-32" href={playlist ? `edit/${playlist.id}` : "#"} >
            <ImageWithFallback 
                  className='max-w-32 max-h-32 rounded-md object-cover' 
                  src={playlist?.image_url} 
                  alt={playlist?.name}
                  fallback={<PlaylistIcon className="w-32 h-32 rounded-md bg-background-offset fill-primary" />}/>
            <div className='px-2 max-w-32 mx-auto text-center text-wrap'>
                  {playlist ? playlist.name : "playlist"}
            </div>
      </Link>
  )}

  export default PlaylistSlide;