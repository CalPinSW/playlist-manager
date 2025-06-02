import { jsonRequest, RequestMethod } from "./jsonRequest";

interface SpotifyStatusResponse {
    spotifyLinked: boolean
}

export const getSpotifyStatus = () => async (accessToken: string): Promise<SpotifyStatusResponse> =>  {
    return jsonRequest('auth/spotify/user-status', RequestMethod.GET, {}, {
        Authorization: `Bearer ${accessToken}`,
    })
}
