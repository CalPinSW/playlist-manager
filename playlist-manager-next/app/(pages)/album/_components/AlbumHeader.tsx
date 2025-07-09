import { FC } from 'react';
import { AlbumWithTracks } from '../[albumId]/page';
import { AlbumCover } from '../../components/AlbumCover';
import mbApi from '../../../../lib/musicbrainz';
import renderGenres from '../../../utils/AlbumInfo/renderGenres';
import { AlbumInfo } from '../../../utils/interfaces/AlbumInfo/AlbumInfo';
import AlbumTypeIcon from './AlbumTypeIcon';

interface AlbumHeaderProps {
  albumInfo: AlbumInfo;
}

const AlbumHeader: FC<AlbumHeaderProps> = async ({ albumInfo }) => {
  return (
    <div className="flex gap-12 sm:gap-24">
      <AlbumCover className={'h-32 w-32'} name={albumInfo.name} imageUrl={albumInfo.albumImageUrl} />
      <div className="flex flex-col my-4 space-y-2">
        <div className="text-4xl">{albumInfo.name}</div>
        {albumInfo.artists.map(a => (
          <div key={`artist ${a.spotifyId}`} className="text-xl font-light">
            {a.name}
          </div>
        ))}
        {albumInfo.genres && (
          <div>{albumInfo.genres && <div className="text-text-secondary">{renderGenres(albumInfo.genres)}</div>}</div>
        )}
        {albumInfo.type && (
          <AlbumTypeIcon
            albumType={albumInfo.type}
            className="my-auto size-8 stroke-primary-darker fill-primary-darker"
          />
        )}
      </div>
    </div>
  );
};

export default AlbumHeader;
