import React, { FC } from 'react'
import { Playlist } from '../../interfaces/Playlist'
import PlaylistIcon from '../PlaylistIcon';
import { Link } from 'react-router-dom';
import ImageWithFallback from '../ImageWithFallback';

const PlaylistSlide: FC<Playlist | undefined> = (playlist) => {
      return (
      <Link className="flex-col space-y-2 max-w-32" to={playlist ? `edit/${playlist.id}` : "#"} >
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