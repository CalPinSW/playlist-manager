
import './globals.css';
import NavBar from '../components/layout/NavBar';
import Footer from '../components/layout/Footer';
import React from 'react';
import type { Metadata } from 'next'
import Providers from './providers';

export const metadata: Metadata = {
  title: 'Playlist Manager',
  description: 'Service to manage your playlists',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <main id="app" className="d-flex flex-column h-100" data-testid="layout">
            <NavBar />
            <div className="flex-grow-1 mt-5">{children}</div>
            <Footer />
          </main>
        </Providers>
      </body>
    </html>
  );
}
