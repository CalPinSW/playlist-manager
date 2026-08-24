/**
 * Auth0 PKCE authentication for the Expo app.
 *
 * Flow:
 * 1. useAuth0() builds the authorization URL with PKCE challenge.
 * 2. openAuthSessionAsync() opens the Auth0 login page in an in-app browser.
 * 3. Auth0 redirects back to playlistmanager://callback with an auth code.
 * 4. We exchange the code for tokens (access + refresh + id_token).
 * 5. Tokens are stored in SecureStore — persist across app restarts.
 * 6. On subsequent opens, we check expiry and refresh silently if needed.
 *
 * Auth0 tenant config required:
 * - Allowed Callback URLs: playlistmanager://callback
 * - Allowed Logout URLs: playlistmanager://
 * - Allowed Web Origins: (none needed for PKCE)
 */

import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as SecureStore from 'expo-secure-store';
import * as Sentry from '@sentry/react-native';
import { writeAuthToken } from '../modules/widget-bridge';

WebBrowser.maybeCompleteAuthSession();

// ── Constants ────────────────────────────────────────────────────────────────
const AUTH0_DOMAIN = process.env.EXPO_PUBLIC_AUTH0_DOMAIN ?? '';
const AUTH0_CLIENT_ID = process.env.EXPO_PUBLIC_AUTH0_CLIENT_ID ?? '';
const AUTH0_AUDIENCE = process.env.EXPO_PUBLIC_AUTH0_AUDIENCE ?? '';

const REDIRECT_URI = AuthSession.makeRedirectUri({ scheme: 'playlistmanager', path: 'callback' });

// Tokens live under one key, written in a single call, so an app kill
// mid-save can never strand a partially-updated set — e.g. a new access
// token paired with the old, already-rotated (and now Auth0-invalidated)
// refresh token, which would silently brick the next refresh attempt.
const STORE_KEY = 'auth0_tokens';

// Pre-consolidation keys, kept only so getStoredTokens can migrate anyone
// who still has tokens saved under the old per-field scheme.
const LEGACY_STORE_KEYS = {
  accessToken: 'auth0_access_token',
  refreshToken: 'auth0_refresh_token',
  expiresAt: 'auth0_expires_at',
  idToken: 'auth0_id_token',
} as const;

interface StoredTokenSet {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: number | null;
  idToken: string | null;
}

// ── Discovery ────────────────────────────────────────────────────────────────
export const discovery: AuthSession.DiscoveryDocument = {
  authorizationEndpoint: `https://${AUTH0_DOMAIN}/authorize`,
  tokenEndpoint: `https://${AUTH0_DOMAIN}/oauth/token`,
  revocationEndpoint: `https://${AUTH0_DOMAIN}/oauth/revoke`,
};

// ── Token storage ────────────────────────────────────────────────────────────
export async function saveTokens(tokens: {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  id_token?: string;
}): Promise<void> {
  const expiresAt = Date.now() + tokens.expires_in * 1000;

  // Auth0 doesn't always echo back a refresh_token (e.g. a plain access-token
  // refresh with rotation off) — preserve whatever we already had rather than
  // wiping it. Reading first is safe: the risky moment is the write below,
  // and consolidating that into a single call is the whole point of this.
  const existing = await getStoredTokenSet();
  const next: StoredTokenSet = {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token ?? existing?.refreshToken ?? null,
    expiresAt,
    idToken: tokens.id_token ?? existing?.idToken ?? null
  };

  await SecureStore.setItemAsync(STORE_KEY, JSON.stringify(next));

  // Mirror the Vercel JWT to the App Group Keychain so the widget's
  // SetRatingIntent can make authenticated API calls without opening the app.
  writeAuthToken(tokens.access_token).catch(() => null);
}

async function getStoredTokenSet(): Promise<StoredTokenSet | null> {
  const raw = await SecureStore.getItemAsync(STORE_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as StoredTokenSet;
      if (parsed.accessToken) return parsed;
    } catch {
      // Fall through to legacy lookup / treat as logged out.
    }
  }

  // One-time migration for tokens saved under the old per-field keys, so
  // upgrading doesn't force an extra re-login on top of the one that
  // prompted this fix.
  const [accessToken, refreshToken, expiresAtStr, idToken] = await Promise.all([
    SecureStore.getItemAsync(LEGACY_STORE_KEYS.accessToken),
    SecureStore.getItemAsync(LEGACY_STORE_KEYS.refreshToken),
    SecureStore.getItemAsync(LEGACY_STORE_KEYS.expiresAt),
    SecureStore.getItemAsync(LEGACY_STORE_KEYS.idToken)
  ]);
  if (!accessToken) return null;

  const migrated: StoredTokenSet = {
    accessToken,
    refreshToken,
    expiresAt: expiresAtStr ? parseInt(expiresAtStr, 10) : null,
    idToken
  };
  await SecureStore.setItemAsync(STORE_KEY, JSON.stringify(migrated));
  await Promise.all(
    Object.values(LEGACY_STORE_KEYS).map(key => SecureStore.deleteItemAsync(key).catch(() => null))
  );
  return migrated;
}

export async function getStoredTokens(): Promise<{
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
} | null> {
  const stored = await getStoredTokenSet();
  if (!stored) return null;

  return {
    accessToken: stored.accessToken,
    refreshToken: stored.refreshToken,
    expiresAt: stored.expiresAt
  };
}

export async function clearTokens(): Promise<void> {
  await SecureStore.deleteItemAsync(STORE_KEY).catch(() => null);
  await Promise.all(
    Object.values(LEGACY_STORE_KEYS).map(key => SecureStore.deleteItemAsync(key).catch(() => null))
  );
}

export function isTokenExpired(expiresAt: number | null): boolean {
  if (!expiresAt) return true;
  // Refresh 60 seconds early to avoid edge cases at expiry boundary.
  return Date.now() > expiresAt - 60_000;
}

/**
 * Thrown only when Auth0 has definitively rejected the refresh token (expired,
 * revoked, or rotated out from under us) — i.e. the user actually needs to log
 * in again. Transient errors (network failure, Auth0 outage) throw a plain
 * Error instead, so callers don't wipe a perfectly good session over a blip.
 */
export class ReauthRequiredError extends Error {
  constructor(message = 'Re-authentication required') {
    super(message);
    this.name = 'ReauthRequiredError';
  }
}

// ── Silent refresh ────────────────────────────────────────────────────────────
// Auth0 rotates the refresh token on every use, so two concurrent refreshes
// with the same stored token can race — the second is rejected as reused,
// which used to be misread as "session dead". Sharing one in-flight promise
// makes every concurrent caller (screens mounting/polling in parallel) await
// the same refresh instead of each spending the refresh token themselves.
let refreshPromise: Promise<string> | null = null;

export async function refreshAccessToken(refreshToken: string): Promise<string> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const response = await fetch(`https://${AUTH0_DOMAIN}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'refresh_token',
        client_id: AUTH0_CLIENT_ID,
        refresh_token: refreshToken,
        ...(AUTH0_AUDIENCE ? { audience: AUTH0_AUDIENCE } : {})
      })
    });

    if (!response.ok) {
      // Auth0's response body carries the actual reason (error/error_description
      // — e.g. "invalid_grant: The refresh token was already used" vs "Unknown
      // or invalid refresh token" vs an inactivity/absolute expiry message).
      // Without this, a forced logout is indistinguishable from any other in
      // Sentry — this is the one place with enough context to tell them apart.
      const body: { error?: string; error_description?: string } | null = await response.json().catch(() => null);
      const reason = body?.error_description ?? body?.error ?? response.statusText;
      const definitive = response.status === 400 || response.status === 401;

      Sentry.captureMessage(`Auth0 refresh token request failed (${response.status})`, {
        level: definitive ? 'warning' : 'error',
        tags: { auth_refresh_status: String(response.status), auth0_error: body?.error ?? 'unknown' },
        extra: { status: response.status, error_description: body?.error_description }
      });

      if (definitive) {
        throw new ReauthRequiredError(`Token refresh rejected: ${response.status} ${reason}`);
      }
      throw new Error(`Token refresh failed: ${response.status} ${reason}`);
    }

    const tokens = await response.json();
    await saveTokens(tokens);
    Sentry.addBreadcrumb({ category: 'auth', message: 'Refreshed access token', level: 'info' });
    return tokens.access_token;
  })();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

/**
 * Returns a valid access token. Silently refreshes if expired.
 * Throws ReauthRequiredError if the user must log in again; throws a plain
 * Error for transient failures (network, Auth0 outage) that callers should
 * treat as retryable rather than as a reason to clear the session.
 */
export async function getValidAccessToken(): Promise<string> {
  const stored = await getStoredTokens();
  if (!stored?.accessToken) {
    // Distinct from the network-side failures captured in refreshAccessToken:
    // this means SecureStore had nothing at all — never logged in, tokens
    // cleared, or (if this ever recurs) something wiping the Keychain entry
    // outside of clearTokens().
    Sentry.captureMessage('getValidAccessToken: no stored access token', { level: 'warning' });
    throw new ReauthRequiredError('Not authenticated');
  }

  if (!isTokenExpired(stored.expiresAt)) {
    return stored.accessToken;
  }

  if (!stored.refreshToken) {
    Sentry.captureMessage('getValidAccessToken: access token expired with no refresh token stored', {
      level: 'warning'
    });
    throw new ReauthRequiredError('No refresh token — re-login required');
  }

  try {
    return await refreshAccessToken(stored.refreshToken);
  } catch (err) {
    if (!(err instanceof ReauthRequiredError)) throw err;

    // Our refreshToken read above may have been stale: a concurrent refresh
    // (deduped via refreshPromise) can rotate the token and write fresh ones
    // after we read but before Auth0 rejects our now-stale copy. Check
    // storage once more before treating this as a genuine rejection.
    const latest = await getStoredTokens();
    if (latest?.accessToken && !isTokenExpired(latest.expiresAt)) {
      return latest.accessToken;
    }
    throw err;
  }
}

// ── Auth request config (used by useAuthRequest hook) ─────────────────────────
export const authRequestConfig: AuthSession.AuthRequestConfig = {
  clientId: AUTH0_CLIENT_ID,
  redirectUri: REDIRECT_URI,
  scopes: ['openid', 'profile', 'email', 'offline_access'],
  responseType: AuthSession.ResponseType.Code,
  extraParams: {
    ...(AUTH0_AUDIENCE ? { audience: AUTH0_AUDIENCE } : {})
  },
  usePKCE: true,
};

// ── Token exchange (auth code → tokens) ──────────────────────────────────────
export async function exchangeCodeForTokens(
  code: string,
  codeVerifier: string
): Promise<void> {
  const response = await fetch(`https://${AUTH0_DOMAIN}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      client_id: AUTH0_CLIENT_ID,
      code,
      code_verifier: codeVerifier,
      redirect_uri: REDIRECT_URI,
      ...(AUTH0_AUDIENCE ? { audience: AUTH0_AUDIENCE } : {})
    })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Token exchange failed: ${response.statusText} — ${body}`);
  }

  const tokens = await response.json();
  await saveTokens(tokens);
}
