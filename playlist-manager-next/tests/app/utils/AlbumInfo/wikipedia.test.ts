import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  extractReceptionSection,
  fetchWikipediaSummary,
  isAlbumArticle,
  isArtistArticle,
  searchWikipediaAlbumTitle
} from '../../../../app/utils/AlbumInfo/Wikibase/fetchWikipediaData';

const page = (title: string, description: string | null) => ({ title, key: title.replace(/ /g, '_'), description });

describe('isAlbumArticle', () => {
  it('accepts the album article, with or without a disambiguator', () => {
    expect(isAlbumArticle(page('Dead Company', '2026 studio album by Royal Blood'), 'Dead Company', 'Royal Blood')).toBe(
      true
    );
    expect(
      isAlbumArticle(page('Trouble Mountain (album)', '2026 studio album by Aesop Rock'), 'Trouble Mountain', 'Aesop Rock')
    ).toBe(true);
  });

  it('rejects same-titled articles that are not this album', () => {
    expect(isAlbumArticle(page('Hollowbody', '2024 video game'), 'Hollowbody', 'Fog Lake')).toBe(false);
    expect(isAlbumArticle(page('Hollowbody', '2019 album by Another Band'), 'Hollowbody', 'Fog Lake')).toBe(false);
    expect(isAlbumArticle(page('Fog Lake', 'Canadian musician'), 'Hollowbody', 'Fog Lake')).toBe(false);
    expect(isAlbumArticle(page('Hollowbody', null), 'Hollowbody', 'Fog Lake')).toBe(false);
  });
});

describe('isArtistArticle', () => {
  it('accepts a musical act with the exact name', () => {
    expect(isArtistArticle(page('Wavves', 'American rock band'), 'Wavves')).toBe(true);
    expect(isArtistArticle(page('Daine (musician)', 'Australian singer-songwriter'), 'daine')).toBe(true);
  });

  it('rejects non-musical or differently named pages', () => {
    expect(isArtistArticle(page('The Body', 'Physical structure of an organism'), 'The Body')).toBe(false);
    expect(isArtistArticle(page('Wavves discography', 'Band discography'), 'Wavves')).toBe(false);
  });
});

describe('extractReceptionSection', () => {
  const article = [
    'Lead paragraph.',
    '',
    '== Background ==',
    'Background text.',
    '',
    '== Critical reception ==',
    'The album received acclaim.',
    '',
    '=== Year-end lists ===',
    'It topped several lists.',
    '',
    '== Track listing ==',
    'Not this.'
  ].join('\n');

  it('returns only the reception section, without sub-headings', () => {
    expect(extractReceptionSection(article)).toBe('The album received acclaim.\n\nIt topped several lists.');
  });

  it('returns null when there is no such section', () => {
    expect(extractReceptionSection('Lead.\n\n== Track listing ==\nSongs.')).toBeNull();
  });

  it('caps very long sections at a paragraph boundary', () => {
    const long = `== Reception ==\n${'A sentence. '.repeat(200)}\n\n${'Another one. '.repeat(200)}`;
    const result = extractReceptionSection(long);
    expect(result.length).toBeLessThanOrEqual(3000);
    expect(result.endsWith('.')).toBe(true);
  });
});

describe('Wikipedia fetching', () => {
  afterEach(() => vi.unstubAllGlobals());

  const stubFetch = (status: number, body: unknown) =>
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ status, ok: status >= 200 && status < 300, json: async () => body })
    );

  it('treats a 404 as "no article"', async () => {
    stubFetch(404, {});
    expect(await fetchWikipediaSummary('Nope')).toBeNull();
  });

  it('throws on other failures so they are not cached as a miss', async () => {
    stubFetch(429, {});
    await expect(fetchWikipediaSummary('Busy')).rejects.toThrow('429');
  });

  it('skips disambiguation pages', async () => {
    stubFetch(200, { type: 'disambiguation', title: 'Blue', extract: 'Blue may refer to:' });
    expect(await fetchWikipediaSummary('Blue')).toBeNull();
  });

  it('finds an album by search only when the hit validates', async () => {
    stubFetch(200, {
      pages: [page('Cherry Soda', 'Carbonated soft drink'), page('Cherry Soda (album)', '2026 studio album by Wavves')]
    });
    expect(await searchWikipediaAlbumTitle('Cherry Soda', 'Wavves')).toBe('Cherry Soda (album)');
  });
});
