import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => ({
  prisma: {
    album: { findUnique: vi.fn() },
    album_info: { upsert: vi.fn() },
    artist_info: { upsert: vi.fn() }
  },
  fetchMBReleaseGroup: vi.fn(),
  fetchMBArtist: vi.fn(),
  searchMBArtistId: vi.fn(),
  wiki: {
    fetchWikipediaTitleForWikidataId: vi.fn(),
    fetchWikipediaSummary: vi.fn(),
    fetchWikipediaIntro: vi.fn(),
    fetchWikipediaReception: vi.fn(),
    searchWikipediaAlbumTitle: vi.fn(),
    searchWikipediaArtistTitle: vi.fn()
  },
  fetchLastFmAlbumInfo: vi.fn(),
  fetchLastFmArtistInfo: vi.fn(),
  linkAlbumGenres: vi.fn()
}));

vi.mock('../../../../lib/prisma', () => ({ default: mocks.prisma }));
vi.mock('../../../../app/utils/AlbumInfo/MusicBrainz/fetchMBReleaseGroup', () => ({
  default: mocks.fetchMBReleaseGroup
}));
vi.mock('../../../../app/utils/AlbumInfo/MusicBrainz/fetchMBArtist', () => ({
  fetchMBArtist: mocks.fetchMBArtist,
  searchMBArtistId: mocks.searchMBArtistId
}));
vi.mock('../../../../app/utils/AlbumInfo/Wikibase/fetchWikipediaData', () => mocks.wiki);
vi.mock('../../../../app/utils/AlbumInfo/LastFm/fetchLastFmAlbumInfo', () => ({
  fetchLastFmAlbumInfo: mocks.fetchLastFmAlbumInfo,
  fetchLastFmArtistInfo: mocks.fetchLastFmArtistInfo
}));
vi.mock('../../../../app/api/albums/utilities/linkAlbumGenres', () => ({ linkAlbumGenres: mocks.linkAlbumGenres }));

import {
  ALBUM_INFO_STALE_DAYS,
  ERROR_RETRY_DAYS,
  INCOMPLETE_RETRY_DAYS,
  NEW_RELEASE_RETRY_DAYS,
  enrichAlbumInfo,
  extractReviewLinks,
  nextRefreshAt
} from '../../../../app/api/albums/utilities/enrichAlbumInfo';

const DAY_MS = 24 * 60 * 60 * 1000;
const now = new Date('2026-11-16T12:00:00Z');
const daysBefore = (d: number) => new Date(now.getTime() - d * DAY_MS);
const daysUntil = (date: Date, from = now) => Math.round((date.getTime() - from.getTime()) / DAY_MS);

describe('nextRefreshAt', () => {
  const complete = { hasSummary: true, hasReception: true, hasArtistBio: true, hadErrors: false, now };

  it('re-checks a new release soon while anything is missing', () => {
    const releaseDate = daysBefore(3);
    expect(daysUntil(nextRefreshAt({ ...complete, releaseDate, hasSummary: false }))).toBe(NEW_RELEASE_RETRY_DAYS);
    expect(daysUntil(nextRefreshAt({ ...complete, releaseDate, hasReception: false }))).toBe(NEW_RELEASE_RETRY_DAYS);
    expect(daysUntil(nextRefreshAt({ ...complete, releaseDate }))).toBe(ALBUM_INFO_STALE_DAYS);
  });

  it('backs off for older albums, and does not chase a missing reception section', () => {
    const releaseDate = daysBefore(400);
    expect(daysUntil(nextRefreshAt({ ...complete, releaseDate, hasArtistBio: false }))).toBe(INCOMPLETE_RETRY_DAYS);
    expect(daysUntil(nextRefreshAt({ ...complete, releaseDate, hasReception: false }))).toBe(ALBUM_INFO_STALE_DAYS);
  });

  it('retries quickly after a source error, however complete the result looks', () => {
    expect(daysUntil(nextRefreshAt({ ...complete, releaseDate: daysBefore(400), hadErrors: true }))).toBe(
      ERROR_RETRY_DAYS
    );
  });
});

describe('extractReviewLinks', () => {
  it('keeps de-duplicated review urls and labels them by host', () => {
    const links = extractReviewLinks([
      { type: 'review', url: { resource: 'https://www.pitchfork.com/reviews/albums/x/' } },
      { type: 'review', url: { resource: 'https://www.pitchfork.com/reviews/albums/x/' } },
      { type: 'wikidata', url: { resource: 'https://www.wikidata.org/wiki/Q1' } },
      { type: 'review', url: { resource: 'not a url' } },
      { type: 'review' }
    ]);
    expect(links).toEqual([{ url: 'https://www.pitchfork.com/reviews/albums/x/', source: 'pitchfork.com' }]);
  });
});

describe('enrichAlbumInfo', () => {
  const artist = { id: 'sp-artist', name: 'Royal Blood', artist_info: null };
  const album = (overrides: Record<string, unknown> = {}) => ({
    id: 'album-1',
    name: 'Dead Company',
    release_date: new Date(Date.now() - 10 * DAY_MS),
    album_info: null,
    albumartistrelationship: [{ artist }],
    ...overrides
  });
  const wikipediaPage = (title: string) => ({
    title,
    extract: `${title} lead.`,
    extract_html: `<p>${title} lead.</p>`,
    description: `${title} description`,
    url: `https://en.wikipedia.org/wiki/${title.replace(/ /g, '_')}`
  });
  const savedAlbumInfo = () => mocks.prisma.album_info.upsert.mock.calls[0][0].create;
  const savedArtistInfo = () => mocks.prisma.artist_info.upsert.mock.calls[0][0].create;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mocks.prisma.album.findUnique.mockResolvedValue(album());
    mocks.fetchMBReleaseGroup.mockResolvedValue(null);
    mocks.searchMBArtistId.mockResolvedValue(null);
    mocks.fetchMBArtist.mockResolvedValue(null);
    Object.values(mocks.wiki).forEach(fn => fn.mockResolvedValue(null));
    mocks.fetchLastFmAlbumInfo.mockResolvedValue(null);
    mocks.fetchLastFmArtistInfo.mockResolvedValue(null);
  });

  it('stores summary, reception, review links and the artist bio from a full MusicBrainz match', async () => {
    mocks.fetchMBReleaseGroup.mockResolvedValue({
      id: 'rg-1',
      'primary-type': 'Album',
      tags: [{ name: 'Rock', count: 3 }],
      'artist-credit': [{ name: 'Royal Blood', artist: { id: 'mb-artist', name: 'Royal Blood' } }],
      relations: [
        { type: 'wikidata', url: { resource: 'https://www.wikidata.org/wiki/Q111' } },
        { type: 'review', url: { resource: 'https://www.nme.com/reviews/dead-company' } }
      ]
    });
    mocks.fetchMBArtist.mockResolvedValue({
      id: 'mb-artist',
      disambiguation: 'UK rock duo',
      relations: [{ type: 'wikidata', url: { resource: 'https://www.wikidata.org/wiki/Q222' } }]
    });
    mocks.wiki.fetchWikipediaTitleForWikidataId.mockImplementation(async (id: string) =>
      id === 'Q111' ? 'Dead Company' : 'Royal Blood'
    );
    mocks.wiki.fetchWikipediaSummary.mockImplementation(async (title: string) => wikipediaPage(title));
    mocks.wiki.fetchWikipediaIntro.mockImplementation(async (title: string) => `${title} full intro.`);
    mocks.wiki.fetchWikipediaReception.mockResolvedValue('Critics were positive.');

    await enrichAlbumInfo('album-1');

    expect(mocks.linkAlbumGenres).toHaveBeenCalledWith('album-1', ['rock']);
    expect(savedAlbumInfo()).toMatchObject({
      mb_release_group_id: 'rg-1',
      summary: 'Dead Company full intro.',
      summary_source: 'wikipedia',
      wikipedia_url: 'https://en.wikipedia.org/wiki/Dead_Company',
      reception: 'Critics were positive.',
      review_links: [{ url: 'https://www.nme.com/reviews/dead-company', source: 'nme.com' }]
    });
    // The artist's MusicBrainz id came from the release group, so no name search is needed.
    expect(mocks.searchMBArtistId).not.toHaveBeenCalled();
    expect(mocks.fetchMBArtist).toHaveBeenCalledWith('mb-artist');
    expect(savedArtistInfo()).toMatchObject({
      artist_id: 'sp-artist',
      mb_artist_id: 'mb-artist',
      bio: 'Royal Blood full intro.',
      bio_source: 'wikipedia',
      description: 'Royal Blood description'
    });
    expect(daysUntil(savedAlbumInfo().next_refresh_at, new Date())).toBe(ALBUM_INFO_STALE_DAYS);
  });

  it('falls back to Wikipedia search and Last.fm when MusicBrainz has no match', async () => {
    mocks.wiki.searchWikipediaAlbumTitle.mockResolvedValue('Dead Company (album)');
    mocks.wiki.fetchWikipediaSummary.mockImplementation(async (title: string) => wikipediaPage(title));
    mocks.fetchLastFmAlbumInfo.mockResolvedValue({ listeners: 5, playcount: 9, summary: 'lfm', summaryHtml: 'lfm' });
    mocks.fetchLastFmArtistInfo.mockResolvedValue({ bio: 'A duo from Brighton.', url: 'https://last.fm/music/x' });

    await enrichAlbumInfo('album-1');

    expect(savedAlbumInfo()).toMatchObject({
      mb_release_group_id: null,
      summary: 'Dead Company (album) lead.',
      summary_source: 'wikipedia',
      lastfm_listeners: 5
    });
    expect(savedArtistInfo()).toMatchObject({ bio: 'A duo from Brighton.', bio_source: 'lastfm' });
    // New release still missing a reception section → checked again soon.
    expect(daysUntil(savedAlbumInfo().next_refresh_at, new Date())).toBe(NEW_RELEASE_RETRY_DAYS);
  });

  it('keeps previously stored info when a source errors, and retries the next day', async () => {
    mocks.prisma.album.findUnique.mockResolvedValue(
      album({
        album_info: {
          mb_release_group_id: 'rg-old',
          mb_type: 'Album',
          summary: 'Old summary.',
          summary_html: '<p>Old summary.</p>',
          summary_source: 'wikipedia',
          wikipedia_url: 'https://en.wikipedia.org/wiki/Old',
          reception: 'Old reception.',
          review_links: [{ url: 'https://old.example/review', source: 'old.example' }],
          lastfm_listeners: 1,
          lastfm_playcount: 2
        }
      })
    );
    mocks.fetchMBReleaseGroup.mockRejectedValue(new Error('MusicBrainz 503'));

    await enrichAlbumInfo('album-1');

    const update = mocks.prisma.album_info.upsert.mock.calls[0][0].update;
    expect(update).toMatchObject({
      mb_release_group_id: 'rg-old',
      summary: 'Old summary.',
      summary_source: 'wikipedia',
      wikipedia_url: 'https://en.wikipedia.org/wiki/Old',
      reception: 'Old reception.',
      review_links: [{ url: 'https://old.example/review', source: 'old.example' }]
    });
    expect(daysUntil(update.next_refresh_at, new Date())).toBe(ERROR_RETRY_DAYS);
  });

  it('clears a previously stored summary when a clean run finds nothing', async () => {
    // Guards against summaries attached by the old matcher (wrong artist) living forever.
    mocks.prisma.album.findUnique.mockResolvedValue(
      album({ album_info: { summary: 'Wrong album.', summary_source: 'wikipedia', reception: null, review_links: [] } })
    );

    await enrichAlbumInfo('album-1');

    expect(mocks.prisma.album_info.upsert.mock.calls[0][0].update).toMatchObject({ summary: null, summary_source: null });
  });

  it('does not re-fetch an artist whose bio is already cached and fresh', async () => {
    mocks.prisma.album.findUnique.mockResolvedValue(
      album({
        albumartistrelationship: [
          { artist: { ...artist, artist_info: { bio: 'Cached bio.', fetched_at: new Date(), mb_artist_id: 'mb-artist' } } }
        ]
      })
    );

    await enrichAlbumInfo('album-1');

    expect(mocks.fetchMBArtist).not.toHaveBeenCalled();
    expect(mocks.wiki.searchWikipediaArtistTitle).not.toHaveBeenCalled();
    expect(mocks.prisma.artist_info.upsert).not.toHaveBeenCalled();
  });

  it('records the attempt for an album with no artists so it is not re-queued forever', async () => {
    mocks.prisma.album.findUnique.mockResolvedValue(album({ albumartistrelationship: [] }));

    await enrichAlbumInfo('album-1');

    expect(mocks.fetchMBReleaseGroup).not.toHaveBeenCalled();
    expect(savedAlbumInfo().next_refresh_at).toBeInstanceOf(Date);
  });
});
