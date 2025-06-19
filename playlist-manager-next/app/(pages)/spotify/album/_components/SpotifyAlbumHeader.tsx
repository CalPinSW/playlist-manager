import { FC } from 'react';
import { Album } from '@spotify/web-api-ts-sdk';
import { SpotifyAlbumCover } from './SpotifyAlbumCover';
import fetchMBReleaseGroupMatch from '../../../../utils/MusicBrainz/fetchMBReleaseGroupMatch';

interface SpotifyAlbumHeaderProps {
  album: Album;
}

const SpotifyAlbumHeader: FC<SpotifyAlbumHeaderProps> = async ({ album }) => {
  const mbAlbumInfo = await fetchMBReleaseGroupMatch(album);
  const genres = mbAlbumInfo?.['tags'];
  return (
    <div className="flex gap-12 sm:gap-24">
      <SpotifyAlbumCover className={'h-32 w-32'} album={album} />
      <div className="flex flex-col my-4 space-y-2">
        <div className="text-4xl">{album.name}</div>
        {album.artists.map(a => (
          <div key={`artist ${a.id}`} className="text-xl font-light">
            {a.name}
          </div>
        ))}
        <div>
          {genres && (
            <div className="text-text-secondary">
              {genres
                .sort((t1, t2) => t2.count - t1.count)
                .slice(0, 5)
                .map(tag => tag.name)
                .join(', ')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SpotifyAlbumHeader;
