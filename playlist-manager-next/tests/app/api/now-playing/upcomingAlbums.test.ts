import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: { playlistalbumrelationship: { findMany: vi.fn() } }
}));

vi.mock('../../../../lib/prisma', () => ({ default: mockPrisma }));

import { getUpcomingAlbums } from '../../../../app/api/now-playing/upcomingAlbums';

describe('getUpcomingAlbums', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns nothing without querying when the album has no index', async () => {
    expect(await getUpcomingAlbums('pl-1', null)).toEqual([]);
    expect(mockPrisma.playlistalbumrelationship.findMany).not.toHaveBeenCalled();
  });

  it('asks for a limited number of later albums in the same playlist, in order', async () => {
    mockPrisma.playlistalbumrelationship.findMany.mockResolvedValue([]);

    await getUpcomingAlbums('pl-1', 4);

    expect(mockPrisma.playlistalbumrelationship.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { playlist_id: 'pl-1', album_index: { gt: 4 } },
        orderBy: { album_index: 'asc' },
        take: 3
      })
    );
  });

  it('maps rows to the shape the app expects', async () => {
    mockPrisma.playlistalbumrelationship.findMany.mockResolvedValue([
      {
        album: {
          id: 'al-2',
          name: 'Next Album',
          image_url: 'https://img',
          uri: 'spotify:album:al-2',
          albumartistrelationship: [{ artist: { name: 'Artist A' } }, { artist: { name: 'Artist B' } }],
          tracks: [{ name: 'First', duration_ms: 1000 }]
        }
      }
    ]);

    expect(await getUpcomingAlbums('pl-1', 0)).toEqual([
      {
        albumId: 'al-2',
        albumName: 'Next Album',
        albumImageUrl: 'https://img',
        albumUri: 'spotify:album:al-2',
        artistNames: ['Artist A', 'Artist B'],
        tracks: [{ name: 'First', durationMs: 1000 }]
      }
    ]);
  });
});
