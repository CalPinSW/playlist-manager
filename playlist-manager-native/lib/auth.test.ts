// A minimal in-memory fake of the Keychain, keyed by string like the real
// SecureStore. Using a real backing store (rather than per-key branching
// mocks) lets these tests exercise the actual read-modify-write and
// migration logic in auth.ts instead of asserting against mock call args.
let mockTokenStore = new Map<string, string>();

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn((key: string) => Promise.resolve(mockTokenStore.get(key) ?? null)),
  setItemAsync: jest.fn((key: string, value: string) => {
    mockTokenStore.set(key, value);
    return Promise.resolve();
  }),
  deleteItemAsync: jest.fn((key: string) => {
    mockTokenStore.delete(key);
    return Promise.resolve();
  }),
}));

// auth.ts calls these at module scope (redirect URI construction, auth-session
// cleanup); they need a real native/Constants context that Jest doesn't have,
// but this file only exercises the token-refresh logic, not the PKCE flow.
jest.mock('expo-auth-session', () => ({
  makeRedirectUri: jest.fn(() => 'playlistmanager://callback'),
  ResponseType: { Code: 'code' },
}));
jest.mock('expo-web-browser', () => ({
  maybeCompleteAuthSession: jest.fn(),
}));

import {
  isTokenExpired,
  saveTokens,
  getStoredTokens,
  refreshAccessToken,
  getValidAccessToken,
  ReauthRequiredError,
} from './auth';

function jsonResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: `status ${status}`,
    json: async () => body,
  } as Response;
}

beforeEach(() => {
  mockTokenStore = new Map();
  jest.restoreAllMocks();
});

describe('isTokenExpired', () => {
  it('treats a null expiry as expired', () => {
    expect(isTokenExpired(null)).toBe(true);
  });

  it('treats a future expiry as not expired', () => {
    expect(isTokenExpired(Date.now() + 60_000)).toBe(false);
  });

  it('treats an expiry within the 60s safety margin as expired', () => {
    expect(isTokenExpired(Date.now() + 30_000)).toBe(true);
  });

  it('treats a past expiry as expired', () => {
    expect(isTokenExpired(Date.now() - 1000)).toBe(true);
  });
});

describe('saveTokens / getStoredTokens', () => {
  it('round-trips a full token set through a single storage key', async () => {
    await saveTokens({ access_token: 'at-1', refresh_token: 'rt-1', expires_in: 3600 });

    expect(mockTokenStore.size).toBe(1);
    expect(mockTokenStore.has('auth0_tokens')).toBe(true);

    const stored = await getStoredTokens();
    expect(stored?.accessToken).toBe('at-1');
    expect(stored?.refreshToken).toBe('rt-1');
  });

  it('preserves the existing refresh token when a save omits one', async () => {
    // Mirrors a rotation-off refresh response, which only returns a new
    // access_token — the fix this test locks in is that this must not wipe
    // the still-valid refresh token, which would brick the next refresh.
    await saveTokens({ access_token: 'at-1', refresh_token: 'rt-1', expires_in: 3600 });
    await saveTokens({ access_token: 'at-2', expires_in: 3600 });

    const stored = await getStoredTokens();
    expect(stored?.accessToken).toBe('at-2');
    expect(stored?.refreshToken).toBe('rt-1');
  });

  it('migrates tokens saved under the old per-field keys and removes them', async () => {
    mockTokenStore.set('auth0_access_token', 'legacy-at');
    mockTokenStore.set('auth0_refresh_token', 'legacy-rt');
    mockTokenStore.set('auth0_expires_at', String(Date.now() + 60_000));

    const stored = await getStoredTokens();

    expect(stored?.accessToken).toBe('legacy-at');
    expect(stored?.refreshToken).toBe('legacy-rt');
    // Migrated into the new single key...
    expect(mockTokenStore.has('auth0_tokens')).toBe(true);
    // ...and the old keys are cleaned up so this only happens once.
    expect(mockTokenStore.has('auth0_access_token')).toBe(false);
    expect(mockTokenStore.has('auth0_refresh_token')).toBe(false);
    expect(mockTokenStore.has('auth0_expires_at')).toBe(false);
  });

  it('returns null when nothing is stored under either scheme', async () => {
    await expect(getStoredTokens()).resolves.toBeNull();
  });
});

describe('refreshAccessToken', () => {
  it('throws ReauthRequiredError when Auth0 rejects the token (401)', async () => {
    global.fetch = jest.fn().mockResolvedValue(jsonResponse(401, { error: 'invalid_grant' }));

    await expect(refreshAccessToken('stale-token')).rejects.toBeInstanceOf(ReauthRequiredError);
  });

  it('throws ReauthRequiredError when Auth0 rejects the token (400)', async () => {
    global.fetch = jest.fn().mockResolvedValue(jsonResponse(400, { error: 'invalid_grant' }));

    await expect(refreshAccessToken('stale-token')).rejects.toBeInstanceOf(ReauthRequiredError);
  });

  it('throws a plain Error (not ReauthRequiredError) on a transient 429', async () => {
    global.fetch = jest.fn().mockResolvedValue(jsonResponse(429, { error: 'rate_limited' }));

    await expect(refreshAccessToken('valid-but-rate-limited')).rejects.not.toBeInstanceOf(ReauthRequiredError);
  });

  it('throws a plain Error (not ReauthRequiredError) on a transient 503', async () => {
    global.fetch = jest.fn().mockResolvedValue(jsonResponse(503, { error: 'outage' }));

    await expect(refreshAccessToken('valid-during-outage')).rejects.not.toBeInstanceOf(ReauthRequiredError);
  });

  it('saves and returns the new access token on success', async () => {
    global.fetch = jest.fn().mockResolvedValue(
      jsonResponse(200, { access_token: 'new-access-token', expires_in: 3600, refresh_token: 'new-refresh-token' })
    );

    const token = await refreshAccessToken('old-refresh-token');

    expect(token).toBe('new-access-token');
    const stored = await getStoredTokens();
    expect(stored?.accessToken).toBe('new-access-token');
    expect(stored?.refreshToken).toBe('new-refresh-token');
  });

  it('dedupes concurrent calls into a single request', async () => {
    const fetchMock = jest.fn().mockResolvedValue(
      jsonResponse(200, { access_token: 'shared-token', expires_in: 3600 })
    );
    global.fetch = fetchMock;

    const [a, b] = await Promise.all([
      refreshAccessToken('same-refresh-token'),
      refreshAccessToken('same-refresh-token'),
    ]);

    expect(a).toBe('shared-token');
    expect(b).toBe('shared-token');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe('getValidAccessToken', () => {
  it('returns the stored token without refreshing when not expired', async () => {
    await saveTokens({ access_token: 'still-valid-token', refresh_token: 'rt', expires_in: 3600 });
    global.fetch = jest.fn();

    await expect(getValidAccessToken()).resolves.toBe('still-valid-token');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('recovers when a concurrent refresh already rotated the token before our stale read was rejected', async () => {
    // Our own read sees an expired token + a refresh token that's already been
    // rotated out from under us by a concurrent refresh (the race fixed in
    // getValidAccessToken's retry-once-from-storage fallback).
    await saveTokens({ access_token: 'expired-token', refresh_token: 'stale-refresh-token', expires_in: -1 });

    global.fetch = jest.fn().mockImplementation(async () => {
      // Simulate the concurrent refresh landing between our expiry check and
      // our own refresh attempt being rejected.
      await saveTokens({ access_token: 'freshly-rotated-token', refresh_token: 'new-refresh-token', expires_in: 3600 });
      return jsonResponse(401, { error: 'invalid_grant' });
    });

    await expect(getValidAccessToken()).resolves.toBe('freshly-rotated-token');
  });

  it('throws ReauthRequiredError when refresh is rejected and storage still has no valid token', async () => {
    await saveTokens({ access_token: 'expired-token', refresh_token: 'dead-refresh-token', expires_in: -1 });
    global.fetch = jest.fn().mockResolvedValue(jsonResponse(401, { error: 'invalid_grant' }));

    await expect(getValidAccessToken()).rejects.toBeInstanceOf(ReauthRequiredError);
  });
});
