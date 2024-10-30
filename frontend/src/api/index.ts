import { Album } from "../interfaces/Album";
import { PlaybackInfo } from "../interfaces/PlaybackInfo";
import { Playlist } from "../interfaces/Playlist";
import { Track } from "../interfaces/Track";
import { User } from "../interfaces/User";
import { backendUrl, request } from "./jsonRequest";
import { RequestMethod } from "./jsonRequest";
import { jsonRequest } from "./jsonRequest";

export const openInNewTab = (url: string) => {
	const newWindow = window.open(url, "_self", "noopener,noreferrer");
	if (newWindow) newWindow.opener = null;
};

export const login = async (): Promise<void> => {
	return fetch(`${backendUrl}/auth/login`, {
		credentials: "include",
	}).then(async response => {
		const redirectUrl = await response.text();
		openInNewTab(redirectUrl);
	});
};

export const logout = async (): Promise<void> => {
	return fetch(`${backendUrl}/auth/logout`, {
		credentials: "include",
	}).then(async response => {
		const redirectUrl = await response.text();
		console.log(redirectUrl)
		window.open("/", "_self");
	});
}

export const getCurrentUserDetails = async (): Promise<User> => {
	return jsonRequest(
		`spotify/current-user`,
		RequestMethod.GET,
		undefined,
		false,
	);
};

export const getRecentPlaylists = async (
	search: string,
	offset: number,
	limit: number,
): Promise<Playlist[]> => {
	const searchParams = new URLSearchParams();
	searchParams.append("limit", String(limit));
	searchParams.append("offset", String(offset));
	if (search !== "") {searchParams.append("search", search);}
	searchParams.toString(); // "type=all&query=coins"
	const endpoint = `music/playlists/recent?${searchParams.toString()}`;
	return jsonRequest(endpoint, RequestMethod.GET);
};

export const getPlaylists = async (
	search: string,
	offset: number,
	limit: number,
): Promise<Playlist[]> => {
	const searchParams = new URLSearchParams();
	searchParams.append("limit", String(limit));
	searchParams.append("offset", String(offset));
	if (search !== "") {searchParams.append("search", search);}
	searchParams.toString(); // "type=all&query=coins"
	const endpoint = `music/playlists?${searchParams.toString()}`;
	return jsonRequest(endpoint, RequestMethod.GET);
};

export const addPlaylist = async (playlist: Playlist): Promise<Playlist> => {
	return jsonRequest("spotify/create-playlist", RequestMethod.POST, playlist);
};

export const getPlaylist = async (id: string): Promise<Playlist> => {
	return jsonRequest(`music/playlist/${id}`, RequestMethod.GET);
};

export const updatePlaylist = async (playlist: Playlist): Promise<Playlist> => {
	return jsonRequest(
		`music/playlist/${playlist.id}`,
		RequestMethod.POST,
		playlist,
	);
};

export const deletePlaylist = async (playlist: Playlist): Promise<Response> => {
	return jsonRequest(
		`spotify/delete-playlist/${playlist.id}`,
		RequestMethod.POST,
	);
};

export const getPlaylistAlbums = async (
	playlistId: string,
): Promise<Album[]> => {
	return jsonRequest(
		`music/playlist/${playlistId}/albums`,
		RequestMethod.GET,
	);
};


export const getPlaylistTracks = async (
	playlistId: string,
): Promise<Track[]> => {
	return jsonRequest(
		`music/playlist/${playlistId}/tracks`,
		RequestMethod.GET,
	);
};

export const getPlaybackInfo = async (): Promise<PlaybackInfo> => {
	return jsonRequest(`music/playback`, RequestMethod.GET, undefined, false);
};

export const playlistSearch = async (
	search: string,
): Promise<Playlist[]> => {
	return jsonRequest(
		`music/playlist/search`,
		RequestMethod.POST,
		search,
	);
};

export const addAlbumToPlaylist = async (
	playlistId: string,
	albumId: string,
): Promise<Response> => {
	return jsonRequest(`spotify/add_album_to_playlist`, RequestMethod.POST, {
		playlistId,
		albumId,
	});
};

export const pausePlayback = async (): Promise<Response> => {
	return jsonRequest(`spotify/pause_playback`, RequestMethod.PUT);
};

interface StartPlaybackRequest {
	context_uri?: string, 
	uris?: string[], 
	offset?: {position: number} | {uri: string} | {album_id: string}, 
	position_ms?: number
}

export const startPlayback = async (requestBody?: StartPlaybackRequest
): Promise<Response> => {
	return jsonRequest(`spotify/start_playback`, RequestMethod.PUT, requestBody);
};

export const pauseOrStartPlayback = async (): Promise<Response> => {
	return jsonRequest(`spotify/pause_or_start_playback`, RequestMethod.PUT);
};

export const populateUserData = async (): Promise<Response> => {
	return request(`database/populate_user`, RequestMethod.GET);
}

export const populateAdditionalAlbumDetails = async (): Promise<Response> => {
	return request('database/populate_additional_album_details', RequestMethod.GET)
}

export const populatePlaylist = async (id: string): Promise<Response> => {
	return request(`database/populate_playlist/${id}`, RequestMethod.GET)
}

export const populateUniversalGenreList = async (): Promise<Response> => {
	return request('database/populate_universal_genre_list', RequestMethod.GET)
}

export const populateUserAlbumGenres = async (): Promise<Response> => {
	return request('database/populate_user_album_genres', RequestMethod.GET)
}
