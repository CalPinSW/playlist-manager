const LASTFM_API_URL = 'https://ws.audioscrobbler.com/2.0/';

export interface LastFmAlbumInfo {
  listeners: number | null;
  playcount: number | null;
  summary: string | null;
  summaryHtml: string | null;
}

// Last.fm's album.getinfo — listener/playcount stats, plus a wiki bio used as a summary
// fallback when MusicBrainz has no Wikidata-linked Wikipedia page for the release.
// Requires LASTFM_API_KEY (free key from last.fm/api/account/create); returns null
// without one so this source degrades silently rather than failing enrichment.
export const fetchLastFmAlbumInfo = async (albumName: string, artistName: string): Promise<LastFmAlbumInfo | null> => {
  const apiKey = process.env.LASTFM_API_KEY;
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
    const response = await fetch(`${LASTFM_API_URL}?${params.toString()}`);
    const data = await response.json();
    if (!response.ok || data.error || !data.album) return null;

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

function parseCountOrNull(value: unknown): number | null {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

// Last.fm wiki summaries end with a "<a href="...">Read more on Last.fm</a>." link and
// contain basic HTML — strip both for the plain-text summary field.
function stripLastFmWikiMarkup(html: string): string {
  return html
    .replace(/<a[^>]*>[\s\S]*?<\/a>\.?/gi, '')
    .replace(/<[^>]*>/g, '')
    .trim();
}
