import { jsonRequest, RequestMethod } from "./jsonRequest";

export const login = async (): Promise<Response> => {
    const searchParams = new URLSearchParams();
    const state = "something"
    searchParams.append("audience", "https://playmanbackend.com");
    searchParams.append("scope", "read:profile");
    searchParams.append("response_type", "code");
    searchParams.append("client_id", "vlvk6JVXllIpfJEElGtEZnjmfG5NvVo3");
    // searchParams.append("redirect_uri", "undefined");
    searchParams.append("state", state);
    return fetch(`https://dev-3tozp8qy1u0rfxfm.us.auth0.com/authorize?${searchParams.toString()}`, {
        credentials: "include",
            
    })
};

interface SpotifyStatusResponse {
    spotifyLinked: boolean
}

export const getSpotifyStatus = () => async (accessToken: string): Promise<SpotifyStatusResponse> =>  {
    return jsonRequest('auth/spotify/user-status', RequestMethod.GET, {}, {
        Authorization: `Bearer ${accessToken}`,
    })
}
