'use client';

import { queryOptions, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { album, artist, playlist } from '../../generated/prisma';
import Carousel from '../../components/carousel/Carousel';
import SearchBar from '../../components/SearchBar';
import { PaginationState } from '../../utils/interfaces/PaginationState';
import AlbumSlide from '../../components/carousel/AlbumSlide';

export interface AlbumWithPlaylists extends album {
  onPlaylists: playlist[];
  artists: artist[];
}

export const AlbumAndArtistSearch = () => {
  const [albumSearch, setAlbumSearch] = useState<string>('');
  const [pagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20
  });

  const playlistQuery = useQuery(albumSearchQueryOptions(pagination, albumSearch));

  const data = (playlistQuery.data as AlbumWithPlaylists[]) ?? [];
  return (
    <div className="flex flex-col gap-4">
      <SearchBar title="Album Search" search={albumSearch} setSearch={setAlbumSearch} />
      <Carousel
        slides={data.map((p, index) => (
          <AlbumSlide album={p} key={`albumSearch ${index}`} />
        ))}
      />
    </div>
  );
};

const fetchAlbums = async (search: string, pageIndex: number, pageSize: number) => {
  const params = new URLSearchParams({
    offset: pageIndex.toString(),
    limit: pageSize.toString()
  });
  if (search != '') {
    params.append('search', search);
  }

  const fetchOptions: RequestInit = {};

  const response = await fetch(`/api/albums?${params.toString()}`, fetchOptions);
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  return response.json();
};

export const albumSearchQueryOptions = (pagination: PaginationState, albumSearch: string) =>
  queryOptions({
    queryKey: ['albums', { page: pagination, search: albumSearch }],
    queryFn: () => fetchAlbums(albumSearch, pagination.pageIndex, pagination.pageSize)
  });
