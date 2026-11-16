import { IArtist } from 'musicbrainz-api';
import mbApi from '../../../../lib/musicbrainz';
import { escapeLucenePhrase, normalizeName } from '../textMatch';

// Below this MusicBrainz search score a same-named artist is too likely to be someone else.
const MIN_ARTIST_SEARCH_SCORE = 90;

/** Full artist record, including the url relations that link to Wikidata. */
export const fetchMBArtist = async (mbArtistId: string): Promise<IArtist | null> => {
  const artist = await mbApi.lookup('artist', mbArtistId, ['url-rels']);
  return artist?.id ? artist : null;
};

/**
 * Finds an artist's MusicBrainz id by name, for when there is no release-group match to
 * read it from. Only accepts an exact (normalised) name match with a high search score.
 */
export const searchMBArtistId = async (artistName: string): Promise<string | null> => {
  const results = await mbApi.search('artist', { query: `artist:"${escapeLucenePhrase(artistName)}"`, limit: 5 });
  const wanted = normalizeName(artistName);
  const match = (results?.artists ?? []).find(
    artist => (artist.score ?? 0) >= MIN_ARTIST_SEARCH_SCORE && normalizeName(artist.name) === wanted
  );
  return match?.id ?? null;
};
