import { FC } from 'react';
import { Album } from '@spotify/web-api-ts-sdk';
import mbApi from '../../../../../lib/musicbrainz';
import fetchMBReleaseGroupMatch from '../../../../utils/MusicBrainz/fetchMBReleaseGroupMatch';
import wikipedia, { wikiSummary } from 'wikipedia';
import wikidataSdk from '../../../../utils/Wikibase/wikidataSdk';

interface SpotifyAlbumInfoProps {
  album: Album;
}

const SpotifyAlbumInfo: FC<SpotifyAlbumInfoProps> = async ({ album }) => {
  const wikiAlbumInfo = await fetchWikipediaAlbumInfo(album);
  if (!wikiAlbumInfo) return null;
  return (
    <div>
      <div dangerouslySetInnerHTML={{ __html: wikiAlbumInfo.extract_html }}></div>
    </div>
  );
};

export default SpotifyAlbumInfo;

const fetchWikipediaAlbumInfo = async (album: Album): Promise<wikiSummary> => {
  // The less said on this the better.
  try {
    const mbReleaseGroupMatch = await fetchMBReleaseGroupMatch(album);
    const releaseGroup = await mbApi.lookup('release-group', mbReleaseGroupMatch.id, ['url-rels']);
    const wikiRelation = releaseGroup['relations'].find(rel => rel.type === 'wikidata');
    const entityId = wikiRelation.url.resource.replace('https://www.wikidata.org/wiki/', '');
    const wikidataEntryResponse = await fetch(
      wikidataSdk.getEntities({
        ids: entityId,
        languages: 'en',
        props: ['sitelinks', 'sitelinks/urls']
      })
    );
    const wikidataEntry = await wikidataEntryResponse.json();
    const wikipediaUrl = wikidataEntry?.entities?.[entityId]?.sitelinks?.enwiki?.title;
    if (!wikipediaUrl) return null;
    const summary = await wikipedia.summary(wikipediaUrl);
    return summary;
  } catch (_) {
    console.log(_);
    return null;
  }
};
