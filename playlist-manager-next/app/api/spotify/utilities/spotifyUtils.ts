import { SimplifiedAlbum, SimplifiedArtist, SimplifiedTrack, SpotifyApi } from '@spotify/web-api-ts-sdk';
import prisma from '../../../../lib/prisma';
import getAllAlbumTracks from './spotify/getAllAlbumTracks';
import { linkAlbumGenres } from '../../albums/utilities/linkAlbumGenres';

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

// Spotify's SimplifiedAlbum.genres is deprecated and effectively always empty, so genres
// come from the full Artist objects instead (Spotify still populates Artist.genres).
// Bounded to the problem case: run for every newly-discovered album, and as a one-time
// backfill for existing albums that have no genres linked yet — not on every sync, so
// this doesn't add a Spotify call per album on every playlist refresh.
async function linkArtistGenres(spotifySdk: SpotifyApi, albumId: string, artistIds: string[]) {
  if (artistIds.length === 0) return;
  try {
    // Spotify caps artists.get at 50 ids; an album's artist list never gets close to that.
    const artists = await spotifySdk.artists.get(artistIds.slice(0, 50));
    const genreNames = artists.flatMap(artist => artist.genres ?? []);
    if (genreNames.length > 0) {
      await linkAlbumGenres(albumId, genreNames);
    }
  } catch (error) {
    console.error(`[linkArtistGenres] Spotify artist genre fetch failed for album ${albumId}`, error);
  }
}

// Create or get an album, link artists and genres, and create tracks
export async function getOrCreateAlbum(spotifySdk: SpotifyApi, album: SimplifiedAlbum, ignoreTracks = false) {
  const existingAlbum = await prisma.album.findUnique({ where: { id: album.id } });
  if (existingAlbum) {
    const existingGenreCount = await prisma.albumgenrerelationship.count({ where: { album_id: existingAlbum.id } });
    if (existingGenreCount === 0) {
      await linkArtistGenres(
        spotifySdk,
        existingAlbum.id,
        (album.artists ?? []).map(artist => artist.id)
      );
    }
    return existingAlbum;
  }

  const dbAlbum = await prisma.album.create({
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
  const artistIds: string[] = [];
  for (const artist of album.artists ?? []) {
    const dbArtist = await createOrUpdateArtist(artist);
    artistIds.push(dbArtist.id);
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

  // Link genres: Spotify's (rarely populated) album-level genres, plus artist genres.
  await linkAlbumGenres(dbAlbum.id, album.genres ?? []);
  await linkArtistGenres(spotifySdk, dbAlbum.id, artistIds);

  // Create tracks
  if (!ignoreTracks) {
    const albumTracks = await getAllAlbumTracks(spotifySdk, album.id);
    for (const track of albumTracks) {
      await createTrackOrNone(track, album);
    }
  }

  return dbAlbum;
}
