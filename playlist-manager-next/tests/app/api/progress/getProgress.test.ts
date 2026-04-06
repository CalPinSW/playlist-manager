import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma, mockGetUserFromRequest } = vi.hoisted(() => {
  const mockGetUserFromRequest = vi.fn();
  const mockPrisma = {
    listening_progress: { findMany: vi.fn() }
  };
  return { mockPrisma, mockGetUserFromRequest };
});

vi.mock('../../../../lib/prisma', () => ({ default: mockPrisma }));
vi.mock('../../../../app/api/user/handler', () => ({
  getUserFromRequest: mockGetUserFromRequest
}));

import { getProgress } from '../../../../app/api/progress/handler';

// ── Helpers ──────────────────────────────────────────────────────────────────
const makeUser = () => ({ id: 'user-1', display_name: 'Test', image_url: '', uri: '', auth0_id: null });

const makeRow = (
  albumId: string,
  albumName: string,
  trackIndex: number,
  totalTracks: number,
  playlistName: string,
  listenedAt: Date
) => ({
  album_id: albumId,
  playlist_id: 'pl-1',
  last_track_index: trackIndex,
  total_tracks: totalTracks,
  listened_at: listenedAt,
  album: { id: albumId, name: albumName, image_url: 'https://img', total_tracks: totalTracks },
  playlist: { id: 'pl-1', name: playlistName }
});

// ── Tests ────────────────────────────────────────────────────────────────────
describe('getProgress', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUserFromRequest.mockResolvedValue(makeUser());
  });

  it('returns empty array when no progress rows exist', async () => {
    mockPrisma.listening_progress.findMany.mockResolvedValue([]);

    const result = await getProgress({} as never);

    expect(result).toEqual([]);
  });

  it('returns progress entries for New Albums playlists', async () => {
    const listenedAt = new Date('2026-04-04T10:00:00Z');
    mockPrisma.listening_progress.findMany.mockResolvedValue([
      makeRow('album-1', 'Some Album', 5, 12, 'New Albums 04/04/26', listenedAt)
    ]);

    const result = await getProgress({} as never);

    expect(result).toHaveLength(1);
    expect(result[0].albumId).toBe('album-1');
    expect(result[0].lastTrackIndex).toBe(5);
    expect(result[0].totalTracks).toBe(12);
    expect(result[0].progressPercent).toBe(50); // (5+1)/12 = 50%
    expect(result[0].listenedAt).toBe(listenedAt.toISOString());
  });

  it('filters out non-New Albums playlists', async () => {
    const listenedAt = new Date('2026-04-04T10:00:00Z');
    mockPrisma.listening_progress.findMany.mockResolvedValue([
      makeRow('album-1', 'Album A', 3, 10, 'New Albums 04/04/26', listenedAt),
      makeRow('album-2', 'Album B', 2, 8, 'Best Albums 04/04/26', listenedAt) // filtered out
    ]);

    const result = await getProgress({} as never);

    expect(result).toHaveLength(1);
    expect(result[0].albumId).toBe('album-1');
  });

  it('calculates progressPercent correctly for first track (index 0)', async () => {
    mockPrisma.listening_progress.findMany.mockResolvedValue([
      makeRow('album-1', 'Album', 0, 10, 'New Albums 01/01/25', new Date())
    ]);

    const [entry] = await getProgress({} as never);

    expect(entry.progressPercent).toBe(10); // (0+1)/10 = 10%
  });

  it('calculates progressPercent as 100 for last track', async () => {
    mockPrisma.listening_progress.findMany.mockResolvedValue([
      makeRow('album-1', 'Album', 11, 12, 'New Albums 01/01/25', new Date())
    ]);

    const [entry] = await getProgress({} as never);

    expect(entry.progressPercent).toBe(100); // (11+1)/12 = 100%
  });
});
