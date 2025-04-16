import React, {
  createContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useQuery } from "@tanstack/react-query";
import { getPlaybackInfo } from "../api";
import { PlaybackInfo } from "../interfaces/PlaybackInfo";
import { useAuthorizedRequest } from "../hooks/useAuthorizedRequest";

interface PlaybackContextProps {
  playbackInfo?: PlaybackInfo;
}

export const PlaybackContext = createContext<PlaybackContextProps>({});

interface PlaybackContextProviderProps {
  children: ReactNode;
}

export const PlaybackContextProvider: React.FC<PlaybackContextProviderProps> = ({
  children,
}) => {
  const [playbackRefetchInterval, setPlaybackRefetchInterval] = useState(10000);
  const authorizedRequest = useAuthorizedRequest()
  const { data: playbackInfo, isError } = useQuery<PlaybackInfo>({
    queryKey: ["playbackInfo"],
    queryFn: () => authorizedRequest(getPlaybackInfo()),
    retryDelay: playbackRefetchInterval,
    refetchInterval: playbackRefetchInterval,
    refetchIntervalInBackground: false,
  });

  useEffect(() => {
    if (isError) {
      setPlaybackRefetchInterval(30000);
    }
  }, [isError]);

  return (
    <PlaybackContext.Provider value={{ playbackInfo }}>
      {children}
    </PlaybackContext.Provider>
  );
};
