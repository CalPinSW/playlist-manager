import { queryOptions } from "@tanstack/react-query";

export interface PaginationState {
  pageIndex: number;
  pageSize: number;
}

const fetchPlaylists = async (search: string, pageIndex: number, pageSize: number) => {
    console.log("HERE")
    const params = new URLSearchParams({
        search,
        offset: pageIndex.toString(),
        limit: pageSize.toString(),
    });

    const fetchOptions: RequestInit = {};

    const response = await fetch(`/api/playlists?${params.toString()}`, fetchOptions);
    if (!response.ok) {
        throw new Error('Network response was not ok');
    }
    const foo = await response.json();
    console.log(foo)
    return foo
}

export const playlistSearchQueryOptions = (pagination: PaginationState, playlistSearch: string ) => queryOptions({
    queryKey: ["playlists", {page: pagination, search: playlistSearch}],
    queryFn: () => fetchPlaylists(playlistSearch, pagination.pageIndex, pagination.pageSize),
  },
)