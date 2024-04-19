import { PlaybackInfo, PlaylistProgress } from "../interfaces/PlaybackInfo";
import { Playlist } from "../interfaces/Playlist";
import { User } from "../interfaces/User";

const backendUrl = `http://${process.env.HOST}:${process.env.BACKEND_PORT}`;

const openInNewTab = (url: string) => {
  const newWindow = window.open(url, "_self", "noopener,noreferrer");
  if (newWindow) newWindow.opener = null;
};

export const login = async (): Promise<void> => {
  return fetch(`${backendUrl}/auth/login`).then(async (response) => {
    const redirectUrl = await response.text();
    openInNewTab(redirectUrl);
  });
};

export const getCurrentUserDetails = async (): Promise<User> => {
  const response = await fetch(`${backendUrl}/current-user`, {
    credentials: "include",
  });
  const apiResponse = await response.json().then((data: any) => data as User);
  return apiResponse;
};

export const getPlaylists = async (
  offset: number,
  limit: number
): Promise<Playlist[]> => {
  const response = await fetch(
    `${backendUrl}/?limit=${encodeURIComponent(
      limit
    )}&offset=${encodeURIComponent(offset)}`,
    { credentials: "include" }
  );
  if (response.status === 401) {
    openInNewTab("login");
  }
  const apiResponse = await response
    .json()
    .then((data: any) => data as Playlist[]);
  return apiResponse.map((apiPlaylist: Playlist) =>
    parsePlaylists(apiPlaylist)
  );
};

export const getPlaylist = async (id: string): Promise<Playlist> => {
  const response = await fetch(`${backendUrl}/edit-playlist/${id}`, {
    credentials: "include",
  });
  const apiResponse = await response
    .json()
    .then((data: any) => data as Playlist);
  return parsePlaylists(apiResponse);
};

export const addPlaylist = async (playlist: Playlist): Promise<Playlist> => {
  const response = await fetch(`${backendUrl}/create-playlist`, {
    method: "post",
    credentials: "include",
    mode: "cors",
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
  const response = await fetch(`${backendUrl}/edit-playlist/${playlist.id}`, {
    method: "post",
    credentials: "include",
    mode: "cors",
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

export const deletePlaylist = async (playlist: Playlist): Promise<Response> => {
  const response = await fetch(`${backendUrl}/delete-playlist/${playlist.id}`, {
    method: "post",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });
  return response;
};

export const getPlaybackInfo = async (): Promise<any> => {
  const response = await fetch(`${backendUrl}/playback`, {
    credentials: "include",
  });
  const apiResponse = await response
    .json()
    .then((data: any) => data as PlaybackInfo);
  return apiResponse;
};

export const getPlaylistProgress = async (
  playbackInfo: PlaybackInfo
): Promise<any> => {
  const body = JSON.stringify(playbackInfo);
  const response = await fetch(`${backendUrl}/playlist_progress`, {
    method: "post",
    headers: {
      "Content-Type": "application/json",
    },
    body,
    credentials: "include",
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
