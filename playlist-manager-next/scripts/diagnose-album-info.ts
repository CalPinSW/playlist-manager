/**
 * One-off diagnostic: exercises the real enrichment code paths (not a reimplementation)
 * against live MusicBrainz/Wikidata/Wikipedia/Last.fm for a handful of real albums, and
 * dumps the raw intermediate data. Run in CI (GitHub Actions has normal internet access)
 * because this environment's egress proxy blocks these hosts entirely.
 *
 * Not part of the app — delete after diagnosis. Run with: npx tsx scripts/diagnose-album-info.ts
 */
import fetchMBReleaseGroup from '../app/utils/AlbumInfo/MusicBrainz/fetchMBReleaseGroup';
import fetchMBReleaseGroupMatch from '../app/utils/AlbumInfo/MusicBrainz/fetchMBReleaseGroupMatch';
import { fetchWikipediaAlbumInfo } from '../app/utils/AlbumInfo/Wikibase/fetchWikipediaData';
import { fetchLastFmAlbumInfo } from '../app/utils/AlbumInfo/LastFm/fetchLastFmAlbumInfo';

const cases: { artist: string; album: string }[] = [
  { artist: 'Radiohead', album: 'OK Computer' },
  { artist: 'Flume', album: 'We Live In A Society' },
  { artist: 'Aesop Rock', album: "I Heard It's A Mess There Too" },
  { artist: 'Charli xcx', album: 'Brat' }
];

async function main() {
  for (const { artist, album } of cases) {
    console.log(`\n===== ${artist} - ${album} =====`);

    console.log('--- MusicBrainz search match ---');
    let match: Awaited<ReturnType<typeof fetchMBReleaseGroupMatch>> = null;
    try {
      match = await fetchMBReleaseGroupMatch(album, artist);
      console.log(JSON.stringify(match, null, 2));
    } catch (err) {
      console.error('search FAILED:', err);
    }

    console.log('--- MusicBrainz release-group lookup (url-rels, genres, tags) ---');
    let releaseGroup: Awaited<ReturnType<typeof fetchMBReleaseGroup>> = null;
    try {
      releaseGroup = await fetchMBReleaseGroup(album, artist);
      console.log(JSON.stringify(releaseGroup, null, 2));
    } catch (err) {
      console.error('lookup FAILED:', err);
    }

    if (releaseGroup) {
      const wikiRelation = releaseGroup['relations']?.find((rel: { type: string }) => rel.type === 'wikidata');
      console.log('--- wikidata relation found? ---', !!wikiRelation);
      if (wikiRelation) {
        console.log('--- Wikidata -> Wikipedia summary ---');
        try {
          const resource = (wikiRelation as unknown as { url: { resource: string } }).url.resource;
          console.log('raw wikidata resource URL:', resource);
          const wikidataId = resource.replace('https://www.wikidata.org/wiki/', '');
          console.log('extracted wikidataId:', wikidataId);
          const wikidata = await fetchWikipediaAlbumInfo(wikidataId);
          console.log('fetchWikipediaAlbumInfo result:', JSON.stringify(wikidata, null, 2)?.slice(0, 500));
        } catch (err) {
          console.error('wikipedia fetch FAILED:', err);
        }
      }
    }

    console.log('--- Last.fm album.getinfo ---');
    try {
      const lastfm = await fetchLastFmAlbumInfo(album, artist);
      console.log(JSON.stringify(lastfm, null, 2)?.slice(0, 500));
    } catch (err) {
      console.error('last.fm fetch FAILED:', err);
    }

    // MusicBrainz rate limit ~1 req/sec
    await new Promise(r => setTimeout(r, 1200));
  }
}

main().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
