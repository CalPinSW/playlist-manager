import wikidataSdk from './wikidataSdk';
import { EntityId } from 'wikibase-sdk';
import { normalizeName, sameAlbumTitle, truncateAtBoundary } from '../textMatch';

// Wikimedia rejects requests without a compliant User-Agent identifying the app
// (https://meta.wikimedia.org/wiki/User-Agent_policy). The `wikipedia` npm package sends
// a non-standard "Api-User-Agent" header instead of a real "User-Agent", which Wikimedia's
// edge 403s on every request — so everything is fetched directly here instead.
const WIKIPEDIA_USER_AGENT =
  'PlaylistManagerBot/0.1 (https://github.com/CalPinSW/playlist-manager; calumpinder@gmail.com)';

const REQUEST_TIMEOUT_MS = 10_000;
const MAX_RECEPTION_LENGTH = 3000;

export interface WikipediaSummary {
  title: string;
  extract: string;
  extract_html: string;
  description?: string;
  /** Canonical article URL, for "Read more on Wikipedia". */
  url: string | null;
}

interface WikipediaSearchPage {
  title: string;
  key: string;
  description?: string | null;
  excerpt?: string | null;
}

const wikiFetch = (url: string) =>
  fetch(url, { headers: { 'User-Agent': WIKIPEDIA_USER_AGENT }, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });

// Parsed JSON body, or null when the page/entity doesn't exist. Anything else non-OK
// (rate limiting, outages) throws, so callers can tell "no article" from "couldn't check"
// and avoid caching a transient failure as a definitive miss.
const wikiJson = async (url: string) => {
  const response = await wikiFetch(url);
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Wikimedia responded ${response.status} for ${new URL(url).pathname}`);
  return response.json();
};

const titleToPath = (title: string) => encodeURIComponent(title.replace(/ /g, '_'));

/** English Wikipedia article title linked from a Wikidata entity, if it has one. */
export const fetchWikipediaTitleForWikidataId = async (wikidataId: string): Promise<string | null> => {
  const entry = await wikiJson(
    wikidataSdk.getEntities({
      ids: wikidataId as EntityId,
      languages: 'en',
      props: ['sitelinks', 'sitelinks/urls']
    })
  );
  return entry?.entities?.[wikidataId]?.sitelinks?.enwiki?.title ?? null;
};

/** Lead-section summary of an article. Null for missing pages and disambiguation pages. */
export const fetchWikipediaSummary = async (title: string): Promise<WikipediaSummary | null> => {
  const summary = await wikiJson(`https://en.wikipedia.org/api/rest_v1/page/summary/${titleToPath(title)}`);
  if (!summary?.extract || summary.type === 'disambiguation') return null;
  return {
    title: summary.title ?? title,
    extract: summary.extract,
    extract_html: summary.extract_html ?? '',
    description: summary.description,
    url: summary.content_urls?.desktop?.page ?? `https://en.wikipedia.org/wiki/${titleToPath(summary.title ?? title)}`
  };
};

const searchWikipedia = async (query: string): Promise<WikipediaSearchPage[]> => {
  const params = new URLSearchParams({ q: query, limit: '5' });
  const data = await wikiJson(`https://en.wikipedia.org/w/rest.php/v1/search/page?${params.toString()}`);
  return data?.pages ?? [];
};

const withoutDisambiguator = (title: string) => title.replace(/\s*\([^)]*\)\s*$/, '');

const ALBUM_WORDS = /\b(album|ep|mixtape|soundtrack|extended play|compilation|record|lp|score)\b/i;
const ARTIST_WORDS =
  /\b(band|musician|singer|rapper|songwriter|duo|trio|quartet|group|producer|dj|composer|ensemble|collective|guitarist|drummer|pianist|bassist|vocalist|violinist|saxophonist|trumpeter|cellist|multi-instrumentalist|instrumentalist|orchestra|choir|musical|music|artist)\b/i;

/** Is this search hit the article for `albumName` by `artistName`? */
export function isAlbumArticle(page: WikipediaSearchPage, albumName: string, artistName: string): boolean {
  if (!sameAlbumTitle(withoutDisambiguator(page.title), albumName)) return false;
  const description = page.description ?? '';
  // The Wikidata short description for a record is e.g. "2026 studio album by Aesop Rock".
  // Requiring both parts is what stops a same-titled film, song, or another act's album
  // being attached to this one.
  return ALBUM_WORDS.test(description) && normalizeName(description).includes(normalizeName(artistName));
}

/** Is this search hit the article for the musical act `artistName`? */
export function isArtistArticle(page: WikipediaSearchPage, artistName: string): boolean {
  if (normalizeName(withoutDisambiguator(page.title)) !== normalizeName(artistName)) return false;
  return ARTIST_WORDS.test(page.description ?? '');
}

/**
 * Finds an album's article by searching Wikipedia directly. Used when MusicBrainz has no
 * Wikidata link for the release group — the norm for new releases, whose articles tend to
 * exist well before anyone adds the link on MusicBrainz.
 */
export const searchWikipediaAlbumTitle = async (albumName: string, artistName: string): Promise<string | null> => {
  const pages = await searchWikipedia(`${albumName} ${artistName} album`);
  return pages.find(page => isAlbumArticle(page, albumName, artistName))?.title ?? null;
};

/** Finds a musical act's article by searching Wikipedia directly. */
export const searchWikipediaArtistTitle = async (artistName: string): Promise<string | null> => {
  const pages = await searchWikipedia(`${artistName} musician band`);
  return pages.find(page => isArtistArticle(page, artistName))?.title ?? null;
};

const RECEPTION_HEADING = /recept|critical|review|accolade/i;

/**
 * Pulls the "Critical reception" (or similarly named) top-level section out of an
 * article's plain text, where `== Heading ==` lines mark sections. Sub-headings are
 * dropped and the text is capped at a paragraph boundary.
 */
export function extractReceptionSection(plainText: string): string | null {
  const lines = plainText.split('\n');
  const collected: string[] = [];
  let inSection = false;
  for (const line of lines) {
    const topLevel = line.match(/^==\s*([^=].*?)\s*==\s*$/);
    if (topLevel) {
      if (inSection) break;
      inSection = RECEPTION_HEADING.test(topLevel[1]);
      continue;
    }
    if (!inSection) continue;
    if (/^={3,}.*={3,}\s*$/.test(line)) continue;
    collected.push(line.trim());
  }
  const text = collected
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  if (!text) return null;
  return truncateAtBoundary(text, MAX_RECEPTION_LENGTH);
}

const fetchPlainText = async (title: string, introOnly: boolean): Promise<string | null> => {
  const params = new URLSearchParams({
    action: 'query',
    prop: 'extracts',
    explaintext: '1',
    redirects: '1',
    format: 'json',
    formatversion: '2',
    titles: title
  });
  if (introOnly) params.set('exintro', '1');
  const data = await wikiJson(`https://en.wikipedia.org/w/api.php?${params.toString()}`);
  return data?.query?.pages?.[0]?.extract?.trim() || null;
};

/**
 * The article's whole lead section as plain text — several paragraphs, where the REST
 * summary's `extract` is only the first. Capped at a paragraph boundary.
 */
export const fetchWikipediaIntro = async (title: string, maxLength = 2500): Promise<string | null> => {
  const intro = await fetchPlainText(title, true);
  return intro ? truncateAtBoundary(intro.replace(/\n{3,}/g, '\n\n'), maxLength) : null;
};

/** The article's critical-reception section as plain text, if it has one. */
export const fetchWikipediaReception = async (title: string): Promise<string | null> => {
  const text = await fetchPlainText(title, false);
  return text ? extractReceptionSection(text) : null;
};

/** Summary of the English Wikipedia article linked from a Wikidata entity. */
export const fetchWikipediaAlbumInfo = async (wikidataId: string): Promise<WikipediaSummary | null> => {
  try {
    const title = await fetchWikipediaTitleForWikidataId(wikidataId);
    if (!title) return null;
    return await fetchWikipediaSummary(title);
  } catch (error) {
    console.error('[fetchWikipediaAlbumInfo] failed', error);
    return null;
  }
};
