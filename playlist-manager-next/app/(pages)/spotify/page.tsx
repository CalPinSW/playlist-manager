import React from 'react';
import SpotifyTitle from './_components/SpotifyTitle';
import SpotifySearch from './_components/SpotifySearch';

export default async function Page() {
  return (
    <div className="flex flex-col p-2 text-sm sm:text-base h-full flex-1">
      <div className="flex flex-col space-y-4 h-full flex-1 grow">
        <SpotifyTitle />
        <SpotifySearch />
      </div>
    </div>
  );
}
