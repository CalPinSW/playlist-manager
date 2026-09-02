import prisma from '../../../../lib/prisma';

// Upserts each genre by name and links it to the album via albumgenrerelationship.
// Shared by both the Spotify artist-genre sync and the MusicBrainz enrichment task
// so genre data from either source lands in the same place the genre-chip UI reads.
export async function linkAlbumGenres(albumId: string, genreNames: string[]): Promise<void> {
  for (const rawName of genreNames) {
    const name = rawName.trim().toLowerCase();
    if (!name) continue;

    const genre = await prisma.genre.upsert({
      where: { name },
      update: {},
      create: { name }
    });

    await prisma.albumgenrerelationship.upsert({
      where: {
        album_id_genre_id: {
          album_id: albumId,
          genre_id: genre.id
        }
      },
      update: {},
      create: {
        album_id: albumId,
        genre_id: genre.id
      }
    });
  }
}
