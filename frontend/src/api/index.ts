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
const parsePlaylists = (apiResult: ApiPlaylist): Playlist => {
  return {
    ...apiResult,
    createdAt: moment(apiResult.created_at),
  };
};
