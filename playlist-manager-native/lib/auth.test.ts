import * as SecureStore from 'expo-secure-store';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
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
  refreshAccessToken,
  getValidAccessToken,
  ReauthRequiredError,
} from './auth';

const mockedGetItemAsync = SecureStore.getItemAsync as jest.Mock;

function jsonResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: `status ${status}`,
    json: async () => body,
  } as Response;
}

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

describe('refreshAccessToken', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    mockedGetItemAsync.mockResolvedValue(null);
  });

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
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('auth0_access_token', 'new-access-token');
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
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it('returns the stored token without refreshing when not expired', async () => {
    mockedGetItemAsync.mockImplementation(async (key: string) => {
      if (key === 'auth0_access_token') return 'still-valid-token';
      if (key === 'auth0_expires_at') return String(Date.now() + 60_000);
      return null;
    });
    global.fetch = jest.fn();

    await expect(getValidAccessToken()).resolves.toBe('still-valid-token');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('recovers when a concurrent refresh already rotated the token before our stale read was rejected', async () => {
    // Our own read sees an expired token + a refresh token that's already been
    // rotated out from under us by a concurrent refresh (the race fixed in
    // getValidAccessToken's retry-once-from-storage fallback).
    let callCount = 0;
    mockedGetItemAsync.mockImplementation(async (key: string) => {
      callCount += 1;
      const isFirstRead = callCount <= 3;
      if (key === 'auth0_access_token') return isFirstRead ? 'expired-token' : 'freshly-rotated-token';
      if (key === 'auth0_expires_at') return isFirstRead ? String(Date.now() - 1000) : String(Date.now() + 60_000);
      if (key === 'auth0_refresh_token') return 'stale-refresh-token';
      return null;
    });
    global.fetch = jest.fn().mockResolvedValue(jsonResponse(401, { error: 'invalid_grant' }));

    await expect(getValidAccessToken()).resolves.toBe('freshly-rotated-token');
  });

  it('throws ReauthRequiredError when refresh is rejected and storage still has no valid token', async () => {
    mockedGetItemAsync.mockImplementation(async (key: string) => {
      if (key === 'auth0_access_token') return 'expired-token';
      if (key === 'auth0_expires_at') return String(Date.now() - 1000);
      if (key === 'auth0_refresh_token') return 'dead-refresh-token';
      return null;
    });
    global.fetch = jest.fn().mockResolvedValue(jsonResponse(401, { error: 'invalid_grant' }));

    await expect(getValidAccessToken()).rejects.toBeInstanceOf(ReauthRequiredError);
  });
});
