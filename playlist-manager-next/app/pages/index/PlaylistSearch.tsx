"use client"

import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { playlist } from "../../generated/prisma";
import Carousel from "../../../components/carousel/Carousel";
import PlaylistSlide from "../../../components/carousel/PlaylistSlide";
import SearchBar from "../../../components/SearchBar";
import { PaginationState, playlistSearchQueryOptions } from "./playlistSearchQueryOptions";


export const PlaylistSearch = () => {
const [playlistSearch, setPlaylistSearch] = useState<string>("")
  const [albumSearch, setAlbumSearch] = useState<string>("")
  const [pagination, ] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 8,
  });

  const playlistQuery = useSuspenseQuery(playlistSearchQueryOptions(pagination, playlistSearch));

  const data = playlistQuery.data as playlist[] ?? createUndefinedArray(pagination.pageSize);
  return ( 
      <div>
        <SearchBar search={playlistSearch} setSearch={setPlaylistSearch}/>
        <Carousel slides={
          data.map(
            (p, index) =><PlaylistSlide playlist={p} key={`playlistSearch ${index}`}/>
          )} 
        />  
      </div>
  );
}

const createUndefinedArray = (length: number): undefined[] =>{
  return Array.from({ length }, () => undefined);
}