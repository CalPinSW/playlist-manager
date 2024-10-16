import React, { FC, useState } from "react";
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
  const [searchRecent, setSearchRecent] = useState<string>("")
  const [search, setSearch] = useState<string>("")
  const [pagination, ] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: isMobileView ? 8 : 8,
  });


  const recentQuery = useQuery<Playlist[]>({
    queryKey: ["playlists", pagination, search],
    queryFn: () => {
      return getRecentPlaylists(search, pagination.pageIndex, pagination.pageSize);
    },
  });

  return (
    <div className="py-4 px-2 space-y-2">
      <Box className="space-y-2">
        <SearchBar search={searchRecent} setSearch={setSearchRecent}/>
        <Carousel slides={(recentQuery.data ?? createUndefinedArray(pagination.pageSize)).map(PlaylistSlide)} />  
      </Box>
      <Box>
        <AddPlaylistForm />
      </Box>
    </div>
  );
};

const createUndefinedArray = (length: number): undefined[] =>{
  return Array.from({ length }, () => undefined);
}