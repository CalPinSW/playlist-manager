'use client';

import { queryOptions, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { playlist } from '../../generated/prisma';
import Carousel from '../../components/carousel/Carousel';
import PlaylistSlide from '../../components/carousel/PlaylistSlide';
import SearchBar from '../../components/SearchBar';
import { PaginationState } from '../../utils/interfaces/PaginationState';

export const PlaylistSearch = () => {
  const [playlistSearch, setPlaylistSearch] = useState<string>('');
  const [pagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20
  });

  const playlistQuery = useQuery(playlistSearchQueryOptions(pagination, playlistSearch));

  const data = (playlistQuery.data as playlist[]) ?? [];
  return (
    <div className="flex flex-col gap-4">
      <SearchBar title="Search by Playlists" search={playlistSearch} setSearch={setPlaylistSearch} />
      <Carousel
        slides={data.map((p, index) => (
          <PlaylistSlide playlist={p} key={`playlistSearch ${index}`} />
        ))}
      />
    </div>
  );
};

export const playlistSearchQueryOptions = (pagination: PaginationState, playlistSearch: string) =>
  queryOptions({
    queryKey: ['playlists', { page: pagination, search: playlistSearch }],
    queryFn: () => fetchPlaylists(playlistSearch, pagination.pageIndex, pagination.pageSize)
  });

export const fetchPlaylists = async (search: string, pageIndex: number = 0, pageSize: number = 20) => {
  const params = new URLSearchParams({
    offset: pageIndex.toString(),
    limit: pageSize.toString()
  });
  if (search != '') {
    params.append('search', search);
  }

  const fetchOptions: RequestInit = {};

  const response = await fetch(`/api/playlists?${params.toString()}`, fetchOptions);
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  return response.json();
};
