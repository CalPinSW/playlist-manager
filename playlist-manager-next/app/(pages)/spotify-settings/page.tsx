import React from 'react';
import getSpotifySdk from '../../utils/getSpotifySdk';
import SpotifyConnectedSettings from './_components/SpotifyConnectedSettings';
import SpotifyUnconnectedSettings from './_components/SpotifyUnconnectedSettings';

export default async function Index() {
  const spotifySdk = await getSpotifySdk();
  const spotifyUser = await spotifySdk.currentUser.profile();

  return (
    <div className="flex flex-col items-center justify-center">
      {spotifyUser ? <SpotifyConnectedSettings user={spotifyUser} /> : <SpotifyUnconnectedSettings />}
    </div>
  );
}
