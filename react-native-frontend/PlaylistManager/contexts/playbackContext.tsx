import React, {
  createContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useQuery } from "@tanstack/react-query";
import { getPlaybackInfo } from "../api";
import { PlaybackInfo } from "../interfaces/PlaybackInfo";
import { useAuth } from "./authContext";

interface PlaybackContextProps {
  playbackInfo?: PlaybackInfo;
  reloadData?: () => Promise<void>;
}

export const PlaybackContext = createContext<PlaybackContextProps>({});

interface PlaybackContextProviderProps {
  children: ReactNode;
}

export const PlaybackContextProvider: React.FC<PlaybackContextProviderProps> = ({
  children,
}) => {
  const [playbackRefetchInterval, setPlaybackRefetchInterval] = useState(10000);
  const {authorizedRequest, isAuthenticated} = useAuth()
  const { data: playbackInfo, isError, refetch } = useQuery<PlaybackInfo>({
    queryKey: ["playbackInfo"],
    queryFn: () => {
      return authorizedRequest(getPlaybackInfo())},
    enabled: isAuthenticated,
    retryDelay: playbackRefetchInterval,
    refetchInterval: playbackRefetchInterval,
    refetchIntervalInBackground: false,
  });

  const reloadData = async (): Promise<void> => {
    await refetch()
  }

  useEffect(() => {
    if (isError) {
      setPlaybackRefetchInterval(30000);
    }
  }, [isError]);

  return (
    <PlaybackContext.Provider value={{ playbackInfo, reloadData }}>
      {children}
    </PlaybackContext.Provider>
  );
};
