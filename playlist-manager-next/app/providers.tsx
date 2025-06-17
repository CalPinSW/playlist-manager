'use client';
import React, { ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Auth0Provider } from '@auth0/nextjs-auth0';
import { getQueryClient } from './utils/get-query-client';
import { PlaybackContextProvider } from './context/PlaybackContext';

export default function MyApp({ children }: { children: ReactNode }) {
  const queryClient = getQueryClient();

  return (
    <Auth0Provider>
      <QueryClientProvider client={queryClient}>
        <PlaybackContextProvider>{children}</PlaybackContextProvider>
        <ReactQueryDevtools />
      </QueryClientProvider>
    </Auth0Provider>
  );
}
