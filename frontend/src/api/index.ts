import { PlaybackInfo, PlaylistProgress } from "../interfaces/PlaybackInfo";
import { Playlist } from "../interfaces/Playlist";

export const getPlaylists = async (
  offset: number,
  limit: number
): Promise<Playlist[]> => {
  const response = await fetch(
    `http://localhost:5000/?limit=${encodeURIComponent(
      limit
    )}&offset=${encodeURIComponent(offset)}`
  );
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

export const addPlaylist = async (playlist: Playlist): Promise<Playlist> => {
  const response = await fetch(`http://localhost:5000/create-playlist`, {
    method: "post",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(playlist),
  });
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

export const deletePlaylist = async (playlist: Playlist): Promise<Response> => {
  const response = await fetch(
    `http://localhost:5000/delete-playlist/${playlist.id}`,
    {
      method: "post",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  return response;
};

export const getPlaybackInfo = async (): Promise<any> => {
  const response = await fetch(`http://localhost:5000/playback`);
  const apiResponse = await response
    .json()
    .then((data: any) => data as PlaybackInfo);
  return apiResponse;
};

export const getPlaylistProgress = async (
  playbackInfo: PlaybackInfo
): Promise<any> => {
  const body = JSON.stringify(playbackInfo);
  const response = await fetch(`http://localhost:5000/playlist_progress`, {
    method: "post",
    headers: {
      "Content-Type": "application/json",
    },
    body,
  });
  const apiResponse = await response
    .json()
    .then((data: any) => data as PlaylistProgress);
  return apiResponse;
};

const parsePlaylists = (apiResult: Playlist): Playlist => {
  return {
    ...apiResult,
  };
};
