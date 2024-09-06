import React, { FC, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getPlaylists, getRecentPlaylists } from "./api";
import { Playlist } from "./interfaces/Playlist";
import Box from "./components/Box";
import AddPlaylistForm from "./AddPlaylistForm";
import useWindowSize from "./hooks/useWindowSize";
import SearchBar from "./components/SearchBar";
import Carousel from "./components/Carousel/Carousel";
import PlaylistSlide from "./components/Playlist/PlaylistSlide";

interface PaginationState {
  pageIndex: number;
  pageSize: number;
}

export const Index: FC = () => {
  const { isMobileView } = useWindowSize();
  const [search, setSearch] = useState<string>("")
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: isMobileView ? 5 : 8,
  });

  useEffect(() => {
    const previousIndex = pagination.pageSize * pagination.pageIndex;
    const pageSize = isMobileView ? 10 : 10;
    const newIndex = Math.floor(previousIndex / pageSize);

    setPagination({
      pageIndex: newIndex,
      pageSize: pageSize,
    });
  }, [isMobileView]);


  const recentQuery = useQuery<Playlist[]>({
    queryKey: ["playlists", pagination, search],
    queryFn: () => {
      return getRecentPlaylists(search, pagination.pageIndex, pagination.pageSize);
    },
  });

  const allQuery = useQuery<Playlist[]>({
    queryKey: ["playlists", pagination, search],
    queryFn: () => {
      return getPlaylists(search, pagination.pageIndex, pagination.pageSize);
    },
  });

  return (
    <div className="py-4 px-2 space-y-2">
      <Box className="space-y-2">
        <SearchBar search={search} setSearch={setSearch}/>
        {recentQuery.data && <Carousel slides={recentQuery.data.map(PlaylistSlide)} />}
      </Box>
      <Box>
      {allQuery.data && <Carousel slides={allQuery.data.map(PlaylistSlide)} />}
      </Box>
      <Box>
        <AddPlaylistForm />
      </Box>
    </div>
  );
};
