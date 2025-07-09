import React from 'react';
import TrackList from '../_components/SpotifyTrackList';
import getSpotifySdk from '../../../../utils/getSpotifySdk';
import { Album, SpotifyApi } from '@spotify/web-api-ts-sdk';
import AlbumHeader from '../../../album/_components/AlbumHeader';
import AlbumInfo from '../../../album/_components/AlbumInfo';
import { getAlbumInfo } from '../../../../utils/AlbumInfo/getAlbumInfo';

export default async function Page({ params }: { params: Promise<{ albumId: string }> }) {
  const { albumId } = await params;
  const spotifySdk = await getSpotifySdk();
  const album = await getSpotifyAlbumWithTracks(spotifySdk, albumId);
  const albumInfo = await getAlbumInfo(
    album.name,
    album.artists.map(artist => ({ name: artist.name, spotifyId: artist.id })),
    album.images[0].url
  );

  return (
    <div className="flex flex-col text-sm sm:text-base h-full flex-1 m-4 sm:m-24">
      <div className="flex flex-col space-y-4 h-full flex-1 grow">
        <AlbumHeader albumInfo={albumInfo} />
        <AlbumInfo albumInfo={albumInfo} />
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
