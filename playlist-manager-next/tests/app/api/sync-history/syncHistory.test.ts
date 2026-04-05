import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma, mockGetUserFromRequest, mockSyncForUser } = vi.hoisted(() => {
  const mockGetUserFromRequest = vi.fn();
  const mockSyncForUser = vi.fn().mockResolvedValue(undefined);
  const mockPrisma = {
    user: { findUnique: vi.fn() }
  };
  return { mockPrisma, mockGetUserFromRequest, mockSyncForUser };
});

vi.mock('../../../../lib/prisma', () => ({ default: mockPrisma }));
vi.mock('../../../../app/api/user/handler', () => ({
  getUserFromRequest: mockGetUserFromRequest
}));
vi.mock('../../../../app/trigger/syncRecentlyPlayed', () => ({
  syncForUser: mockSyncForUser,
  syncRecentlyPlayedTask: {}
}));

import { syncHistory } from '../../../../app/api/sync-history/handler';

// ── Helpers ──────────────────────────────────────────────────────────────────
const makeUser = () => ({ id: 'user-1', display_name: 'Test', image_url: '', uri: '', auth0_id: null });
const makeUserWithToken = () => ({
  ...makeUser(),
  access_token: { access_token: 'tok', refresh_token: 'ref', token_type: 'Bearer', expires_in: 3600 }
});

// ── Tests ────────────────────────────────────────────────────────────────────
describe('syncHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUserFromRequest.mockResolvedValue(makeUser());
    mockPrisma.user.findUnique.mockResolvedValue(makeUserWithToken());
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
});
