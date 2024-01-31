import React, { FC } from "react";
import { useQuery } from "@tanstack/react-query";

export const Index: FC = () => {
  const { isLoading, error, data } = useQuery<Playlist[]>({
    queryKey: ["playlists"],
    queryFn: () => {
      return fetch("http://localhost:5000").then((res) => res.json());
    },
  });

  if (isLoading || !data) return "Loading...";

  if (error) return "An error has occurred: " + error.message;

  return (
    <div>
      {data.map((playlist) => {
        return (
          <div>
            <h1>{playlist.title}</h1>
            <p>{playlist.description}</p>
            <strong>👀 {playlist.createdAt}</strong>
          </div>
        );
      })}
    </div>
  );
};
