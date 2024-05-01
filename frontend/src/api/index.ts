import { Album } from "../interfaces/Album";
import { PlaybackInfo, PlaylistProgress } from "../interfaces/PlaybackInfo";
import { Playlist } from "../interfaces/Playlist";
import { User } from "../interfaces/User";
import { backendUrl } from "./jsonRequest";
import { RequestMethod } from "./jsonRequest";
import { jsonRequest } from "./jsonRequest";

export const openInNewTab = (url: string) => {
  const newWindow = window.open(url, "_self", "noopener,noreferrer");
  if (newWindow) newWindow.opener = null;
};

export const login = async (): Promise<void> => {
  return fetch(`${backendUrl}/auth/login`, {
    credentials: "include",
  }).then(async (response) => {
    const redirectUrl = await response.text();
    openInNewTab(redirectUrl);
  });
};

export const getCurrentUserDetails = async (): Promise<User> => {
  return jsonRequest(`current-user`, RequestMethod.GET, undefined, false);
};

export const getPlaylists = async (
  offset: number,
  limit: number
): Promise<Playlist[]> => {
  const endpoint = `?limit=${encodeURIComponent(
    limit
  )}&offset=${encodeURIComponent(offset)}`;
  return jsonRequest(endpoint, RequestMethod.GET);
};

export const getPlaylist = async (id: string): Promise<Playlist> => {
  return jsonRequest(`edit-playlist/${id}`, RequestMethod.GET);
};

export const addPlaylist = async (playlist: Playlist): Promise<Playlist> => {
  return jsonRequest("create-playlist", RequestMethod.POST, playlist);
};

export const updatePlaylist = async (playlist: Playlist): Promise<Playlist> => {
  return jsonRequest(
    `edit-playlist/${playlist.id}`,
    RequestMethod.POST,
    playlist
  );
};

export const deletePlaylist = async (playlist: Playlist): Promise<Response> => {
  return jsonRequest(`edit-playlist/${playlist.id}`, RequestMethod.POST);
};

export const getPlaylistAlbums = async (
  playlistId: string
): Promise<Album[]> => {
  return jsonRequest(`playlist/${playlistId}/albums`, RequestMethod.GET);
};

export const getPlaybackInfo = async (): Promise<PlaybackInfo> => {
  return jsonRequest(`playback`, RequestMethod.GET, undefined, false);
};

export const getPlaylistProgress = async (
  playbackInfo: PlaybackInfo
): Promise<PlaylistProgress> => {
  return jsonRequest(`playlist_progress`, RequestMethod.POST, playbackInfo);
};

export const findAssociatedPlaylists = async (
  playlist: Playlist
): Promise<Playlist[]> => {
  return jsonRequest(`find_associated_playlists`, RequestMethod.POST, playlist);
};

export const addAlbumToPlaylist = async (
  playlistId: string,
  albumId: string
): Promise<Response> => {
  return jsonRequest(`add_album_to_playlist`, RequestMethod.POST, {
    playlistId,
    albumId,
  });
};
