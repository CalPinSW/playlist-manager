import React from 'react';
import { PlaylistSearch } from './(pages)/index/PlaylistSearch';
import { AlbumAndArtistSearch } from './(pages)/index/AlbumSearch';

export default function Index() {
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
