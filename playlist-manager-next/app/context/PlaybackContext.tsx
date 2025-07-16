'use client';

import React, { FC, ReactNode, createContext, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PlaybackInfo } from '../utils/interfaces/PlaybackInfo';
import { PlaybackOffset, StartPlaybackRequest } from '../utils/interfaces/PlaybackRequest';

interface PlaybackContext {
  playbackInfo?: PlaybackInfo;
  handlePausePlay?: () => Promise<void>;
  handlePlayAlbum?: (offset: PlaybackOffset, contextUri?: string) => Promise<void>;
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
  const {
    data: playbackInfo,
    isError,
    refetch
  } = useQuery<PlaybackInfo>({
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

  const handlePausePlay = async (): Promise<void> => {
    if (playbackInfo.is_playing) {
      await fetch('/api/spotify/playback/pause');
    } else {
      await fetch('/api/spotify/playback/start', { method: 'POST', body: JSON.stringify({ resume: 'true' }) });
    }
    setTimeout(async () => await refetch(), 500);
  };

  const handlePlayAlbum = async (offset: PlaybackOffset, contextUri?: string) => {
    const startPlaybackRequest: StartPlaybackRequest = {
      context_uri: contextUri,
      offset: offset
    };
    await fetch('/api/spotify/playback/start', { method: 'POST', body: JSON.stringify(startPlaybackRequest) });
    setTimeout(async () => await refetch(), 500);
  };

  return (
    <PlaybackContext.Provider value={{ playbackInfo, handlePausePlay, handlePlayAlbum }}>
      {children}
    </PlaybackContext.Provider>
  );
};
