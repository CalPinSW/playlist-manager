'use client';

import React, { FC, ReactNode, createContext, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PlaybackInfo } from '../utils/interfaces/PlaybackInfo';

interface PlaybackContext {
  playbackInfo?: PlaybackInfo;
}

export const PlaybackContext = createContext<PlaybackContext>({});

interface PlaybackContextProviderProps {
  children: ReactNode;
}

const getPlaybackInfo = async (): Promise<PlaybackInfo> => {
  const response = await fetch(`/api/spotify/playback/current`);
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  return response.json();
};

export const PlaybackContextProvider: FC<PlaybackContextProviderProps> = ({ children }) => {
  const [playbackRefetchInterval, setPlaybackRefetchInterval] = useState(10000);
  const { data: playbackInfo, isError } = useQuery<PlaybackInfo>({
    queryKey: ['playbackInfo'],
    queryFn: getPlaybackInfo,
    refetchInterval: playbackRefetchInterval,
    refetchIntervalInBackground: false
  });
  useEffect(() => {
    if (isError) {
      setPlaybackRefetchInterval(30000);
    }
  }, [isError]);

  return <PlaybackContext.Provider value={{ playbackInfo }}>{children}</PlaybackContext.Provider>;
};
