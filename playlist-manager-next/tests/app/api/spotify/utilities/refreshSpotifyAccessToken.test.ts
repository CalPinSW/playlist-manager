import { describe, it, expect, vi, beforeEach } from 'vitest';

// vi.hoisted ensures mock objects exist before the vi.mock factory runs.
const { mockFindUnique, mockUpdate, mockTransaction } = vi.hoisted(() => {
  const mockUpdate = vi.fn();
  const mockFindUnique = vi.fn();
  const mockTransaction = vi.fn(async (fn: (tx: unknown) => Promise<void>) => {
    await fn({ access_token: { update: mockUpdate } });
  });
  return { mockFindUnique, mockUpdate, mockTransaction };
});

vi.mock('../../../../../lib/prisma', () => ({
  default: {
    access_token: { findUnique: mockFindUnique },
    $transaction: mockTransaction
  }
}));

import { refreshSpotifyAccessToken } from '../../../../../app/api/spotify/utilities/refreshSpotifyAccessToken';

// ── Helpers ──────────────────────────────────────────────────────────────────
const makeUser = () => ({
  id: 'user-1',
  display_name: 'Test',
  image_url: '',
  uri: '',
  auth0_id: null
});

const stubFetch = (body: object, ok = true) => {
  global.fetch = vi.fn().mockResolvedValue({
    ok,
    statusText: ok ? 'OK' : 'Unauthorized',
    json: async () => body
  });
};

// ── Tests ────────────────────────────────────────────────────────────────────
describe('refreshSpotifyAccessToken', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID = 'client-id';
    process.env.SPOTIFY_SECRET = 'secret';
  });

  it('throws when no access_token row is found', async () => {
    mockFindUnique.mockResolvedValue(null);

    await expect(refreshSpotifyAccessToken(makeUser() as never)).rejects.toThrow('No refresh token found for user');
  });

  it('throws when access_token row exists but refresh_token is null', async () => {
    mockFindUnique.mockResolvedValue({ refresh_token: null });

    await expect(refreshSpotifyAccessToken(makeUser() as never)).rejects.toThrow('No refresh token found for user');
  });

  it('updates access_token and refresh_token atomically inside a transaction', async () => {
    mockFindUnique.mockResolvedValue({ refresh_token: 'old-refresh' });
    stubFetch({
      access_token: 'new-access',
      refresh_token: 'new-refresh',
      expires_in: 3600,
      token_type: 'Bearer'
    });

    await refreshSpotifyAccessToken(makeUser() as never);

    expect(mockTransaction).toHaveBeenCalledOnce();
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { user_id: 'user-1' },
      data: {
        access_token: 'new-access',
        refresh_token: 'new-refresh',
        expires_in: 3600,
        token_type: 'Bearer'
      }
    });
  });

  it('preserves existing refresh_token when Spotify does not rotate it', async () => {
    mockFindUnique.mockResolvedValue({ refresh_token: 'existing-refresh' });
    stubFetch({
      access_token: 'new-access',
      expires_in: 3600,
      token_type: 'Bearer'
      // no refresh_token in response
    });

    await refreshSpotifyAccessToken(makeUser() as never);

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ refresh_token: 'existing-refresh' })
      })
    );
  });

  it('throws when the Spotify endpoint returns a non-OK response', async () => {
    mockFindUnique.mockResolvedValue({ refresh_token: 'old-refresh' });
    stubFetch({}, false);

    await expect(refreshSpotifyAccessToken(makeUser() as never)).rejects.toThrow('Spotify token refresh failed');
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it('does not write to DB when the Spotify fetch throws (original token preserved)', async () => {
    mockFindUnique.mockResolvedValue({ refresh_token: 'precious-refresh' });
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    await expect(refreshSpotifyAccessToken(makeUser() as never)).rejects.toThrow('Network error');

    expect(mockTransaction).not.toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});
