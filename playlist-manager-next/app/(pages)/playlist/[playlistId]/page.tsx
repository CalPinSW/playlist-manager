import React from 'react';
import prisma from '../../../../lib/prisma';
import Link from 'next/link';
import Carousel from '../../../../components/carousel/Carousel';
import AlbumSlide from '../../../../components/carousel/AlbumSlide';

export default async function Page({ params }: { params: { playlistId: string } }) {
  const { playlistId } = await params;
  const playlist = await prisma.playlist.findUnique({ where: { id: playlistId } });
  const playlistAlbums = await getPlaylistAlbumsWithGenres(playlistId);

  return (
    <div className="p-2 text-sm sm:text-base space-y-4">
      <div className="flex flex-col my-4 space-y-2">
        <input placeholder={'Title'} defaultValue={playlist.name} />
        <input placeholder={'Description'} defaultValue={playlist.description} />
      </div>
      <Carousel
        slides={playlistAlbums.map((a, index) => (
          <AlbumSlide album={a} key={`playlistSearch ${index}`} />
        ))}
      />
      <div className="flex flex-row space-x-4 justify-end sm:justify-start mx-2">
        <button className="flex" type="submit">
          Update details
        </button>
        <div className="flex my-auto">
          <Link href={`/`}>Back</Link>
        </div>
      </div>
    </div>
  );
}

async function getPlaylistAlbumsWithGenres(playlist_id: string) {
  // Fetch albums for the playlist, ordered by album_index, with genres, artists, and notes
  const playlistAlbums = await prisma.playlistalbumrelationship.findMany({
    where: { playlist_id },
    orderBy: { album_index: 'asc' },
    include: {
      album: {
        select: {
          id: true,
          name: true,
          image_url: true,
          uri: true,
          album_type: true,
          total_tracks: true,
          release_date: true,
          release_date_precision: true,
          label: true,
          albumgenrerelationship: {
            include: { genre: { select: { name: true } } }
          },
          albumartistrelationship: {
            include: { artist: { select: { name: true } } }
          },
          album_notes: {
            select: { text: true }
          }
        }
      }
    }
  });

  // Transform to match the Python output structure
  return playlistAlbums.map(rel => {
    const album = rel.album;
    return {
      ...album,
      genres: album.albumgenrerelationship.map(g => g.genre.name),
      artists: album.albumartistrelationship.map(a => ({ name: a.artist.name })),
      notes: album.album_notes.map(n => n.text)
    };
  });
}

async function getPlaylistTracks(playlist_id: string) {
  // Find all tracks for the playlist, ordered by album_index, disc_number, track_number
  const playlistAlbums = await prisma.playlistalbumrelationship.findMany({
    where: { playlist_id },
    orderBy: { album_index: 'asc' },
    include: {
      album: {
        select: {
          id: true,
          name: true,
          track: {
            orderBy: [{ disc_number: 'asc' }, { track_number: 'asc' }],
            include: {
              trackartistrelationship: {
                include: { artist: { select: { name: true } } }
              }
            }
          }
        }
      }
    }
  });

  // Flatten tracks from all albums, preserving album_index order
  const result: Array<any> = [];
  for (const rel of playlistAlbums) {
    const album = rel.album;
    for (const track of album.track) {
      result.push({
        id: track.id,
        name: track.name,
        album: { name: album.name },
        artists: track.trackartistrelationship.map(rel => ({ name: rel.artist.name }))
      });
    }
  }
  return result;
}
