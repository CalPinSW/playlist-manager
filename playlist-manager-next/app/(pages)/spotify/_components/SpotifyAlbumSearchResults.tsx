import { PartialSearchResult } from '@spotify/web-api-ts-sdk';
import { FC } from 'react';
import Image from 'next/image';
import renderArtistList from '../../../utils/renderArtistsList';
import renderDateString from '../../../utils/renderDateString';
import Link from 'next/link';

interface SpotifyAlbumSearchResultsProps {
  albums: Required<Pick<PartialSearchResult, 'albums'>>;
}

const SpotifyAlbumSearchResults: FC<SpotifyAlbumSearchResultsProps> = ({ albums }) => {
  return (
    <div className="flex flex-grow mt-2 p-2 h-[50vh] bg-background-offset rounded-md shadow-lg ring-1 ring-black ring-opacity-5">
      <div className="flex flex-col overflow-y-auto gap-2">
        {albums.albums.items.map(album => (
          <Link href={`/album/${album.id}`} className="flex gap-4">
            <Image
              className="rounded-md"
              width={96}
              height={96}
              objectFit={'cover'}
              src={album.images[0].url}
              title={album.name}
              alt={`Spotify Album ${album.name}`}
            />
            <div className="flex flex-col my-auto">
              <div className="font-bold text-lg">{album.name}</div>
              <div>{renderArtistList(album.artists)}</div>
              <div className="text-sm text-text-secondary font-thin">{renderDateString(album.release_date)}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default SpotifyAlbumSearchResults;
