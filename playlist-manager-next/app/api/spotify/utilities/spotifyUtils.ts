import { SimplifiedAlbum, SimplifiedArtist, SimplifiedTrack, SpotifyApi } from '@spotify/web-api-ts-sdk';
import prisma from '../../../../lib/prisma';
import getAllAlbumTracks from './spotify/getAllAlbumTracks';

// Create or update an artist in the database
export async function createOrUpdateArtist(artist: SimplifiedArtist) {
  const dbArtist = await prisma.artist.upsert({
    where: { id: artist.id },
    update: {
      // image_url: artist.images?.[0]?.url ?? null,
      name: artist.name,
      uri: artist.uri
    },
    create: {
      id: artist.id,
      // image_url: artist.images?.[0]?.url ?? null,
      name: artist.name,
      uri: artist.uri
    }
  });
  return dbArtist;
}

// Create a track if it doesn't exist, and link artists
export async function createTrackOrNone(track: SimplifiedTrack, album: SimplifiedAlbum) {
  const existingTrack = await prisma.track.findUnique({ where: { id: track.id } });
  if (existingTrack) return existingTrack;

  const dbTrack = await prisma.track.create({
    data: {
      id: track.id,
      name: track.name,
      album_id: album.id,
      disc_number: track.disc_number,
      track_number: track.track_number,
      duration_ms: track.duration_ms,
      uri: track.uri
    }
  });

  // Link artists to track
  for (const artist of track.artists) {
    const dbArtist = await createOrUpdateArtist(artist); // FIX THIS
    await prisma.trackartistrelationship.upsert({
      where: {
        track_id_artist_id: {
          track_id: dbTrack.id,
          artist_id: dbArtist.id
        }
      },
      update: {},
      create: {
        track_id: dbTrack.id,
        artist_id: dbArtist.id
      }
    });
  }
  return dbTrack;
}

// Create or get an album, link artists and genres, and create tracks
export async function getOrCreateAlbum(spotifySdk: SpotifyApi, album: SimplifiedAlbum, ignoreTracks = false) {
  let dbAlbum = await prisma.album.findUnique({ where: { id: album.id } });
  if (dbAlbum) return dbAlbum;

  dbAlbum = await prisma.album.create({
    data: {
      id: album.id,
      album_type: album.album_type,
      total_tracks: album.total_tracks,
      image_url: album.images?.[0]?.url ?? null,
      name: album.name,
      release_date: new Date(album.release_date),
      release_date_precision: album.release_date_precision,
      label: album.label,
      uri: album.uri
    }
  });

  // Link artists
  for (const artist of album.artists ?? []) {
    const dbArtist = await createOrUpdateArtist(artist);
    await prisma.albumartistrelationship.upsert({
      where: {
        album_id_artist_id: {
          album_id: dbAlbum.id,
          artist_id: dbArtist.id
        }
      },
      update: {},
      create: {
        album_id: dbAlbum.id,
        artist_id: dbArtist.id
      }
    });
  }

  // Link genres
  for (const genreName of album.genres ?? []) {
    const dbGenre = await prisma.genre.upsert({
      where: { name: genreName },
      update: {},
      create: { name: genreName }
    });
    await prisma.albumgenrerelationship.upsert({
      where: {
        album_id_genre_id: {
          album_id: dbAlbum.id,
          genre_id: dbGenre.id
        }
      },
      update: {},
      create: {
        album_id: dbAlbum.id,
        genre_id: dbGenre.id
      }
    });
  }

  // Create tracks
  if (!ignoreTracks) {
    const albumTracks = await getAllAlbumTracks(spotifySdk, album.id);
    for (const track of albumTracks) {
      await createTrackOrNone(track, album);
    }
  }

  return dbAlbum;
}
