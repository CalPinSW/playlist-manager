'use client';
import React, { FC } from 'react';

const SpotifyUnconnectedSettings: FC = () => {
  const linkToSpotifyHandler = () => {
    window.open('/api/spotify/authorize', '_self');
  };
  return (
    <div className="flex flex-col items-center justify-center">
      <div className="text-5xl m-3 p-4">Link User to Spotify</div>
      <button className="m-3 p-4 bg-primary rounded-sm cursor-pointer" onClick={linkToSpotifyHandler}>
        Click to Connect
      </button>
    </div>
  );
};

export default SpotifyUnconnectedSettings;
