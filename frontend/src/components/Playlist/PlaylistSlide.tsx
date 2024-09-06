import React, { FC } from 'react'
import { Playlist } from '../../interfaces/Playlist'
import PlaylistIcon from '../PlaylistIcon';
import { Link } from 'react-router-dom';

const PlaylistSlide: FC<Playlist> = (playlist) => (
      <Link className="flex-col space-y-2 max-w-32" to={`edit/${playlist.id}`} >
            {playlist.image_url ? <img className='max-w-32 max-h-32 rounded-md object-cover' src={playlist.image_url} />
            : <PlaylistIcon className="max-w-32 max-h-32 rounded-md bg-background-offset fill-primary" />}
            <div className='px-2 mx-auto text-center text-wrap'>
                  {playlist.name}
            </div>
      </Link>
  )

  export default PlaylistSlide;