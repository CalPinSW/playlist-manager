import './globals.css';
import React from 'react';
import type { Metadata } from 'next';
import Providers from './providers';
import { ToastContainer } from 'react-toastify';
import NavBar from './(pages)/components/layout/NavBar';
import PlaybackFooter from './(pages)/components/layout/PlaybackFooter';

export const metadata: Metadata = {
  title: 'Playlist Manager',
  description: 'Service to manage your playlists'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Barlow:300,400,500,700&display=swap" />
      </head>
      <body className="min-h-screen flex flex-col">
        <Providers>
          <main id="app" className="flex flex-col flex-1 min-h-screen max-h-screen" data-testid="layout">
            <div className="transition-height duration-400 ease-out">
              <NavBar />
            </div>
            <div className="flex-1 min-h-0 overflow-auto">{children}</div>
            <div className="flex">
              <PlaybackFooter />
            </div>
            <ToastContainer />
          </main>
        </Providers>
      </body>
    </html>
  );
}
