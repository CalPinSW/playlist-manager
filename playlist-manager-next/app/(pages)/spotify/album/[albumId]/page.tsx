import React from 'react';
import AlbumHeader from '../_components/SpotifyAlbumHeader';
import TrackList from '../_components/SpotifyTrackList';
import AlbumInfo from '../_components/SpotifyAlbumInfo';
import getSpotifySdk from '../../../../utils/getSpotifySdk';
import { Album, SpotifyApi } from '@spotify/web-api-ts-sdk';

export default async function Page({ params }: { params: Promise<{ albumId: string }> }) {
  const { albumId } = await params;
  const spotifySdk = await getSpotifySdk();
  const album = await getSpotifyAlbumWithTracks(spotifySdk, albumId);
  return (
    <div className="flex flex-col text-sm sm:text-base h-full flex-1 m-4 sm:m-24">
      <div className="flex flex-col space-y-4 h-full flex-1 grow">
        <AlbumHeader album={album} />
        <AlbumInfo album={album} />
        <div></div>
        <div className="flex-end">
          <TrackList album={album} />
        </div>
      </div>
    </div>
  );
}

const getSpotifyAlbumWithTracks = async (spotifySdk: SpotifyApi, albumId: string): Promise<Album> => {
  return spotifySdk.albums.get(albumId);
};
