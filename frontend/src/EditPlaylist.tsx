import React, { FC } from "react";
import { useQuery } from "@tanstack/react-query";
import { getPlaylists } from "./api";
import { Playlist } from "./interfaces/Playlist";
import Header from "./presentational/Header";

export const EditPlaylist: FC = () => {
  const { isLoading, error, data } = useQuery<Playlist[]>({
    queryKey: ["playlists"],
    queryFn: () => {
      return getPlaylists();
    },
  });
  if (isLoading || !data) return "Loading...";

  if (error) return "An error has occurred: " + error.message;

  return (
    <div>
      <Header />
      Test
    </div>
  );
};
