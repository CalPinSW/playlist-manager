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
import { fetchLastFmAlbumInfo } from '../app/utils/AlbumInfo/LastFm/fetchLastFmAlbumInfo';

// The previous run confirmed MusicBrainz -> Wikidata -> enwiki title resolution all work.
// The failure is the final step: the `wikipedia` npm package 403s because it sends a
// non-standard "Api-User-Agent" header instead of the real "User-Agent" header Wikimedia's
// edge actually checks (https://meta.wikimedia.org/wiki/User-Agent_policy). Testing the fix
// here: call the REST summary endpoint directly with a real, compliant User-Agent.
const WIKIPEDIA_USER_AGENT = 'PlaylistManagerBot/0.1 (https://github.com/CalPinSW/playlist-manager; calumpinder@gmail.com)';

async function fetchWikidataSitelinksAndSummary(wikidataId: string) {
  const params = new URLSearchParams({
    action: 'wbgetentities',
    ids: wikidataId,
    languages: 'en',
    props: 'sitelinks|sitelinks/urls',
    format: 'json'
  });
  const url = `https://www.wikidata.org/w/api.php?${params.toString()}`;
  console.log('wikidata API url:', url);
  const res = await fetch(url, { headers: { 'User-Agent': WIKIPEDIA_USER_AGENT } });
  const data = await res.json();
  console.log('wikidata entity keys:', Object.keys(data?.entities ?? {}));
  const wikipediaTitle = data?.entities?.[wikidataId]?.sitelinks?.enwiki?.title;
  console.log('enwiki sitelink title:', wikipediaTitle ?? null);
  if (!wikipediaTitle) return null;

  const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(wikipediaTitle.replace(/ /g, '_'))}`;
  console.log('wikipedia REST summary url:', summaryUrl);
  const summaryRes = await fetch(summaryUrl, { headers: { 'User-Agent': WIKIPEDIA_USER_AGENT } });
  console.log('wikipedia REST summary status:', summaryRes.status);
  return summaryRes.json();
}

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
          const wikidata = await fetchWikidataSitelinksAndSummary(wikidataId);
          console.log('summary extract (plain text):', wikidata?.extract ?? null);
          console.log('summary extract_html present?', !!wikidata?.extract_html);
          console.log('description:', wikidata?.description ?? null);
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
