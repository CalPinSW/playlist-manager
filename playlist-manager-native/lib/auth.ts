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

WebBrowser.maybeCompleteAuthSession();

// ── Constants ────────────────────────────────────────────────────────────────
const AUTH0_DOMAIN = process.env.EXPO_PUBLIC_AUTH0_DOMAIN ?? '';
const AUTH0_CLIENT_ID = process.env.EXPO_PUBLIC_AUTH0_CLIENT_ID ?? '';
const AUTH0_AUDIENCE = process.env.EXPO_PUBLIC_AUTH0_AUDIENCE ?? '';

const REDIRECT_URI = AuthSession.makeRedirectUri({ scheme: 'playlistmanager', path: 'callback' });

const STORE_KEYS = {
  accessToken: 'auth0_access_token',
  refreshToken: 'auth0_refresh_token',
  expiresAt: 'auth0_expires_at',
  idToken: 'auth0_id_token',
} as const;

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
  await SecureStore.setItemAsync(STORE_KEYS.accessToken, tokens.access_token);
  await SecureStore.setItemAsync(STORE_KEYS.expiresAt, String(expiresAt));
  if (tokens.refresh_token) {
    await SecureStore.setItemAsync(STORE_KEYS.refreshToken, tokens.refresh_token);
  }
  if (tokens.id_token) {
    await SecureStore.setItemAsync(STORE_KEYS.idToken, tokens.id_token);
  }
}

export async function getStoredTokens(): Promise<{
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
} | null> {
  const accessToken = await SecureStore.getItemAsync(STORE_KEYS.accessToken);
  const refreshToken = await SecureStore.getItemAsync(STORE_KEYS.refreshToken);
  const expiresAtStr = await SecureStore.getItemAsync(STORE_KEYS.expiresAt);

  if (!accessToken) return null;

  return {
    accessToken,
    refreshToken,
    expiresAt: expiresAtStr ? parseInt(expiresAtStr, 10) : null
  };
}

export async function clearTokens(): Promise<void> {
  await Promise.all(
    Object.values(STORE_KEYS).map(key => SecureStore.deleteItemAsync(key).catch(() => null))
  );
}

export function isTokenExpired(expiresAt: number | null): boolean {
  if (!expiresAt) return true;
  // Refresh 60 seconds early to avoid edge cases at expiry boundary.
  return Date.now() > expiresAt - 60_000;
}

// ── Silent refresh ────────────────────────────────────────────────────────────
export async function refreshAccessToken(refreshToken: string): Promise<string> {
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
    throw new Error(`Token refresh failed: ${response.statusText}`);
  }

  const tokens = await response.json();
  await saveTokens(tokens);
  return tokens.access_token;
}

/**
 * Returns a valid access token. Silently refreshes if expired.
 * Throws if no tokens are stored (user must log in).
 */
export async function getValidAccessToken(): Promise<string> {
  const stored = await getStoredTokens();
  if (!stored?.accessToken) throw new Error('Not authenticated');

  if (!isTokenExpired(stored.expiresAt)) {
    return stored.accessToken;
  }

  if (!stored.refreshToken) throw new Error('No refresh token — re-login required');
  return refreshAccessToken(stored.refreshToken);
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
