import { useContext } from "react";
import { PlaybackContext } from "../context/PlaybackContext";

export const usePlaybackContext = () => {
    const playbackContext = useContext(PlaybackContext) 

    return playbackContext
};
