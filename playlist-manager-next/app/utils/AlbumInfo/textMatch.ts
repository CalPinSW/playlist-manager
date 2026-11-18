// Name-matching helpers shared by the MusicBrainz / Wikipedia / Last.fm lookups.
// Spotify, MusicBrainz and Wikipedia all spell the same release slightly differently
// (curly quotes, "&" vs "and", "(Deluxe Edition)" suffixes), so every comparison between
// sources goes through normalizeName rather than ===.

/** Lowercase, strip diacritics and punctuation, collapse whitespace. */
export function normalizeName(value: string | null | undefined): string {
  return (value ?? '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

// Edition/packaging decorations Spotify appends to album names that the other sources
// don't carry in the title.
const DECORATION =
  /deluxe|edition|version|remaster|reissue|expanded|bonus|anniversary|original|soundtrack|score|explicit|clean|complete|collector|special|extended|mono|stereo|live|demo|instrumental/i;

/**
 * "Album (Deluxe Edition)" / "Album - 2019 Remaster" → "Album". Only strips a trailing
 * bracket/dash segment that looks like a decoration, so real titles such as
 * "(What's the Story) Morning Glory?" or "you made me / skin on linen" are left alone.
 * Returns the input unchanged when there is nothing to strip.
 */
export function stripAlbumDecorations(name: string): string {
  let result = name.trim();
  for (;;) {
    const bracket = result.match(/^(.+?)\s*[([]([^()[\]]*)[)\]]\s*$/);
    if (bracket && DECORATION.test(bracket[2])) {
      result = bracket[1].trim();
      continue;
    }
    const dash = result.match(/^(.+?)\s+[-–—]\s+([^-–—]+)$/);
    if (dash && DECORATION.test(dash[2])) {
      result = dash[1].trim();
      continue;
    }
    return result;
  }
}

/** True when two album titles are the same once decorations and punctuation are ignored. */
export function sameAlbumTitle(a: string, b: string): boolean {
  const na = normalizeName(a);
  const nb = normalizeName(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  return normalizeName(stripAlbumDecorations(a)) === normalizeName(stripAlbumDecorations(b));
}

/** Escape a value for use inside a quoted Lucene phrase (MusicBrainz search). */
export function escapeLucenePhrase(value: string): string {
  return value.replace(/[\\"]/g, '\\$&');
}

/**
 * Cut long prose at a paragraph (or, failing that, sentence) boundary at or before
 * maxLength, so cached text never ends mid-sentence.
 */
export function truncateAtBoundary(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  const slice = text.slice(0, maxLength);
  const paragraph = slice.lastIndexOf('\n\n');
  if (paragraph > maxLength * 0.5) return slice.slice(0, paragraph).trim();
  const sentence = Math.max(slice.lastIndexOf('. '), slice.lastIndexOf('.\n'));
  if (sentence > maxLength * 0.3) return slice.slice(0, sentence + 1).trim();
  return `${slice.trim()}…`;
}
