import { describe, it, expect, vi, beforeEach } from 'vitest';

const {
  mockPrisma,
  mockGetUserFromRequest,
  mockSyncForUser,
  mockAfter,
  mockRefreshSpotifyPlaylists
} = vi.hoisted(() => {
  const mockGetUserFromRequest = vi.fn();
  const mockSyncForUser = vi.fn().mockResolvedValue(undefined);
  const mockRefreshSpotifyPlaylists = vi.fn().mockResolvedValue(undefined);
  // Run the scheduled callback immediately so we can assert on its effects.
  const mockAfter = vi.fn((cb: () => unknown) => cb());
  const mockPrisma = {
    user: { findUnique: vi.fn() },
    sync_log: { findUnique: vi.fn(), upsert: vi.fn() },
    access_token: { findUnique: vi.fn() }
  };
  return { mockPrisma, mockGetUserFromRequest, mockSyncForUser, mockAfter, mockRefreshSpotifyPlaylists };
});

vi.mock('../../../../lib/prisma', () => ({ default: mockPrisma }));
vi.mock('next/server', () => ({ after: mockAfter }));
vi.mock('../../../../app/api/user/handler', () => ({
  getUserFromRequest: mockGetUserFromRequest
}));
vi.mock('../../../../app/trigger/syncRecentlyPlayed', () => ({
  syncForUser: mockSyncForUser,
  syncRecentlyPlayedTask: {}
}));
vi.mock('../../../../app/api/playlists/refresh/handler', () => ({
  refreshSpotifyPlaylists: mockRefreshSpotifyPlaylists
}));

import { syncHistory, PLAYLIST_DISCOVERY_THROTTLE_HOURS } from '../../../../app/api/sync-history/handler';

// ── Helpers ──────────────────────────────────────────────────────────────────
const makeUser = () => ({ id: 'user-1', display_name: 'Test', image_url: '', uri: '', auth0_id: null });
const makeUserWithToken = () => ({
  ...makeUser(),
  access_token: { access_token: 'tok', refresh_token: 'ref', token_type: 'Bearer', expires_in: 3600 }
});
const hoursAgo = (h: number) => new Date(Date.now() - h * 60 * 60 * 1000);

// ── Tests ────────────────────────────────────────────────────────────────────
describe('syncHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAfter.mockImplementation((cb: () => unknown) => cb());
    mockSyncForUser.mockResolvedValue(undefined);
    mockRefreshSpotifyPlaylists.mockResolvedValue(undefined);
    mockGetUserFromRequest.mockResolvedValue(makeUser());
    mockPrisma.user.findUnique.mockResolvedValue(makeUserWithToken());
    mockPrisma.sync_log.findUnique.mockResolvedValue(null);
    mockPrisma.sync_log.upsert.mockResolvedValue({});
    mockPrisma.access_token.findUnique.mockResolvedValue({
      access_token: 'tok',
      token_type: 'Bearer',
      expires_in: 3600
    });
    process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID = 'client-id';
  });

  it('calls syncForUser and returns synced:true', async () => {
    const result = await syncHistory({} as never);

    expect(mockSyncForUser).toHaveBeenCalledOnce();
    expect(result.synced).toBe(true);
    expect(result.message).toBe('Sync complete');
  });

  it('passes the full user (with access_token) to syncForUser', async () => {
    const userWithToken = makeUserWithToken();
    mockPrisma.user.findUnique.mockResolvedValue(userWithToken);

    await syncHistory({} as never);

    expect(mockSyncForUser).toHaveBeenCalledWith(userWithToken);
  });

  it('throws when user is not found in DB', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    await expect(syncHistory({} as never)).rejects.toThrow('User not found');
    expect(mockSyncForUser).not.toHaveBeenCalled();
  });

  it('propagates errors from syncForUser', async () => {
    mockSyncForUser.mockRejectedValue(new Error('Spotify 401'));

    await expect(syncHistory({} as never)).rejects.toThrow('Spotify 401');
  });

  describe('background playlist discovery', () => {
    it('runs discovery when there is no previous discovery timestamp', async () => {
      mockPrisma.sync_log.findUnique.mockResolvedValue(null);

      await syncHistory({} as never);

      expect(mockPrisma.sync_log.upsert).toHaveBeenCalledOnce();
      expect(mockRefreshSpotifyPlaylists).toHaveBeenCalledWith(expect.anything(), 'user-1');
    });

    it('runs discovery when the last run is older than the throttle window', async () => {
      mockPrisma.sync_log.findUnique.mockResolvedValue({
        last_playlist_discovery_at: hoursAgo(PLAYLIST_DISCOVERY_THROTTLE_HOURS + 1)
      });

      await syncHistory({} as never);

      expect(mockRefreshSpotifyPlaylists).toHaveBeenCalledOnce();
    });

    it('skips discovery when the last run is within the throttle window', async () => {
      mockPrisma.sync_log.findUnique.mockResolvedValue({
        last_playlist_discovery_at: hoursAgo(1)
      });

      await syncHistory({} as never);

      expect(mockPrisma.sync_log.upsert).not.toHaveBeenCalled();
      expect(mockAfter).not.toHaveBeenCalled();
      expect(mockRefreshSpotifyPlaylists).not.toHaveBeenCalled();
    });

    it('stamps the discovery cursor before scheduling the work', async () => {
      await syncHistory({} as never);

      const upsertArg = mockPrisma.sync_log.upsert.mock.calls[0][0];
      expect(upsertArg.where).toEqual({ user_id: 'user-1' });
      expect(upsertArg.update.last_playlist_discovery_at).toBeInstanceOf(Date);
    });

    it('does not fail the request when background discovery throws', async () => {
      mockRefreshSpotifyPlaylists.mockRejectedValue(new Error('Spotify down'));

      const result = await syncHistory({} as never);

      expect(result.synced).toBe(true);
    });

    it('skips the Spotify call when no access token is stored', async () => {
      mockPrisma.access_token.findUnique.mockResolvedValue(null);

      await syncHistory({} as never);

      expect(mockRefreshSpotifyPlaylists).not.toHaveBeenCalled();
    });
  });
});
