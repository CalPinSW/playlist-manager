import { describe, it, expect, vi, beforeEach } from 'vitest';

// vi.hoisted ensures these objects are initialised before vi.mock factories run.
const { mockPrisma, mockGetRecentlyPlayedTracks, mockGetPlaylist, mockAddPlaylistToDb, makeMockTask } = vi.hoisted(
  () => {
    const mockGetRecentlyPlayedTracks = vi.fn();
    const mockGetPlaylist = vi.fn();
    const mockAddPlaylistToDb = vi.fn().mockResolvedValue(undefined);
    const mockPrisma = {
      user: { findMany: vi.fn() },
      access_token: { findUnique: vi.fn() },
      playlist: { findMany: vi.fn() },
      sync_log: { findUnique: vi.fn(), upsert: vi.fn() },
      track: { findMany: vi.fn() },
      listening_progress: { findUnique: vi.fn(), upsert: vi.fn() }
    };
    const makeMockTask = (config: { id?: string; run: (payload: unknown, ctx: unknown) => Promise<void> }) => ({
      // Expose run for testing (not part of real v4 API, but needed for unit tests)
      run: config.run,
      id: config.id || 'test-task',
      trigger: vi.fn(),
      triggerAndWait: vi.fn()
    });
    return { mockPrisma, mockGetRecentlyPlayedTracks, mockGetPlaylist, mockAddPlaylistToDb, makeMockTask };
  }
);

vi.mock('../../../lib/prisma', () => ({ default: mockPrisma }));

// Mock the Trigger.dev SDK: capture the run function from schedules.task()/
// task() so tests can invoke it directly without needing a real Trigger.dev
// runtime. syncRecentlyPlayed.ts imports syncPlaylistTask from
// ./syncPlaylist, which is defined via the plain task() export (not
// schedules.task()) — both need mocking or that import throws.
vi.mock('@trigger.dev/sdk', () => ({
  schedules: { task: makeMockTask },
  task: makeMockTask,
  logger: { log: vi.fn(), warn: vi.fn(), error: vi.fn() }
}));

vi.mock('@spotify/web-api-ts-sdk', () => ({
  SpotifyApi: {
    withAccessToken: vi.fn(() => ({
      player: { getRecentlyPlayedTracks: mockGetRecentlyPlayedTracks },
      playlists: { getPlaylist: mockGetPlaylist }
    }))
  }
}));

vi.mock('../../../app/api/spotify/utilities/refreshSpotifyAccessToken', () => ({
  refreshSpotifyAccessToken: vi.fn().mockResolvedValue(undefined)
}));

vi.mock('../../../app/api/playlists/[playlistId]/refresh/handler', () => ({
  addPlaylistToDb: mockAddPlaylistToDb
}));

import { syncRecentlyPlayedTask } from '../../../app/trigger/syncRecentlyPlayed';

// Type assertion for testing: the mock adds a run method that doesn't exist in the real v4 API
const testTask = syncRecentlyPlayedTask as typeof syncRecentlyPlayedTask & {
  run: (payload: unknown, ctx: unknown) => Promise<void>;
};

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

const makeRecentItem = (trackId: string, playedAt: string, contextPlaylistId?: string) => ({
  track: { id: trackId },
  played_at: playedAt,
  context: contextPlaylistId ? { type: 'playlist', uri: `spotify:playlist:${contextPlaylistId}` } : null
});

// ── Tests ────────────────────────────────────────────────────────────────────
describe('syncRecentlyPlayedTask', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // syncForUser throws (swallowed by the per-user try/catch in run(), so
    // failures here show up as silently-unmet assertions, not a visible
    // error) if this isn't set — matches the real deployed environment.
    process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID = 'test-client-id';
    mockPrisma.user.findMany.mockResolvedValue([makeUser()]);
    mockPrisma.access_token.findUnique.mockResolvedValue({
      access_token: 'tok',
      refresh_token: 'ref',
      token_type: 'Bearer',
      expires_in: 3600
    });
    mockPrisma.sync_log.findUnique.mockResolvedValue(null);
    mockPrisma.sync_log.upsert.mockResolvedValue({});
    mockPrisma.listening_progress.findUnique.mockResolvedValue(null);
    mockPrisma.listening_progress.upsert.mockResolvedValue({});
    mockPrisma.track.findMany.mockResolvedValue([]);
    mockAddPlaylistToDb.mockResolvedValue(undefined);
  });

  it('does nothing when recently_played returns no items', async () => {
    mockPrisma.playlist.findMany.mockResolvedValue([makePlaylist('pl-1', 'New Albums 04/04/26')]);
    mockGetRecentlyPlayedTracks.mockResolvedValue({ items: [] });

    await testTask.run(undefined as never, undefined as never);

    expect(mockPrisma.listening_progress.upsert).not.toHaveBeenCalled();
  });

  it('upserts progress when a track from a New Albums playlist is played', async () => {
    mockPrisma.playlist.findMany.mockResolvedValue([makePlaylist('pl-1', 'New Albums 04/04/26')]);
    mockGetRecentlyPlayedTracks.mockResolvedValue({
      items: [makeRecentItem('track-1', '2026-04-04T10:00:00Z')]
    });
    mockPrisma.track.findMany.mockResolvedValue([makeTrack('track-1', 'album-1', 3, 12, 'pl-1')]);

    await testTask.run(undefined as never, undefined as never);

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
      {
        id: 'track-orphan',
        album_id: 'album-x',
        track_number: 1,
        album: { id: 'album-x', total_tracks: 5, playlistalbumrelationship: [] }
      }
    ]);

    await testTask.run(undefined as never, undefined as never);

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

    await testTask.run(undefined as never, undefined as never);

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

    await testTask.run(undefined as never, undefined as never);

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

    await testTask.run(undefined as never, undefined as never);

    const upsertCall = mockPrisma.sync_log.upsert.mock.calls[0][0];
    expect(upsertCall.create.last_played_at).toEqual(new Date('2026-04-04T10:05:00Z'));
  });

  it('passes the stored cursor as the after param on subsequent runs', async () => {
    const storedCursor = new Date('2026-04-04T09:00:00Z');
    mockPrisma.sync_log.findUnique.mockResolvedValue({ last_played_at: storedCursor });
    mockPrisma.playlist.findMany.mockResolvedValue([makePlaylist('pl-1', 'New Albums 04/04/26')]);
    mockGetRecentlyPlayedTracks.mockResolvedValue({ items: [] });

    await testTask.run(undefined as never, undefined as never);

    expect(mockGetRecentlyPlayedTracks).toHaveBeenCalledWith(50, { type: 'after', timestamp: storedCursor.getTime() });
  });

  it('skips users with no New Albums playlists without error', async () => {
    mockPrisma.playlist.findMany.mockResolvedValue([makePlaylist('pl-1', 'Best Albums 04/04/26')]);

    await expect(testTask.run(undefined as never, undefined as never)).resolves.not.toThrow();

    expect(mockGetRecentlyPlayedTracks).not.toHaveBeenCalled();
  });

  it('skips a user with no refresh token without throwing', async () => {
    mockPrisma.user.findMany.mockResolvedValue([
      { ...makeUser(), access_token: { access_token: null, refresh_token: null } }
    ]);

    await expect(testTask.run(undefined as never, undefined as never)).resolves.not.toThrow();

    expect(mockGetRecentlyPlayedTracks).not.toHaveBeenCalled();
  });

  describe('discovering played-from playlists mid-sync', () => {
    it('adds an unknown New Albums playlist from the play context and records its progress this run', async () => {
      mockPrisma.playlist.findMany.mockResolvedValue([makePlaylist('pl-known', 'New Albums 01/01/26')]);
      mockGetRecentlyPlayedTracks.mockResolvedValue({
        items: [makeRecentItem('track-9', '2026-08-20T10:00:00Z', 'pl-new')]
      });
      mockGetPlaylist.mockResolvedValue({ id: 'pl-new', name: 'New Albums 20/08/26' });
      mockPrisma.track.findMany.mockResolvedValue([makeTrack('track-9', 'album-9', 4, 10, 'pl-new')]);

      await testTask.run(undefined as never, undefined as never);

      expect(mockGetPlaylist).toHaveBeenCalledWith('pl-new');
      expect(mockAddPlaylistToDb).toHaveBeenCalledWith(expect.anything(), 'user-1', {
        id: 'pl-new',
        name: 'New Albums 20/08/26'
      });
      expect(mockPrisma.listening_progress.upsert).toHaveBeenCalledOnce();
      expect(mockPrisma.listening_progress.upsert.mock.calls[0][0].create.playlist_id).toBe('pl-new');
    });

    it('ignores an unknown played-from playlist whose name is not the New Albums format', async () => {
      mockPrisma.playlist.findMany.mockResolvedValue([makePlaylist('pl-known', 'New Albums 01/01/26')]);
      mockGetRecentlyPlayedTracks.mockResolvedValue({
        items: [makeRecentItem('track-9', '2026-08-20T10:00:00Z', 'pl-editorial')]
      });
      mockGetPlaylist.mockResolvedValue({ id: 'pl-editorial', name: 'Discover Weekly' });

      await testTask.run(undefined as never, undefined as never);

      expect(mockAddPlaylistToDb).not.toHaveBeenCalled();
    });

    it('does not look up playlists already in the DB', async () => {
      mockPrisma.playlist.findMany.mockResolvedValue([makePlaylist('pl-1', 'New Albums 04/04/26')]);
      mockGetRecentlyPlayedTracks.mockResolvedValue({
        items: [makeRecentItem('track-1', '2026-04-04T10:00:00Z', 'pl-1')]
      });
      mockPrisma.track.findMany.mockResolvedValue([makeTrack('track-1', 'album-1', 2, 12, 'pl-1')]);

      await testTask.run(undefined as never, undefined as never);

      expect(mockGetPlaylist).not.toHaveBeenCalled();
    });

    it('ignores plays with no playlist context', async () => {
      mockPrisma.playlist.findMany.mockResolvedValue([makePlaylist('pl-1', 'New Albums 04/04/26')]);
      mockGetRecentlyPlayedTracks.mockResolvedValue({
        items: [makeRecentItem('track-1', '2026-04-04T10:00:00Z')]
      });
      mockPrisma.track.findMany.mockResolvedValue([makeTrack('track-1', 'album-1', 2, 12, 'pl-1')]);

      await testTask.run(undefined as never, undefined as never);

      expect(mockGetPlaylist).not.toHaveBeenCalled();
    });

    it('continues (and still advances the cursor) when a context lookup fails', async () => {
      mockPrisma.playlist.findMany.mockResolvedValue([makePlaylist('pl-known', 'New Albums 01/01/26')]);
      mockGetRecentlyPlayedTracks.mockResolvedValue({
        items: [makeRecentItem('track-1', '2026-04-04T10:00:00Z', 'pl-broken')]
      });
      mockGetPlaylist.mockRejectedValue(new Error('Spotify 404'));

      await expect(testTask.run(undefined as never, undefined as never)).resolves.not.toThrow();

      expect(mockAddPlaylistToDb).not.toHaveBeenCalled();
      expect(mockPrisma.sync_log.upsert).toHaveBeenCalled();
    });

    it('looks up at most MAX_DISCOVERY_LOOKUPS unknown played-from playlists per run', async () => {
      mockPrisma.playlist.findMany.mockResolvedValue([makePlaylist('pl-known', 'New Albums 01/01/26')]);
      mockGetRecentlyPlayedTracks.mockResolvedValue({
        items: Array.from({ length: 8 }, (_, i) =>
          makeRecentItem(`track-${i}`, `2026-08-20T10:0${i}:00Z`, `pl-unknown-${i}`)
        )
      });
      mockGetPlaylist.mockResolvedValue({ id: 'x', name: 'Not Matching' });

      await testTask.run(undefined as never, undefined as never);

      expect(mockGetPlaylist).toHaveBeenCalledTimes(5);
    });
  });
});
