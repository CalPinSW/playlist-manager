import { FC } from 'react';
import { AlbumCover } from '../../components/AlbumCover';
import { AlbumInfo } from '../../../utils/interfaces/AlbumInfo/AlbumInfo';
import renderGenres from '../../../utils/AlbumInfo/renderGenres';

interface AlbumHeaderProps {
  albumInfo: AlbumInfo;
}

const AlbumHeader: FC<AlbumHeaderProps> = async ({ albumInfo }) => {
  return (
    <div className="flex gap-12 sm:gap-24">
      <AlbumCover className={'h-32 w-32'} albumName={albumInfo.name} imageUrl={albumInfo.albumImageUrl} />
      <div className="flex flex-col my-4 space-y-2">
        <div className="text-4xl">{albumInfo.name}</div>
        {albumInfo.artists.map(a => (
          <div key={`artist ${a.spotifyId}`} className="text-xl font-light">
            {a.name}
          </div>
        ))}
        <div>{albumInfo.genres && <div className="text-text-secondary">{renderGenres(albumInfo.genres)}</div>}</div>
        {
          albumInfo.type && <div>{albumInfo.type}</div> // Represent Symbolically?
        }
      </div>
    </div>
  );
};

export default AlbumHeader;
