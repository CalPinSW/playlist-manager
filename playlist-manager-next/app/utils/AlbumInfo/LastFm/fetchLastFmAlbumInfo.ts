import { truncateAtBoundary } from '../textMatch';

const LASTFM_API_URL = 'https://ws.audioscrobbler.com/2.0/';
// Error 6: "Artist/album not found" (also used for invalid parameters).
const LASTFM_ERROR_NOT_FOUND = 6;

export interface LastFmAlbumInfo {
  listeners: number | null;
  playcount: number | null;
  summary: string | null;
  summaryHtml: string | null;
}

// Last.fm's album.getinfo — listener/playcount stats, plus a wiki bio used as a summary
// fallback when MusicBrainz has no Wikidata-linked Wikipedia page for the release.
// Requires LASTFM_API_KEY (free key from last.fm/api/account/create); returns null
// without one so a missing key degrades this source rather than failing enrichment.
export const fetchLastFmAlbumInfo = async (albumName: string, artistName: string): Promise<LastFmAlbumInfo | null> => {
  const apiKey = getLastFmApiKey();
  if (!apiKey) return null;

  try {
    const params = new URLSearchParams({
      method: 'album.getinfo',
      api_key: apiKey,
      artist: artistName,
      album: albumName,
      autocorrect: '1',
      format: 'json'
    });
    const data = await lastFmGet(params);
    if (!data?.album) return null;

    const wikiHtml: string | undefined = data.album.wiki?.summary;
    return {
      listeners: parseCountOrNull(data.album.listeners),
      playcount: parseCountOrNull(data.album.playcount),
      summaryHtml: wikiHtml ?? null,
      summary: wikiHtml ? stripLastFmWikiMarkup(wikiHtml) : null
    };
  } catch (error) {
    console.error(`[fetchLastFmAlbumInfo] lookup failed for "${albumName}" by "${artistName}"`, error);
    return null;
  }
};

export interface LastFmArtistInfo {
  bio: string | null;
  url: string | null;
}

// Last.fm files every act sharing a name under one page, and the bio for those is a
// numbered list of unrelated artists rather than a biography of the one we want.
const SHARED_NAME_BIO = /^there (are|is|were|have been)\b.{0,80}\b(artist|band|act|group|musician)s?\b/i;

const MAX_BIO_LENGTH = 2500;

// Last.fm's artist.getinfo — the bio is the fallback when an artist has no Wikipedia page,
// which is common for the smaller acts on new-release playlists.
export const fetchLastFmArtistInfo = async (artistName: string): Promise<LastFmArtistInfo | null> => {
  const apiKey = getLastFmApiKey();
  if (!apiKey) return null;

  try {
    const params = new URLSearchParams({
      method: 'artist.getinfo',
      api_key: apiKey,
      artist: artistName,
      autocorrect: '0',
      format: 'json'
    });
    const data = await lastFmGet(params);
    if (!data?.artist) return null;

    const content: string | undefined = data.artist.bio?.content || data.artist.bio?.summary;
    const bio = content ? stripLastFmWikiMarkup(content) : '';
    return {
      bio: bio && !SHARED_NAME_BIO.test(bio) ? truncateAtBoundary(bio, MAX_BIO_LENGTH) : null,
      url: data.artist.url ?? null
    };
  } catch (error) {
    console.error(`[fetchLastFmArtistInfo] lookup failed for "${artistName}"`, error);
    return null;
  }
};

let warnedMissingKey = false;

// A missing key used to be completely silent, which hid the fact that Last.fm had never
// returned anything in production. Say so once per process instead.
function getLastFmApiKey(): string | null {
  const apiKey = process.env.LASTFM_API_KEY;
  if (!apiKey && !warnedMissingKey) {
    warnedMissingKey = true;
    console.warn('[lastfm] LASTFM_API_KEY is not set in this environment — skipping all Last.fm lookups');
  }
  return apiKey || null;
}

// Returns the parsed body, or null for "not found". Throws on anything that indicates a
// broken integration (bad key, suspended key, rate limit) so it shows up in task logs.
async function lastFmGet(params: URLSearchParams) {
  const response = await fetch(`${LASTFM_API_URL}?${params.toString()}`, { signal: AbortSignal.timeout(10_000) });
  const data = await response.json().catch(() => null);
  if (data?.error) {
    if (data.error === LASTFM_ERROR_NOT_FOUND) return null;
    throw new Error(`Last.fm error ${data.error}: ${data.message ?? 'unknown'}`);
  }
  if (!response.ok) throw new Error(`Last.fm responded ${response.status}`);
  return data;
}

function parseCountOrNull(value: unknown): number | null {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

// Last.fm wiki text ends with a "<a href="...">Read more on Last.fm</a>." link (plus, on
// full bios, a licence line) and contains basic HTML — strip all of it for plain text.
export function stripLastFmWikiMarkup(html: string): string {
  return html
    .replace(/<a[^>]*>[\s\S]*?<\/a>\.?/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/User-contributed text is available under[\s\S]*$/i, '')
    .trim();
}
