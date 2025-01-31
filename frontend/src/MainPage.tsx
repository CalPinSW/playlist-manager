import React, { FC, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getRecentPlaylists, searchPlaylistsByAlbums } from "./api";
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
  const [playlistSearch, setPlaylistSearch] = useState<string>("")
  const [albumSearch, setAlbumSearch] = useState<string>("")
  const [pagination, ] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: isMobileView ? 8 : 8,
  });

  const playlistQuery = useQuery<Playlist[]>({
    queryKey: ["playlists", pagination, playlistSearch],
    queryFn: () => {
      return getRecentPlaylists(playlistSearch, pagination.pageIndex, pagination.pageSize);
    },
  });

  const albumQuery = useQuery<Playlist[]>({
    queryKey: ["albums", pagination, albumSearch],
    queryFn: () => {
      return searchPlaylistsByAlbums(albumSearch, pagination.pageIndex, pagination.pageSize);
    },
  });

  return (
    <div className="py-4 px-2 space-y-2">
      <Box className="space-y-2">
        <SearchBar search={playlistSearch} setSearch={setPlaylistSearch}/>
        <Carousel slides={
          (playlistQuery.data ?? 
          createUndefinedArray(pagination.pageSize)).map(
            (p, index) =><PlaylistSlide playlist={p} key={`playlistSearch ${index}`}/>
          )} 
        />  
      </Box>
      <Box className="space-y-2">
        <SearchBar search={albumSearch} setSearch={setAlbumSearch}/>
        <Carousel slides={
          (albumQuery.data ?? 
          createUndefinedArray(pagination.pageSize)).map(
            (p, index) => <PlaylistSlide playlist={p} key={`albumSearch ${index}`}/>
          )}
        />  
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