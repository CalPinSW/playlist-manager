import { FC } from 'react';
import { AlbumWithTracks } from '../[albumId]/page';
import { AlbumCover } from '../../../components/AlbumCover';
import mbApi from '../../../../lib/musicbrainz';

interface AlbumHeaderProps {
  album: AlbumWithTracks;
}

const AlbumHeader: FC<AlbumHeaderProps> = async ({ album }) => {
  const mbAlbumInfo = await fetchMBAlbumInfo(album);
  const genres = mbAlbumInfo?.['tags'];
  return (
    <div className="flex gap-12 sm:gap-24">
      <AlbumCover className={'h-32 w-32'} album={album} />
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

export default AlbumHeader;

const fetchMBAlbumInfo = async (album: AlbumWithTracks) => {
  const artist = album.artists[0].name;
  const title = album.name;
  const query = `query=artist:"${artist}" AND release:"${title}"`;
  const results = await mbApi.search('release-group', { query });
  return results['release-groups'].find(rg => rg['primary-type'] == 'Album');
};
