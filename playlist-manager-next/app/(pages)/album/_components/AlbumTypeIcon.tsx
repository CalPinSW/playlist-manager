import { FC } from 'react';
import PlayingAlbumIcon from '../../components/icons/PlayingAlbumIcon';
import MicrophoneIcon from '../../components/icons/MicrophoneIcon';
import EpIcon from '../../components/icons/EpIcon';

interface AlbumTypeIconProps {
  albumType: string;
  className?: string;
}

const AlbumTypeIcon: FC<AlbumTypeIconProps> = async ({ albumType, className }) => {
  switch (albumType) {
    case 'Album':
      return <PlayingAlbumIcon className={className} />;
    case 'EP':
      return <EpIcon className={className} />;
    case 'Other':
      return <MicrophoneIcon className={className} />;
    default:
      return <div>{albumType}</div>;
  }
};

export default AlbumTypeIcon;
