import prisma from '../../../../lib/prisma';
import fetchMBReleaseGroup from '../../../utils/AlbumInfo/MusicBrainz/fetchMBReleaseGroup';
import { fetchWikipediaAlbumInfo } from '../../../utils/AlbumInfo/Wikibase/fetchWikipediaData';
import { linkAlbumGenres } from './linkAlbumGenres';

// If album_info is older than this, the info route re-triggers enrichment.
export const ALBUM_INFO_STALE_DAYS = 180;

// MusicBrainz tags are user-submitted folksonomy (can include noise like "2020s" or
// "usa" alongside real genres), so rank by tag count and keep only the strongest few.
const MAX_GENRES_FROM_MUSICBRAINZ = 5;

// Looks up an album on MusicBrainz + (via its Wikidata relation) Wikipedia, and persists
// whatever it finds: genres into the shared genre/albumgenrerelationship tables, and a
// summary into album_info. Each external call fails independently so one source being
// down doesn't discard data already fetched from the other.
export async function enrichAlbumInfo(albumId: string): Promise<void> {
  const album = await prisma.album.findUnique({
    where: { id: albumId },
    include: { albumartistrelationship: { include: { artist: true } } }
  });
  if (!album) return;

  const firstArtistName = album.albumartistrelationship[0]?.artist.name;
  if (!firstArtistName) return;

  let releaseGroup: Awaited<ReturnType<typeof fetchMBReleaseGroup>> = null;
  try {
    releaseGroup = await fetchMBReleaseGroup(album.name, firstArtistName);
  } catch (error) {
    console.error(`[enrichAlbumInfo] MusicBrainz lookup failed for album ${albumId}`, error);
  }

  let summary: string | null = null;
  let summaryHtml: string | null = null;
  let summarySource: string | null = null;

  if (releaseGroup) {
    const tags = [...(releaseGroup['tags'] ?? []), ...(releaseGroup['genres'] ?? [])];
    const genreNames = rankGenreTags(tags);
    if (genreNames.length > 0) {
      await linkAlbumGenres(albumId, genreNames);
    }

    const wikiRelation = releaseGroup['relations']?.find(rel => rel.type === 'wikidata');
    if (wikiRelation) {
      try {
        const wikidata = await fetchWikipediaAlbumInfo(
          wikiRelation.url.resource.replace('https://www.wikidata.org/wiki/', '')
        );
        if (wikidata) {
          summary = wikidata.extract;
          summaryHtml = wikidata.extract_html;
          summarySource = 'wikipedia';
        }
      } catch (error) {
        console.error(`[enrichAlbumInfo] Wikipedia lookup failed for album ${albumId}`, error);
      }
    }
  }

  // Always upsert (even with nothing found) so fetched_at gates retries — otherwise an
  // album with no MusicBrainz match would be re-looked-up on every single request.
  await prisma.album_info.upsert({
    where: { album_id: albumId },
    update: {
      mb_release_group_id: releaseGroup?.id ?? null,
      mb_type: releaseGroup?.['primary-type'] ?? null,
      summary,
      summary_html: summaryHtml,
      summary_source: summarySource,
      fetched_at: new Date()
    },
    create: {
      album_id: albumId,
      mb_release_group_id: releaseGroup?.id ?? null,
      mb_type: releaseGroup?.['primary-type'] ?? null,
      summary,
      summary_html: summaryHtml,
      summary_source: summarySource
    }
  });
}

function rankGenreTags(tags: { name: string; count: number }[]): string[] {
  const counts = new Map<string, number>();
  for (const tag of tags) {
    const name = tag?.name?.trim().toLowerCase();
    if (!name) continue;
    counts.set(name, (counts.get(name) ?? 0) + (tag.count ?? 0));
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_GENRES_FROM_MUSICBRAINZ)
    .map(([name]) => name);
}
