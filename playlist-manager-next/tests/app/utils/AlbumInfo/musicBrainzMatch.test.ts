import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockSearch } = vi.hoisted(() => ({ mockSearch: vi.fn() }));
vi.mock('../../../../lib/musicbrainz', () => ({ default: { search: mockSearch } }));

import fetchMBReleaseGroupMatch, {
  pickReleaseGroupMatch
} from '../../../../app/utils/AlbumInfo/MusicBrainz/fetchMBReleaseGroupMatch';

const rg = (title: string, artist: string, extra: Record<string, unknown> = {}) =>
  ({
    id: `${title}-${artist}`,
    title,
    score: 100,
    count: 1,
    'primary-type': 'Album',
    'artist-credit': [{ name: artist, artist: { id: `mb-${artist}`, name: artist } }],
    ...extra
  }) as never;

describe('pickReleaseGroupMatch', () => {
  it('rejects a same-titled release group by a different artist', () => {
    // The old matcher sorted by release count and took the top hit, whoever it was by.
    const candidates = [rg('Hollowbody', 'Some Other Band', { count: 12 })];
    expect(pickReleaseGroupMatch(candidates, 'Hollowbody', 'Fog Lake')).toBeNull();
  });

  it('rejects a different title by the right artist', () => {
    expect(pickReleaseGroupMatch([rg('Captain', 'Fog Lake')], 'Hollowbody', 'Fog Lake')).toBeNull();
  });

  it('prefers the highest score, then albums over singles', () => {
    const single = rg('Cherry Soda', 'Wavves', { id: 'single', 'primary-type': 'Single' });
    const album = rg('Cherry Soda', 'Wavves', { id: 'album' });
    const lowScore = rg('Cherry Soda', 'Wavves', { id: 'low', score: 60 });
    expect(pickReleaseGroupMatch([lowScore, single, album], 'Cherry Soda', 'Wavves')).toMatchObject({ id: 'album' });
  });

  it('matches through decorations, case and diacritics', () => {
    expect(pickReleaseGroupMatch([rg('Roisin', 'Ciaran')], 'Róisín (Deluxe Edition)', 'Ciarán')).not.toBeNull();
  });
});

describe('fetchMBReleaseGroupMatch', () => {
  beforeEach(() => vi.clearAllMocks());

  it('searches by release-group title and artist with a well-formed, escaped query', async () => {
    mockSearch.mockResolvedValue({ 'release-groups': [rg('Say "Hi"', 'Say Now')] });

    await fetchMBReleaseGroupMatch('Say "Hi"', 'Say Now');

    expect(mockSearch).toHaveBeenCalledWith('release-group', {
      query: 'artist:"Say Now" AND releasegroup:"Say \\"Hi\\""',
      limit: 10
    });
  });

  it('retries with the undecorated title when the decorated one finds nothing', async () => {
    mockSearch
      .mockResolvedValueOnce({ 'release-groups': [] })
      .mockResolvedValueOnce({ 'release-groups': [rg('Blue', 'Joni')] });

    const match = await fetchMBReleaseGroupMatch('Blue (Deluxe Edition)', 'Joni');

    expect(mockSearch).toHaveBeenCalledTimes(2);
    expect(mockSearch.mock.calls[1][1].query).toBe('artist:"Joni" AND releasegroup:"Blue"');
    expect(match).toMatchObject({ title: 'Blue' });
  });

  it('does not search twice when there is nothing to strip', async () => {
    mockSearch.mockResolvedValue({ 'release-groups': [] });

    expect(await fetchMBReleaseGroupMatch('Antillia', 'Artificial Brain')).toBeNull();
    expect(mockSearch).toHaveBeenCalledTimes(1);
  });
});
