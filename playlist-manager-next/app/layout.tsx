import './globals.css';
import NavBar from '../components/layout/NavBar';
import Footer from '../components/layout/PlaybackFooter';
import React from 'react';
import type { Metadata } from 'next';
import Providers from './providers';

export const metadata: Metadata = {
  title: 'Playlist Manager',
  description: 'Service to manage your playlists'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <Providers>
          <main id="app" className="flex flex-col flex-1 min-h-screen max-h-screen" data-testid="layout">
            <div className="transition-height duration-400 ease-out">
              <NavBar />
            </div>
            <div className="flex-1 min-h-0 overflow-auto">{children}</div>
            <div className="flex">
              <Footer />
            </div>
          </main>
        </Providers>
      </body>
    </html>
  );
}
