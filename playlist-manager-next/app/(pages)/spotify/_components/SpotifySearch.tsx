'use client';
import { FC, useState } from 'react';
import SearchBar from '../../components/SearchBar';
import { useQuery } from '@tanstack/react-query';
import { PartialSearchResult } from '@spotify/web-api-ts-sdk';
import SpotifyAlbumSearchResults from './SpotifyAlbumSearchResults';

const SpotifySearch: FC = () => {
  const [spotifySearch, setSpotifySearch] = useState('');
  const playlistQuery = useQuery({
    queryKey: ['spotify-albums', { search: spotifySearch }],
    queryFn: () => {
      if (spotifySearch === '') return null;
      return fetchSpotifyAlbums(spotifySearch);
    }
  });
  return (
    <div className="flex flex-col space-y-2 flex-grow h-full">
      <SearchBar title="Search by Playlists" search={spotifySearch} setSearch={setSpotifySearch} />
      {playlistQuery.data && (
        <div className="relative flex flex-1 grow">
          <SpotifyAlbumSearchResults albums={playlistQuery.data} />
        </div>
      )}
    </div>
  );
};

export const fetchSpotifyAlbums = async (
  search: string,
  pageIndex: number = 0,
  pageSize: number = 20
): Promise<Required<Pick<PartialSearchResult, 'albums'>>> => {
  const params = new URLSearchParams({
    offset: pageIndex.toString(),
    limit: pageSize.toString()
  });
  if (search != '') {
    params.append('search', search);
  }

  const fetchOptions: RequestInit = {};

  const response = await fetch(`/api/spotify/albums?${params.toString()}`, fetchOptions);
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  return response.json();
};

export default SpotifySearch;
