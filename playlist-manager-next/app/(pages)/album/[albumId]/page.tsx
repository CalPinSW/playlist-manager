import React from 'react';
import prisma from '../../../../lib/prisma';
import { album, artist, track } from '../../../generated/prisma';
import AlbumHeader from '../_components/AlbumHeader';
import TrackList from '../_components/TrackList';
import AlbumInfo from '../_components/AlbumInfo';

export default async function Page({ params }: { params: Promise<{ albumId: string }> }) {
  const { albumId } = await params;
  const album = await getAlbumWithTracks(albumId);

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
  return {
    ...album,
    artists: album.albumartistrelationship.map(aar => aar.artist),
    tracks: album.tracks.map(track => ({ ...track, artists: track.trackartistrelationship.map(tar => tar.artist) }))
  };
};
