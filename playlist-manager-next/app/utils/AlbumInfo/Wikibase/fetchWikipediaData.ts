import wikidataSdk from './wikidataSdk';
import { EntityId } from 'wikibase-sdk';

// Wikimedia rejects requests without a compliant User-Agent identifying the app
// (https://meta.wikimedia.org/wiki/User-Agent_policy). The `wikipedia` npm package sends
// a non-standard "Api-User-Agent" header instead of a real "User-Agent", which Wikimedia's
// edge 403s on every request — so the summary is fetched directly here instead.
const WIKIPEDIA_USER_AGENT =
  'PlaylistManagerBot/0.1 (https://github.com/CalPinSW/playlist-manager; calumpinder@gmail.com)';

interface WikipediaSummary {
  extract: string;
  extract_html: string;
  description?: string;
}

export const fetchWikipediaAlbumInfo = async (wikidataId: string): Promise<WikipediaSummary | null> => {
  try {
    const wikidataEntryResponse = await fetch(
      wikidataSdk.getEntities({
        ids: wikidataId as EntityId,
        languages: 'en',
        props: ['sitelinks', 'sitelinks/urls']
      }),
      { headers: { 'User-Agent': WIKIPEDIA_USER_AGENT } }
    );
    const wikidataEntry = await wikidataEntryResponse.json();
    const wikipediaTitle = wikidataEntry?.entities?.[wikidataId]?.sitelinks?.enwiki?.title;
    if (!wikipediaTitle) return null;

    const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
      wikipediaTitle.replace(/ /g, '_')
    )}`;
    const summaryResponse = await fetch(summaryUrl, { headers: { 'User-Agent': WIKIPEDIA_USER_AGENT } });
    if (!summaryResponse.ok) return null;
    const summary = await summaryResponse.json();
    if (!summary?.extract) return null;
    return summary;
  } catch (error) {
    console.error('[fetchWikipediaAlbumInfo] failed', error);
    return null;
  }
};
