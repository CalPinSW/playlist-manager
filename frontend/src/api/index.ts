import moment from "moment";
import { Playlist } from "../interfaces/Playlist";
import { ApiPlaylist } from "./ApiPlaylist";

export const getPlaylists = async (): Promise<Playlist[]> => {
  const response = await fetch("http://localhost:5000");
  const apiResponse = await response
    .json()
    .then((data: any) => data as ApiPlaylist[]);
  return apiResponse.map((apiPlaylist: ApiPlaylist) =>
    parsePlaylists(apiPlaylist)
  );
};

export const getPlaylist = async (id: string): Promise<Playlist> => {
  const response = await fetch(`http://localhost:5000/edit-playlist/${id}`);
  const apiResponse = await response
    .json()
    .then((data: any) => data as ApiPlaylist);
  return parsePlaylists(apiResponse);
};

const parsePlaylists = (apiResult: ApiPlaylist): Playlist => {
  return {
    ...apiResult,
    createdAt: moment(apiResult.created_at),
  };
};
