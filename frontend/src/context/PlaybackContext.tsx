import React, {
  FC,
  ReactElement,
  createContext,
  useEffect,
  useState,
} from "react";
import { PlaybackInfo, PlaylistProgress } from "../interfaces/PlaybackInfo";
import { useQuery } from "@tanstack/react-query";
import { getPlaybackInfo, getPlaylistProgress } from "../api";

interface PlaybackContext {
  playbackInfo?: PlaybackInfo;
  playlistProgress?: PlaylistProgress;
}

export const PlaybackContext = createContext<PlaybackContext>({});

interface PlaybackContextProviderProps {
  children: ReactElement;
}

export const PlaybackContextProvider: FC<PlaybackContextProviderProps> = ({
  children,
}) => {
  const [playbackRefetchInterval, setPlaybackRefetchInterval] = useState(5000);
  const { data: playbackInfo } = useQuery<PlaybackInfo>({
    queryKey: ["playbackInfo"],
    queryFn: () => {
      return getPlaybackInfo();
    },
    retryDelay: playbackRefetchInterval,
    refetchInterval: playbackRefetchInterval,
    refetchIntervalInBackground: false,
  });
  useEffect(() => {
    setPlaybackRefetchInterval(playbackInfo ? 5000 : 20000);
  }, [playbackInfo]);
  const { data: playlistProgress } = useQuery<PlaylistProgress | undefined>({
    queryKey: ["playlistProgress"],
    queryFn: () => {
      if (playbackInfo?.playlist_id) {
        return getPlaylistProgress(playbackInfo);
      }
    },
    retryDelay: playbackRefetchInterval,
    refetchInterval: 60000,
    refetchIntervalInBackground: false,
    enabled: !!playbackInfo?.playlist_id,
  });

  return (
    <PlaybackContext.Provider value={{ playbackInfo, playlistProgress }}>
      {children}
    </PlaybackContext.Provider>
  );
};
