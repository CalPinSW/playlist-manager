import { useContext } from "react";
import { SpotifyAuthContext } from "../context/SpotifyAuthcontext";

export const useSpotifyAuthContext = () => {
    const spotifyAuthContext = useContext(SpotifyAuthContext) 

    return spotifyAuthContext
};
