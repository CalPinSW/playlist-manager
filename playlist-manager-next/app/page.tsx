import React from 'react';
import { PlaylistSearch } from './pages/index/PlaylistSearch';

export default function Index() {
  return (
    <div className="py-4 px-2 space-y-2">
      <div className="text-5xl m-3 p-4">Playlist Manager</div>
      <PlaylistSearch />

      <hr className="my-2 h-px w-4/5 mx-auto" />
    </div>
  );
}
