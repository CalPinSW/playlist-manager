import { Prisma } from '../../../../generated/prisma';
import prisma from '../../../../lib/prisma';
import fetchMBReleaseGroup from '../../../utils/AlbumInfo/MusicBrainz/fetchMBReleaseGroup';
import {
  fetchWikipediaIntro,
  fetchWikipediaReception,
  fetchWikipediaSummary,
  fetchWikipediaTitleForWikidataId,
  searchWikipediaAlbumTitle
} from '../../../utils/AlbumInfo/Wikibase/fetchWikipediaData';
import { fetchLastFmAlbumInfo } from '../../../utils/AlbumInfo/LastFm/fetchLastFmAlbumInfo';
import { normalizeName } from '../../../utils/AlbumInfo/textMatch';
import { linkAlbumGenres } from './linkAlbumGenres';
import { enrichArtistInfo } from './enrichArtistInfo';

// How long fully-enriched album info is trusted before being re-fetched.
export const ALBUM_INFO_STALE_DAYS = 180;
// A new release has little written about it on day one: MusicBrainz entries, Wikipedia
// articles and reviews all appear over the following weeks. While an album is this recent
// and still missing something, keep checking back.
export const NEW_RELEASE_WINDOW_DAYS = 120;
export const NEW_RELEASE_RETRY_DAYS = 4;
// Older albums that are still missing a summary or artist bio are unlikely to gain one
// soon, but are worth an occasional re-check.
export const INCOMPLETE_RETRY_DAYS = 30;
// A source was unreachable, so the result is incomplete for reasons that should clear up.
export const ERROR_RETRY_DAYS = 1;

// MusicBrainz tags are user-submitted folksonomy (can include noise like "2020s" or
// "usa" alongside real genres), so rank by tag count and keep only the strongest few.
const MAX_GENRES_FROM_MUSICBRAINZ = 5;

// Bios are fetched for the first few credited artists only — each one costs MusicBrainz
// calls at ~1 req/sec, and a compilation's twentieth artist isn't worth the time.
const MAX_ARTISTS_TO_ENRICH = 2;

const MAX_REVIEW_LINKS = 8;

const DAY_MS = 24 * 60 * 60 * 1000;

export interface ReviewLink {
  url: string;
  /** Publication, as the bare hostname (e.g. "pitchfork.com"). */
  source: string;
}

/**
 * When an album should next be enriched, based on how complete the result was. Stored in
 * album_info.next_refresh_at; the info route and the hourly sweep both re-queue once it
 * passes. This is what lets albums enriched on release day fill in later.
 */
export function nextRefreshAt(input: {
  releaseDate: Date;
  hasSummary: boolean;
  hasReception: boolean;
  hasArtistBio: boolean;
  hadErrors: boolean;
  now?: Date;
}): Date {
  const now = input.now ?? new Date();
  const inDays = (days: number) => new Date(now.getTime() + days * DAY_MS);

  if (input.hadErrors) return inDays(ERROR_RETRY_DAYS);

  const isNewRelease = now.getTime() - input.releaseDate.getTime() < NEW_RELEASE_WINDOW_DAYS * DAY_MS;
  if (isNewRelease) {
    const complete = input.hasSummary && input.hasReception && input.hasArtistBio;
    return inDays(complete ? ALBUM_INFO_STALE_DAYS : NEW_RELEASE_RETRY_DAYS);
  }
  // Plenty of older albums never get a reception section, so that alone doesn't count as
  // incomplete once the new-release window has passed.
  return inDays(input.hasSummary && input.hasArtistBio ? ALBUM_INFO_STALE_DAYS : INCOMPLETE_RETRY_DAYS);
}

/** True when cached info is missing or due a refresh. */
export function albumInfoIsDue(info: { next_refresh_at: Date | null } | null, now = new Date()): boolean {
  return !info || !info.next_refresh_at || info.next_refresh_at.getTime() <= now.getTime();
}

// Looks an album up on MusicBrainz, Wikipedia and Last.fm and persists whatever it finds:
// genres into the shared genre/albumgenrerelationship tables, the album's summary /
// critical reception / review links into album_info, and its artists' bios into
// artist_info. Each external call fails independently so one source being down doesn't
// discard data already fetched from another — and a failed lookup never overwrites
// something a previous run found.
export async function enrichAlbumInfo(albumId: string): Promise<void> {
  const album = await prisma.album.findUnique({
    where: { id: albumId },
    include: {
      album_info: true,
      albumartistrelationship: { orderBy: { id: 'asc' }, include: { artist: { include: { artist_info: true } } } }
    }
  });
  if (!album) return;

  const artists = album.albumartistrelationship.map(rel => rel.artist);
  const firstArtistName = artists[0]?.name;
  if (!firstArtistName) {
    // Nothing to look up by, but still record the attempt — otherwise the
    // enrich-missing-album-info sweep would re-queue this album forever.
    const retryAt = new Date(Date.now() + INCOMPLETE_RETRY_DAYS * DAY_MS);
    await prisma.album_info.upsert({
      where: { album_id: albumId },
      update: { fetched_at: new Date(), next_refresh_at: retryAt },
      create: { album_id: albumId, next_refresh_at: retryAt }
    });
    return;
  }

  let hadErrors = false;
  const attempt = async <T>(label: string, lookup: () => Promise<T | null>): Promise<T | null> => {
    try {
      return await lookup();
    } catch (error) {
      hadErrors = true;
      console.error(`[enrichAlbumInfo] ${label} failed for album ${albumId}`, error);
      return null;
    }
  };

  const releaseGroup = await attempt('MusicBrainz lookup', () => fetchMBReleaseGroup(album.name, firstArtistName));

  let reviewLinks: ReviewLink[] = [];
  let wikipediaTitle: string | null = null;

  if (releaseGroup) {
    const tags = [...(releaseGroup['tags'] ?? []), ...(releaseGroup['genres'] ?? [])];
    const genreNames = rankGenreTags(tags);
    if (genreNames.length > 0) {
      await linkAlbumGenres(albumId, genreNames);
    }

    reviewLinks = extractReviewLinks(releaseGroup['relations'] ?? []);

    const wikidataUrl = releaseGroup['relations']?.find(rel => rel.type === 'wikidata')?.url?.resource;
    if (wikidataUrl) {
      const wikidataId = wikidataUrl.replace(/^https?:\/\/www\.wikidata\.org\/wiki\//, '');
      wikipediaTitle = await attempt('Wikidata lookup', () => fetchWikipediaTitleForWikidataId(wikidataId));
    }
  }
  if (!wikipediaTitle) {
    // No MusicBrainz match, or one with no Wikidata link yet (usual for new releases).
    wikipediaTitle = await attempt('Wikipedia search', () => searchWikipediaAlbumTitle(album.name, firstArtistName));
  }

  let summary: string | null = null;
  let summaryHtml: string | null = null;
  let summarySource: string | null = null;
  let wikipediaUrl: string | null = null;
  let reception: string | null = null;

  if (wikipediaTitle) {
    const title = wikipediaTitle;
    const wikipedia = await attempt('Wikipedia summary', () => fetchWikipediaSummary(title));
    if (wikipedia) {
      const intro = await attempt('Wikipedia intro', () => fetchWikipediaIntro(wikipedia.title));
      summary = intro ?? wikipedia.extract;
      summaryHtml = wikipedia.extract_html || null;
      summarySource = 'wikipedia';
      wikipediaUrl = wikipedia.url;
      reception = await attempt('Wikipedia reception', () => fetchWikipediaReception(wikipedia.title));
    }
  }

  // Last.fm doesn't depend on a MusicBrainz match, so this runs regardless of whether
  // releaseGroup was found — it's also the summary fallback when Wikipedia has none.
  const lastfm = await attempt('Last.fm lookup', () => fetchLastFmAlbumInfo(album.name, firstArtistName));
  if (lastfm && !summary && lastfm.summary) {
    summary = lastfm.summary;
    summaryHtml = lastfm.summaryHtml;
    summarySource = 'lastfm';
  }

  let hasArtistBio = false;
  for (const [index, artist] of artists.slice(0, MAX_ARTISTS_TO_ENRICH).entries()) {
    const credited = (releaseGroup?.['artist-credit'] ?? []).find(
      credit => normalizeName(credit.artist?.name) === normalizeName(artist.name)
    );
    try {
      const result = await enrichArtistInfo(artist, artist.artist_info, credited?.artist?.id);
      // Completeness is judged on the primary artist; a featured artist without a page
      // shouldn't keep the whole album on the retry schedule.
      if (index === 0) hasArtistBio = result.hasBio;
      if (result.hadErrors) hadErrors = true;
    } catch (error) {
      hadErrors = true;
      console.error(`[enrichAlbumInfo] artist enrichment failed for artist ${artist.id}`, error);
    }
  }

  // After a failed lookup, "nothing found" isn't trustworthy — keep what a previous run
  // stored rather than replacing it with nulls. With no errors, the new result (including
  // a now-empty one) replaces the old, so a stale or mismatched summary does get cleared.
  const previous = album.album_info;
  const keep = <T>(fresh: T | null, old: T | null | undefined): T | null =>
    fresh === null && hadErrors ? old ?? null : fresh;

  const finalSummary = keep(summary, previous?.summary);
  const keptPreviousSummary = finalSummary !== summary;
  const finalReception = keep(reception, previous?.reception);
  const finalReviewLinks =
    reviewLinks.length === 0 && hadErrors && Array.isArray(previous?.review_links)
      ? (previous.review_links as Prisma.InputJsonValue)
      : (reviewLinks as unknown as Prisma.InputJsonValue);

  const data = {
    mb_release_group_id: keep(releaseGroup?.id ?? null, previous?.mb_release_group_id),
    mb_type: keep(releaseGroup?.['primary-type'] ?? null, previous?.mb_type),
    summary: finalSummary,
    summary_html: keptPreviousSummary ? previous?.summary_html ?? null : summaryHtml,
    summary_source: keptPreviousSummary ? previous?.summary_source ?? null : summarySource,
    wikipedia_url: keptPreviousSummary ? previous?.wikipedia_url ?? null : wikipediaUrl,
    reception: finalReception,
    review_links: finalReviewLinks,
    lastfm_listeners: keep(lastfm?.listeners ?? null, previous?.lastfm_listeners),
    lastfm_playcount: keep(lastfm?.playcount ?? null, previous?.lastfm_playcount),
    fetched_at: new Date(),
    next_refresh_at: nextRefreshAt({
      releaseDate: album.release_date,
      hasSummary: !!finalSummary,
      hasReception: !!finalReception,
      hasArtistBio,
      hadErrors
    })
  };

  // Always upsert (even with nothing found) so next_refresh_at gates retries — otherwise
  // an album with no match anywhere would be re-looked-up on every single request.
  await prisma.album_info.upsert({
    where: { album_id: albumId },
    update: data,
    create: { album_id: albumId, ...data }
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

// MusicBrainz editors attach "review" url relations to release groups (Pitchfork,
// AllMusic, The Guardian, ...). They're links rather than text, but for a new release
// they often exist long before a Wikipedia reception section does.
export function extractReviewLinks(relations: { type: string; url?: { resource?: string } }[]): ReviewLink[] {
  const links = new Map<string, ReviewLink>();
  for (const relation of relations) {
    if (relation.type !== 'review' || !relation.url?.resource) continue;
    try {
      const url = new URL(relation.url.resource);
      if (url.protocol !== 'https:' && url.protocol !== 'http:') continue;
      links.set(url.href, { url: url.href, source: url.hostname.replace(/^www\./, '') });
    } catch {
      // Not a parseable URL — skip it.
    }
  }
  return [...links.values()].slice(0, MAX_REVIEW_LINKS);
}
