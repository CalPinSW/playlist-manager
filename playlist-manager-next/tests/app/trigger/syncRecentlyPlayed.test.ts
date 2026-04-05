import { describe, it, expect, vi, beforeEach } from 'vitest';

// vi.hoisted ensures these objects are initialised before vi.mock factories run.
const { mockPrisma, mockGetRecentlyPlayedTracks, mockTaskRun } = vi.hoisted(() => {
  const mockGetRecentlyPlayedTracks = vi.fn();
  // Captures the run function passed to schedules.task() so tests can call it directly.
  let capturedRun: (payload: unknown, ctx: unknown) => Promise<void>;
  const mockTaskRun = async (payload: unknown, ctx: unknown) => capturedRun(payload, ctx);
  const mockPrisma = {
    user: { findMany: vi.fn() },
    access_token: { findUnique: vi.fn() },
    playlist: { findMany: vi.fn() },
    sync_log: { findUnique: vi.fn(), upsert: vi.fn() },
    track: { findMany: vi.fn() },
    listening_progress: { findUnique: vi.fn(), upsert: vi.fn() }
  };
  return { mockPrisma, mockGetRecentlyPlayedTracks, mockTaskRun };
});

vi.mock('../../../lib/prisma', () => ({ default: mockPrisma }));

// Mock the Trigger.dev SDK: capture the run function from schedules.task()
// so tests can invoke it directly without needing a real Trigger.dev runtime.
vi.mock('@trigger.dev/sdk', () => ({
  schedules: {
    task: (config: { run: (payload: unknown, ctx: unknown) => Promise<void> }) => ({
      run: config.run
    })
  },
  logger: { log: vi.fn(), warn: vi.fn(), error: vi.fn() }
}));

vi.mock('@spotify/web-api-ts-sdk', () => ({
  SpotifyApi: {
    withAccessToken: vi.fn(() => ({
      player: { getRecentlyPlayedTracks: mockGetRecentlyPlayedTracks }
    }))
  }
}));

vi.mock('../../../app/api/spotify/utilities/refreshSpotifyAccessToken', () => ({
  refreshSpotifyAccessToken: vi.fn().mockResolvedValue(undefined)
}));

import { syncRecentlyPlayedTask } from '../../../app/trigger/syncRecentlyPlayed';

// ── Helpers ──────────────────────────────────────────────────────────────────
const makeUser = (id = 'user-1') => ({
  id,
  display_name: 'Test User',
  image_url: '',
  uri: '',
  auth0_id: null,
  access_token: { access_token: 'tok', refresh_token: 'ref', token_type: 'Bearer', expires_in: 3600 }
});

const makePlaylist = (id: string, name: string) => ({ id, name });

const makeTrack = (id: string, albumId: string, trackNumber: number, totalTracks: number, playlistId: string) => ({
  id,
  album_id: albumId,
  track_number: trackNumber,
  album: {
    id: albumId,
    total_tracks: totalTracks,
    playlistalbumrelationship: [{ playlist_id: playlistId }]
  }
});

const makeRecentItem = (trackId: string, playedAt: string) => ({
  track: { id: trackId },
  played_at: playedAt
});

// ── Tests ────────────────────────────────────────────────────────────────────
describe('syncRecentlyPlayedTask', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.user.findMany.mockResolvedValue([makeUser()]);
    mockPrisma.access_token.findUnique.mockResolvedValue({
      access_token: 'tok', refresh_token: 'ref', token_type: 'Bearer', expires_in: 3600
    });
    mockPrisma.sync_log.findUnique.mockResolvedValue(null);
    mockPrisma.sync_log.upsert.mockResolvedValue({});
    mockPrisma.listening_progress.findUnique.mockResolvedValue(null);
    mockPrisma.listening_progress.upsert.mockResolvedValue({});
  });

  it('does nothing when recently_played returns no items', async () => {
    mockPrisma.playlist.findMany.mockResolvedValue([makePlaylist('pl-1', 'New Albums 04/04/26')]);
    mockGetRecentlyPlayedTracks.mockResolvedValue({ items: [] });

    await syncRecentlyPlayedTask.run(undefined as never, undefined as never);

    expect(mockPrisma.listening_progress.upsert).not.toHaveBeenCalled();
  });

  it('upserts progress when a track from a New Albums playlist is played', async () => {
    mockPrisma.playlist.findMany.mockResolvedValue([makePlaylist('pl-1', 'New Albums 04/04/26')]);
    mockGetRecentlyPlayedTracks.mockResolvedValue({
      items: [makeRecentItem('track-1', '2026-04-04T10:00:00Z')]
    });
    mockPrisma.track.findMany.mockResolvedValue([
      makeTrack('track-1', 'album-1', 3, 12, 'pl-1')
    ]);

    await syncRecentlyPlayedTask.run(undefined as never, undefined as never);

    expect(mockPrisma.listening_progress.upsert).toHaveBeenCalledOnce();
    const call = mockPrisma.listening_progress.upsert.mock.calls[0][0];
    expect(call.create.last_track_index).toBe(2); // track_number 3 → 0-based index 2
    expect(call.create.album_id).toBe('album-1');
    expect(call.create.playlist_id).toBe('pl-1');
    expect(call.create.source).toBe('recently_played');
  });

  it('silently skips tracks not in any New Albums playlist', async () => {
    mockPrisma.playlist.findMany.mockResolvedValue([makePlaylist('pl-1', 'New Albums 04/04/26')]);
    mockGetRecentlyPlayedTracks.mockResolvedValue({
      items: [makeRecentItem('track-orphan', '2026-04-04T10:00:00Z')]
    });
    mockPrisma.track.findMany.mockResolvedValue([
      { id: 'track-orphan', album_id: 'album-x', track_number: 1,
        album: { id: 'album-x', total_tracks: 5, playlistalbumrelationship: [] } }
    ]);

    await syncRecentlyPlayedTask.run(undefined as never, undefined as never);

    expect(mockPrisma.listening_progress.upsert).not.toHaveBeenCalled();
  });

  it('does not regress progress when new track index is lower than stored', async () => {
    mockPrisma.playlist.findMany.mockResolvedValue([makePlaylist('pl-1', 'New Albums 04/04/26')]);
    mockGetRecentlyPlayedTracks.mockResolvedValue({
      items: [makeRecentItem('track-1', '2026-04-04T10:00:00Z')]
    });
    mockPrisma.track.findMany.mockResolvedValue([
      makeTrack('track-1', 'album-1', 6, 12, 'pl-1') // index 5
    ]);
    mockPrisma.listening_progress.findUnique.mockResolvedValue({ last_track_index: 7 });

    await syncRecentlyPlayedTask.run(undefined as never, undefined as never);

    expect(mockPrisma.listening_progress.upsert).not.toHaveBeenCalled();
  });

  it('advances progress when new track index is higher than stored', async () => {
    mockPrisma.playlist.findMany.mockResolvedValue([makePlaylist('pl-1', 'New Albums 04/04/26')]);
    mockGetRecentlyPlayedTracks.mockResolvedValue({
      items: [makeRecentItem('track-1', '2026-04-04T10:00:00Z')]
    });
    mockPrisma.track.findMany.mockResolvedValue([
      makeTrack('track-1', 'album-1', 8, 12, 'pl-1') // index 7
    ]);
    mockPrisma.listening_progress.findUnique.mockResolvedValue({ last_track_index: 5 });

    await syncRecentlyPlayedTask.run(undefined as never, undefined as never);

    expect(mockPrisma.listening_progress.upsert).toHaveBeenCalledOnce();
    const call = mockPrisma.listening_progress.upsert.mock.calls[0][0];
    expect(call.update.last_track_index).toBe(7);
  });

  it('stores the most recent played_at as the new cursor on first run', async () => {
    mockPrisma.playlist.findMany.mockResolvedValue([makePlaylist('pl-1', 'New Albums 04/04/26')]);
    mockGetRecentlyPlayedTracks.mockResolvedValue({
      items: [
        makeRecentItem('track-1', '2026-04-04T10:05:00Z'), // most recent (index 0)
        makeRecentItem('track-2', '2026-04-04T10:00:00Z')
      ]
    });
    mockPrisma.track.findMany.mockResolvedValue([
      makeTrack('track-1', 'album-1', 2, 12, 'pl-1'),
      makeTrack('track-2', 'album-1', 1, 12, 'pl-1')
    ]);

    await syncRecentlyPlayedTask.run(undefined as never, undefined as never);

    const upsertCall = mockPrisma.sync_log.upsert.mock.calls[0][0];
    expect(upsertCall.create.last_played_at).toEqual(new Date('2026-04-04T10:05:00Z'));
  });

  it('passes the stored cursor as the after param on subsequent runs', async () => {
    const storedCursor = new Date('2026-04-04T09:00:00Z');
    mockPrisma.sync_log.findUnique.mockResolvedValue({ last_played_at: storedCursor });
    mockPrisma.playlist.findMany.mockResolvedValue([makePlaylist('pl-1', 'New Albums 04/04/26')]);
    mockGetRecentlyPlayedTracks.mockResolvedValue({ items: [] });

    await syncRecentlyPlayedTask.run(undefined as never, undefined as never);

    expect(mockGetRecentlyPlayedTracks).toHaveBeenCalledWith(
      50,
      { type: 'after', timestamp: storedCursor.getTime() }
    );
  });

  it('skips users with no New Albums playlists without error', async () => {
    mockPrisma.playlist.findMany.mockResolvedValue([
      makePlaylist('pl-1', 'Best Albums 04/04/26')
    ]);

    await expect(
      syncRecentlyPlayedTask.run(undefined as never, undefined as never)
    ).resolves.not.toThrow();

    expect(mockGetRecentlyPlayedTracks).not.toHaveBeenCalled();
  });

  it('skips a user with no refresh token without throwing', async () => {
    mockPrisma.user.findMany.mockResolvedValue([
      { ...makeUser(), access_token: { access_token: null, refresh_token: null } }
    ]);

    await expect(
      syncRecentlyPlayedTask.run(undefined as never, undefined as never)
    ).resolves.not.toThrow();

    expect(mockGetRecentlyPlayedTracks).not.toHaveBeenCalled();
  });
});
