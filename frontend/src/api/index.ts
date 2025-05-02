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

export const loginSpotify = async (): Promise<void> => {
	return fetch(`${backendUrl}/auth/spotify/login`, {
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

export const getCurrentUserDetails = () => async (accessToken?: string): Promise<User> => {
	const headers: HeadersInit = accessToken ? {Authorization: `Bearer ${accessToken}`} : {}
	return jsonRequest(
		`spotify/current-user`,
		RequestMethod.GET,
		undefined,
		headers,
		false,
	);
};

export const searchPlaylistsByAlbums = (
	search: string,
	offset: number,
	limit: number,
) => async (accessToken?: string): Promise<Playlist[]> => {
	const headers: HeadersInit = accessToken ? {Authorization: `Bearer ${accessToken}`} : {}
	const searchParams = new URLSearchParams();
	searchParams.append("limit", String(limit));
	searchParams.append("offset", String(offset));
	if (search !== "") {searchParams.append("search", search);}
	searchParams.toString(); 
	const endpoint = `music/playlist_album_search?${searchParams.toString()}`;
	return jsonRequest(endpoint, RequestMethod.GET, undefined, headers);
};

export const getRecentPlaylists = (
	search: string,
	offset: number,
	limit: number,
) => async (accessToken?: string): Promise<Playlist[]> =>  {
	const headers: HeadersInit = accessToken ? {Authorization: `Bearer ${accessToken}`} : {}
	const searchParams = new URLSearchParams();
	searchParams.append("limit", String(limit));
	searchParams.append("offset", String(offset));
	if (search !== "") {searchParams.append("search", search);}
	searchParams.toString();
	const endpoint = `music/playlists/recent?${searchParams.toString()}`;
	return jsonRequest(endpoint, RequestMethod.GET, undefined, headers);
};

export const addPlaylist = (playlist: Playlist) => async (accessToken?: string) : Promise<Playlist> => {
	const headers: HeadersInit = accessToken ? {Authorization: `Bearer ${accessToken}`} : {}
	return jsonRequest("spotify/create-playlist", RequestMethod.POST, playlist, headers);
};

export const getPlaylist = (id: string) => async (accessToken?: string): Promise<Playlist> => {
	const headers: HeadersInit = accessToken ? {Authorization: `Bearer ${accessToken}`} : {}
	return jsonRequest(`music/playlist/${id}`, RequestMethod.GET, undefined, headers);
};

export const updatePlaylist = (playlist: Playlist) => async (accessToken?: string): Promise<Playlist> => {
	const headers: HeadersInit = accessToken ? {Authorization: `Bearer ${accessToken}`} : {}
	return jsonRequest(
		`music/playlist/${playlist.id}`,
		RequestMethod.POST,
		playlist,
		headers
	);
};

export const deletePlaylist = (playlist: Playlist) =>  async (accessToken?: string): Promise<Response> => {
	const headers: HeadersInit = accessToken ? {Authorization: `Bearer ${accessToken}`} : {}
	return jsonRequest(
		`spotify/delete-playlist/${playlist.id}`,
		RequestMethod.POST,
		undefined,
		headers
	);
};

export const getPlaylistAlbums = (
	playlistId: string,
) =>  async (accessToken?: string): Promise<Album[]> => {
	const headers: HeadersInit = accessToken ? {Authorization: `Bearer ${accessToken}`} : {}
	return jsonRequest(
		`music/playlist/${playlistId}/albums`,
		RequestMethod.GET,
		undefined,
		headers
	);
};


export const getPlaylistTracks = (
	playlistId: string,
) =>  async (accessToken?: string): Promise<Track[]> => {
	const headers: HeadersInit = accessToken ? {Authorization: `Bearer ${accessToken}`} : {}
	return jsonRequest(
		`music/playlist/${playlistId}/tracks`,
		RequestMethod.GET,
		undefined,
		headers
	);
};

export const playlistSearch = (
	search: string,
) =>  async (accessToken?: string): Promise<Playlist[]> => {
	const headers: HeadersInit = accessToken ? {Authorization: `Bearer ${accessToken}`} : {}

	return jsonRequest(
		`music/playlist/search`,
		RequestMethod.POST,
		search,
		headers
	);
};

export const addAlbumToPlaylist = (
	playlistId: string,
	albumId: string,
) =>  async(accessToken?: string): Promise<Response> => {
	const headers: HeadersInit = accessToken ? {Authorization: `Bearer ${accessToken}`} : {}

	return jsonRequest(`spotify/add_album_to_playlist`, RequestMethod.POST, {
		playlistId,
		albumId,
	}, headers);
};


export const getPlaybackInfo = () => async (accessToken?: string): Promise<PlaybackInfo> => {
	const headers: HeadersInit = accessToken ? {Authorization: `Bearer ${accessToken}`} : {}
	return jsonRequest(`music/playback`, RequestMethod.GET, undefined, headers ,false);
};

export const pausePlayback = () =>  async (accessToken?: string): Promise<Response> => {
	const headers: HeadersInit = accessToken ? {Authorization: `Bearer ${accessToken}`} : {}

	return request(`spotify/playback/pause`, RequestMethod.PUT, undefined, headers);
};

interface StartPlaybackRequest {
	context_uri?: string, 
	uris?: string[], 
	offset?: {position: number} | {uri: string} | {album_id: string}, 
	position_ms?: number
}

interface ResumePlaybackRequest {
	id: string, 
	context_uri?: string,
}


export const startPlayback = (requestBody?: StartPlaybackRequest
) => async (accessToken?: string): Promise<Response> => {
	const headers: HeadersInit = accessToken ? {Authorization: `Bearer ${accessToken}`} : {}

	return request(`spotify/playback/start`, RequestMethod.PUT, requestBody, headers);
};

export const resumePlayback = (requestBody: ResumePlaybackRequest
) => async (accessToken?: string): Promise<Response> => {
	const headers: HeadersInit = accessToken ? {Authorization: `Bearer ${accessToken}`} : {}

	return request(`spotify/playback/resume`, RequestMethod.PUT, requestBody, headers);
};

export const pauseOrStartPlayback = () =>  async (accessToken?: string): Promise<Response> => {
	const headers: HeadersInit = accessToken ? {Authorization: `Bearer ${accessToken}`} : {}

	return request(`spotify/playback/pause_or_start`, RequestMethod.PUT, undefined, headers);
};

export const populateUserData = () =>  async (accessToken?: string): Promise<Response> => {
	const headers: HeadersInit = accessToken ? {Authorization: `Bearer ${accessToken}`} : {}

	return request(`database/populate_user`, RequestMethod.GET, undefined, headers);
}

export const populateAdditionalAlbumDetails = () =>  async (accessToken?: string): Promise<Response> => {
	const headers: HeadersInit = accessToken ? {Authorization: `Bearer ${accessToken}`} : {}
	return request('database/populate_additional_album_details', RequestMethod.GET, undefined, headers)
}

export const populatePlaylist = (id: string) =>  async (accessToken?: string): Promise<Response> => {
	const headers: HeadersInit = accessToken ? {Authorization: `Bearer ${accessToken}`} : {}
	return request(`database/populate_playlist/${id}`, RequestMethod.GET, undefined, headers)
}

export const populateUniversalGenreList = () =>  async (accessToken?: string): Promise<Response> => {
	const headers: HeadersInit = accessToken ? {Authorization: `Bearer ${accessToken}`} : {}
	return request('database/populate_universal_genre_list', RequestMethod.GET, undefined, headers)
}

export const populateUserAlbumGenres = () =>  async (accessToken?: string): Promise<Response> => {
	const headers: HeadersInit = accessToken ? {Authorization: `Bearer ${accessToken}`} : {}
	return request('database/populate_user_album_genres', RequestMethod.GET, undefined, headers)
}
