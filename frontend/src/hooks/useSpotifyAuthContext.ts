import { useContext } from "react";
import { SpotifyAuthContext } from "../context/SpotifyAuthContext";

export const useSpotifyAuthContext = () => {
    const spotifyAuthContext = useContext(SpotifyAuthContext) 

    return spotifyAuthContext
};
