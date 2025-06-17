import React from 'react';
import { PlaylistSearch } from './PlaylistSearch';
import { AlbumAndArtistSearch } from './AlbumSearch';
import { auth0 } from '../../../lib/auth0';
import { redirect } from 'next/navigation';

export default async function Index() {
  const session = await auth0.getSession();
  if (!session) {
    redirect('/login');
  }
  return (
    <div className="flex flex-col p-2 gap-4">
      <div className="text-4xl m-3 text-center">Playlist Manager</div>
      <div className="flex flex-col gap-8">
        <PlaylistSearch />
        <AlbumAndArtistSearch />
      </div>
    </div>
  );
}
