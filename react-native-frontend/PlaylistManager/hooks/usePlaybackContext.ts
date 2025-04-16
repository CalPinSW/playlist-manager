import { useContext } from "react";
import { PlaybackContext } from "../contexts/playbackContext";

export const usePlaybackContext = () => {
    const playbackContext = useContext(PlaybackContext) 
    return playbackContext;
};
