import { wikiSummary } from 'wikipedia';
import wikidataSdk from './wikidataSdk';
import wikipedia from 'wikipedia';
import { EntityId } from 'wikibase-sdk';

export const fetchWikipediaAlbumInfo = async (wikidataId: string): Promise<wikiSummary | null> => {
  // The less said on this the better.
  try {
    const wikidataEntryResponse = await fetch(
      wikidataSdk.getEntities({
        ids: wikidataId as EntityId,
        languages: 'en',
        props: ['sitelinks', 'sitelinks/urls']
      })
    );
    const wikidataEntry = await wikidataEntryResponse.json();
    const wikipediaUrl = wikidataEntry?.entities?.[wikidataId]?.sitelinks?.enwiki?.title;
    if (!wikipediaUrl) return null;
    const summary = await wikipedia.summary(wikipediaUrl);
    return summary;
  } catch (_) {
    console.log(_);
    return null;
  }
};
