import type { artist_info } from '../../../../generated/prisma';
import prisma from '../../../../lib/prisma';
import { fetchMBArtist, searchMBArtistId } from '../../../utils/AlbumInfo/MusicBrainz/fetchMBArtist';
import {
  fetchWikipediaIntro,
  fetchWikipediaSummary,
  fetchWikipediaTitleForWikidataId,
  searchWikipediaArtistTitle
} from '../../../utils/AlbumInfo/Wikibase/fetchWikipediaData';
import { fetchLastFmArtistInfo } from '../../../utils/AlbumInfo/LastFm/fetchLastFmAlbumInfo';

// A bio that was found is left alone (only a forced refresh re-fetches it). One that
// wasn't is looked for again whenever one of the artist's albums is re-checked — but not
// more than once in this many days, so an artist with several albums isn't re-fetched for
// each of them.
export const ARTIST_BIO_RETRY_DAYS = 2;

const DAY_MS = 24 * 60 * 60 * 1000;

export function artistInfoIsFresh(info: Pick<artist_info, 'bio' | 'fetched_at'> | null, now = new Date()): boolean {
  if (!info) return false;
  if (info.bio) return true;
  return now.getTime() - info.fetched_at.getTime() < ARTIST_BIO_RETRY_DAYS * DAY_MS;
}

export interface ArtistEnrichmentResult {
  hasBio: boolean;
  /** A source couldn't be reached, so "no bio" may not be the real answer. */
  hadErrors: boolean;
}

/**
 * Finds a biography for one artist and caches it in artist_info: Wikipedia (via the
 * artist's MusicBrainz → Wikidata link, or failing that a validated Wikipedia search),
 * falling back to Last.fm. Skips the lookups entirely while the cached row is fresh
 * (unless `force`), so an artist with several albums in a backfill is only fetched once.
 *
 * `mbArtistIdHint` is the artist's MusicBrainz id when the caller already has it from the
 * album's release group — the most reliable way to identify same-named artists.
 */
export async function enrichArtistInfo(
  artist: { id: string; name: string },
  existing: artist_info | null,
  mbArtistIdHint?: string | null,
  force = false
): Promise<ArtistEnrichmentResult> {
  if (!force && artistInfoIsFresh(existing)) return { hasBio: !!existing?.bio, hadErrors: false };

  let hadErrors = false;
  const attempt = async <T>(label: string, lookup: () => Promise<T | null>): Promise<T | null> => {
    try {
      return await lookup();
    } catch (error) {
      hadErrors = true;
      console.error(`[enrichArtistInfo] ${label} failed for artist ${artist.id} (${artist.name})`, error);
      return null;
    }
  };

  const mbArtistId =
    mbArtistIdHint ??
    existing?.mb_artist_id ??
    (await attempt('MusicBrainz artist search', () => searchMBArtistId(artist.name)));

  let description: string | null = null;
  let wikipediaTitle: string | null = null;

  if (mbArtistId) {
    const mbArtist = await attempt('MusicBrainz artist lookup', () => fetchMBArtist(mbArtistId));
    description = mbArtist?.disambiguation || null;
    const wikidataUrl = mbArtist?.relations?.find(rel => rel.type === 'wikidata')?.url?.resource;
    if (wikidataUrl) {
      const wikidataId = wikidataUrl.replace(/^https?:\/\/www\.wikidata\.org\/wiki\//, '');
      wikipediaTitle = await attempt('Wikidata lookup', () => fetchWikipediaTitleForWikidataId(wikidataId));
    }
  }
  if (!wikipediaTitle) {
    wikipediaTitle = await attempt('Wikipedia search', () => searchWikipediaArtistTitle(artist.name));
  }

  let bio: string | null = null;
  let bioSource: string | null = null;
  let url: string | null = null;

  if (wikipediaTitle) {
    const title = wikipediaTitle;
    const summary = await attempt('Wikipedia summary', () => fetchWikipediaSummary(title));
    if (summary) {
      const intro = await attempt('Wikipedia intro', () => fetchWikipediaIntro(summary.title));
      bio = intro ?? summary.extract;
      bioSource = 'wikipedia';
      url = summary.url;
      description = summary.description ?? description;
    }
  }

  if (!bio) {
    const lastfm = await attempt('Last.fm lookup', () => fetchLastFmArtistInfo(artist.name));
    if (lastfm?.bio) {
      bio = lastfm.bio;
      bioSource = 'lastfm';
      url = lastfm.url;
    }
  }

  // A lookup that errored says nothing about whether a bio exists, so don't let it wipe
  // one that an earlier run found.
  if (!bio && hadErrors && existing?.bio) return { hasBio: true, hadErrors };

  const data = {
    mb_artist_id: mbArtistId ?? null,
    description: description ? description.slice(0, 500) : null,
    bio,
    bio_source: bioSource,
    url: url ? url.slice(0, 500) : null,
    fetched_at: new Date()
  };
  await prisma.artist_info.upsert({
    where: { artist_id: artist.id },
    update: data,
    create: { artist_id: artist.id, ...data }
  });

  return { hasBio: !!bio, hadErrors };
}
