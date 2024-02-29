import React, { FC } from "react";
import { useQuery } from "@tanstack/react-query";
import { getPlaylists } from "./api";
import { Playlist } from "./interfaces/Playlist";
import PlaylistTable from "./playlistTable/PlaylistTable";
import Box from "./components/Box";
import AddPlaylistForm from "./AddPlaylistForm";

export const Index: FC = () => {
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
      <Box>
        <PlaylistTable playlists={data} />
      </Box>
      <AddPlaylistForm />
    </div>
  );
};
