import { describe, it, expect } from 'vitest';
import {
  escapeLucenePhrase,
  normalizeName,
  sameAlbumTitle,
  stripAlbumDecorations,
  truncateAtBoundary
} from '../../../../app/utils/AlbumInfo/textMatch';

describe('normalizeName', () => {
  it('ignores case, diacritics, punctuation and & vs and', () => {
    expect(normalizeName('Róisín')).toBe('roisin');
    expect(normalizeName('In Endless Awe & Agony')).toBe(normalizeName('in endless awe and agony'));
    expect(normalizeName('SWALLOW!')).toBe('swallow');
    expect(normalizeName('What’s Going On')).toBe(normalizeName("What's Going On"));
  });
});

describe('stripAlbumDecorations', () => {
  it('removes edition suffixes', () => {
    expect(stripAlbumDecorations('Blue (Deluxe Edition)')).toBe('Blue');
    expect(stripAlbumDecorations('Blue - 2019 Remaster')).toBe('Blue');
    expect(stripAlbumDecorations('Blue [Expanded] (Deluxe)')).toBe('Blue');
    expect(
      stripAlbumDecorations('The Great Ecstasy of Woodcarver Steiner (Original Score & Variations)')
    ).toBe('The Great Ecstasy of Woodcarver Steiner');
  });

  it('leaves real titles alone', () => {
    expect(stripAlbumDecorations("(What's the Story) Morning Glory?")).toBe("(What's the Story) Morning Glory?");
    expect(stripAlbumDecorations('you made me / skin on linen')).toBe('you made me / skin on linen');
    expect(stripAlbumDecorations('Sweet Action II')).toBe('Sweet Action II');
    expect(stripAlbumDecorations('Songs (Ohia)')).toBe('Songs (Ohia)');
  });
});

describe('sameAlbumTitle', () => {
  it('matches across decorations and punctuation', () => {
    expect(sameAlbumTitle('Blue (Deluxe Edition)', 'Blue')).toBe(true);
    expect(sameAlbumTitle('SMILE! :D plus+', 'Smile! :D Plus+')).toBe(true);
  });

  it('rejects different titles and empty input', () => {
    expect(sameAlbumTitle('Blue', 'Blue Lines')).toBe(false);
    expect(sameAlbumTitle('!!!', '???')).toBe(false);
  });
});

describe('escapeLucenePhrase', () => {
  it('escapes quotes and backslashes', () => {
    expect(escapeLucenePhrase('Say "Hi" \\ Bye')).toBe('Say \\"Hi\\" \\\\ Bye');
  });
});

describe('truncateAtBoundary', () => {
  it('returns short text untouched', () => {
    expect(truncateAtBoundary('Short.', 100)).toBe('Short.');
  });

  it('cuts at a paragraph break when one is reasonably close', () => {
    const text = `${'a'.repeat(60)}.\n\n${'b'.repeat(60)}.`;
    expect(truncateAtBoundary(text, 100)).toBe(`${'a'.repeat(60)}.`);
  });

  it('falls back to a sentence boundary', () => {
    const text = `${'a'.repeat(50)}. ${'b'.repeat(80)}`;
    expect(truncateAtBoundary(text, 100)).toBe(`${'a'.repeat(50)}.`);
  });
});
