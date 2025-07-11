import React from 'react';
import prisma from '../../../../lib/prisma';
import { album, artist, track } from '../../../../generated/prisma';
import AlbumHeader from '../_components/AlbumHeader';
import TrackList from '../_components/TrackList';
import AlbumInfo from '../_components/AlbumInfo';
import { redirect } from 'next/navigation';
import { getAlbumInfo } from '../../../utils/AlbumInfo/getAlbumInfo';

export default async function Page({ params }: { params: Promise<{ albumId: string }> }) {
  const { albumId } = await params;
  const album = await getAlbumWithTracks(albumId);
  if (!album) {
    redirect(`/spotify/album/${albumId}`);
  }
  const albumInfo = await getAlbumInfo(
    album.name,
    album.artists.map(artist => ({ name: artist.name, spotifyId: artist.id })),
    album.image_url
  );
  return (
    <div className="flex flex-col text-sm sm:text-base h-full flex-1 m-4 sm:m-24">
      <div className="flex flex-col space-y-4 h-full flex-1 grow">
        <AlbumHeader albumInfo={albumInfo} />
        <AlbumInfo albumInfo={albumInfo} />
        <div></div>
        <div className="flex-end">
          <TrackList album={album} />
        </div>
      </div>
    </div>
  );
}

export interface TrackWithArtists extends track {
  artists: artist[];
}

export interface AlbumWithTracks extends album {
  artists: artist[];
  tracks: TrackWithArtists[];
}

const getAlbumWithTracks = async (albumId: string): Promise<AlbumWithTracks> => {
  const album = await prisma.album.findUnique({
    where: { id: albumId },
    include: {
      tracks: {
        include: {
          trackartistrelationship: {
            include: { artist: true }
          }
        },
        orderBy: [{ disc_number: 'asc' }, { track_number: 'asc' }]
      },
      albumartistrelationship: {
        include: { artist: true }
      }
    }
  });

  if (!album) return null;

  return {
    ...album,
    artists: album.albumartistrelationship.map(aar => aar.artist),
    tracks: album.tracks.map(track => ({ ...track, artists: track.trackartistrelationship.map(tar => tar.artist) }))
  };
};
