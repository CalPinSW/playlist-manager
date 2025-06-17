import { FC } from 'react';
import { playlist } from '../../../../generated/prisma';

interface PlaylistTitleProps {
  playlist: playlist;
}

const PlaylistTitle: FC<PlaylistTitleProps> = ({ playlist }) => {
  return (
    <div className="flex flex-col my-4 space-y-2">
      <input className="text-2xl" placeholder={'Title'} defaultValue={playlist.name} />
    </div>
  );
};

export default PlaylistTitle;
