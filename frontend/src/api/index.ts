import { Playlist } from "../interfaces/Playlist";

export const getPlaylists = async (): Promise<Playlist[]> => {
  const response = await fetch("http://localhost:5000");
  const apiResponse = await response
    .json()
    .then((data: any) => data as Playlist[]);
  return apiResponse.map((apiPlaylist: Playlist) =>
    parsePlaylists(apiPlaylist)
  );
};

export const getPlaylist = async (id: string): Promise<Playlist> => {
  const response = await fetch(`http://localhost:5000/edit-playlist/${id}`);
  const apiResponse = await response
    .json()
    .then((data: any) => data as Playlist);
  return parsePlaylists(apiResponse);
};

export const updatePlaylist = async (playlist: Playlist): Promise<Playlist> => {
  const response = await fetch(
    `http://localhost:5000/edit-playlist/${playlist.id}`,
    {
      method: "post",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(playlist),
    }
  );
  const apiResponse = await response
    .json()
    .then((data: any) => data as Playlist);
  return parsePlaylists(apiResponse);
};

const parsePlaylists = (apiResult: Playlist): Playlist => {
  return {
    ...apiResult,
  };
};
