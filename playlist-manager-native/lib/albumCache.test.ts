jest.mock('./api', () => ({ fetchAlbumDetail: jest.fn() }));

import { fetchAlbumDetail, AlbumDetail } from './api';

const mockFetch = fetchAlbumDetail as jest.MockedFunction<typeof fetchAlbumDetail>;

function album(id: string, rating: number | null = null): AlbumDetail {
  return {
    id, name: id, imageUrl: '', uri: '', releaseDate: '', totalTracks: 1,
    artists: [], genres: [], tracks: [], onPlaylists: [], progress: null, rating,
  };
}

// The cache is module state, so give each test a fresh copy.
let cache: typeof import('./albumCache');
beforeEach(() => {
  jest.useRealTimers();
  mockFetch.mockReset();
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  jest.isolateModules(() => { cache = require('./albumCache'); });
});

describe('albumCache', () => {
  it('shares one request between a prefetch and a later read', async () => {
    mockFetch.mockResolvedValue(album('a'));
    cache.prefetchAlbumDetail('a');
    await expect(cache.getAlbumDetail('a')).resolves.toEqual(album('a'));
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('exposes loaded albums synchronously via peek', async () => {
    mockFetch.mockResolvedValue(album('a'));
    expect(cache.peekAlbumDetail('a')).toBeNull();
    await cache.getAlbumDetail('a');
    expect(cache.peekAlbumDetail('a')).toEqual(album('a'));
  });

  it('does not cache failures, so a retry refetches', async () => {
    mockFetch.mockRejectedValueOnce(new Error('network')).mockResolvedValueOnce(album('a'));
    await expect(cache.getAlbumDetail('a')).rejects.toThrow('network');
    await expect(cache.getAlbumDetail('a')).resolves.toEqual(album('a'));
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('refetches once an entry is older than the TTL', async () => {
    jest.useFakeTimers({ now: 0 });
    mockFetch.mockResolvedValue(album('a'));
    await cache.getAlbumDetail('a');
    jest.setSystemTime(6 * 60 * 1000);
    expect(cache.peekAlbumDetail('a')).toBeNull();
    await cache.getAlbumDetail('a');
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('applies local patches so a revisited album shows the new rating', async () => {
    mockFetch.mockResolvedValue(album('a', 4));
    await cache.getAlbumDetail('a');
    cache.updateCachedAlbum('a', { rating: 9 });
    expect(cache.peekAlbumDetail('a')?.rating).toBe(9);
    await expect(cache.getAlbumDetail('a')).resolves.toMatchObject({ rating: 9 });
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});
