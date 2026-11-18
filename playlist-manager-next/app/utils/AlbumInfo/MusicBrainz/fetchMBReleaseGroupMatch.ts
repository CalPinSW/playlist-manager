import { IReleaseGroupMatch } from 'musicbrainz-api';
import mbApi from '../../../../lib/musicbrainz';
import { escapeLucenePhrase, normalizeName, sameAlbumTitle, stripAlbumDecorations } from '../textMatch';

// Preference order when several release groups share the title and artist.
const TYPE_RANK: Record<string, number> = { Album: 0, EP: 1, Single: 2, Other: 3, Broadcast: 4 };

const hasArtist = (match: IReleaseGroupMatch, artistName: string): boolean => {
  const wanted = normalizeName(artistName);
  if (!wanted) return false;
  return (match['artist-credit'] ?? []).some(
    credit => normalizeName(credit.name) === wanted || normalizeName(credit.artist?.name) === wanted
  );
};

/**
 * Picks the release group that is actually this album: the title must match (ignoring
 * punctuation and "(Deluxe Edition)"-style decorations) and the artist must be credited.
 * A search hit that fails either check is discarded rather than guessed at — a wrong
 * match would attach another record's Wikipedia article and reviews to this album.
 */
export function pickReleaseGroupMatch(
  candidates: IReleaseGroupMatch[],
  albumName: string,
  artistName: string
): IReleaseGroupMatch | null {
  const valid = candidates.filter(
    candidate => sameAlbumTitle(candidate.title, albumName) && hasArtist(candidate, artistName)
  );
  if (valid.length === 0) return null;
  return [...valid].sort((a, b) => {
    const scoreDiff = (b.score ?? 0) - (a.score ?? 0);
    if (scoreDiff !== 0) return scoreDiff;
    return (TYPE_RANK[a['primary-type']] ?? 9) - (TYPE_RANK[b['primary-type']] ?? 9);
  })[0];
}

const searchReleaseGroups = async (title: string, artistName: string): Promise<IReleaseGroupMatch[]> => {
  const query = `artist:"${escapeLucenePhrase(artistName)}" AND releasegroup:"${escapeLucenePhrase(title)}"`;
  const results = await mbApi.search('release-group', { query, limit: 10 });
  return results?.['release-groups'] ?? [];
};

const fetchMBReleaseGroupMatch = async (
  albumName: string,
  firstArtistName: string
): Promise<IReleaseGroupMatch | null> => {
  const match = pickReleaseGroupMatch(
    await searchReleaseGroups(albumName, firstArtistName),
    albumName,
    firstArtistName
  );
  if (match) return match;

  // Spotify's "Album (Deluxe Edition)" is usually just "Album" on MusicBrainz, and the
  // quoted phrase search above won't find it under the decorated name.
  const bareName = stripAlbumDecorations(albumName);
  if (bareName === albumName) return null;
  return pickReleaseGroupMatch(await searchReleaseGroups(bareName, firstArtistName), albumName, firstArtistName);
};

export default fetchMBReleaseGroupMatch;
