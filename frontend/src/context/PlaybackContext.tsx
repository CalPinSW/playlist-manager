import React, {
  FC,
  ReactElement,
  createContext,
  useEffect,
  useState,
} from "react";
import { PlaybackInfo } from "../interfaces/PlaybackInfo";
import { useQuery } from "@tanstack/react-query";
import { getPlaybackInfo } from "../api";

interface PlaybackContext {
  playbackInfo?: PlaybackInfo;
}

export const PlaybackContext = createContext<PlaybackContext>({});

interface PlaybackContextProviderProps {
  children: ReactElement;
}

export const PlaybackContextProvider: FC<PlaybackContextProviderProps> = ({
  children,
}) => {
  const [playbackRefetchInterval, setPlaybackRefetchInterval] = useState(10000);
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
    setPlaybackRefetchInterval(playbackInfo ? 10000 : 20000);
  }, [playbackInfo]);

  return (
    <PlaybackContext.Provider value={{ playbackInfo }}>
      {children}
    </PlaybackContext.Provider>
  );
};
