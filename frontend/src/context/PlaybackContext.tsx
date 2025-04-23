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
import { useAuthorizedRequest } from "../hooks/useAuthorizedRequest";

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
  const authorizedRequest = useAuthorizedRequest()
  const [playbackRefetchInterval, setPlaybackRefetchInterval] = useState(10000);
  const { data: playbackInfo, isError } = useQuery<PlaybackInfo>({
    queryKey: ["playbackInfo"],
    queryFn: async () => {
      return authorizedRequest(getPlaybackInfo());
    },
    refetchInterval: playbackRefetchInterval,
    refetchIntervalInBackground: false,
  });
  useEffect(() => {
    if (isError) {setPlaybackRefetchInterval(30000)}
  }, [isError]);

  return (
    <PlaybackContext.Provider value={{ playbackInfo }}>
      {children}
    </PlaybackContext.Provider>
  );
};
