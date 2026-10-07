import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Signed OAuth `state` for the mobile Spotify (re)connect flow.
 *
 * The web flow identifies the user in the Spotify callback from the Auth0
 * session cookie, but the mobile app has no cookie jar — it opens Spotify's
 * authorize page in a system browser session. So the app first asks the backend
 * (with its Bearer token) for an authorize URL, and we embed the user ID in a
 * short-lived HMAC-signed `state`. The callback trusts the user ID only if the
 * signature checks out, which also gives us the CSRF protection `state` is for.
 */

const STATE_TTL_MS = 10 * 60 * 1000;

interface ConnectState {
  userId: string;
  expiresAt: number;
}

const getKey = () => {
  const key = process.env.AUTH0_SECRET;
  if (!key) throw new Error('AUTH0_SECRET is not set');
  return key;
};

const sign = (payload: string) => createHmac('sha256', getKey()).update(payload).digest('base64url');

export const createConnectState = (userId: string, now = Date.now()): string => {
  const payload = Buffer.from(JSON.stringify({ userId, expiresAt: now + STATE_TTL_MS })).toString('base64url');
  return `${payload}.${sign(payload)}`;
};

/** Returns the user ID if `state` is a valid, unexpired connect state; otherwise null. */
export const verifyConnectState = (state: string | null, now = Date.now()): string | null => {
  if (!state) return null;
  const [payload, signature] = state.split('.');
  if (!payload || !signature) return null;

  const expected = new Uint8Array(Buffer.from(sign(payload)));
  const actual = new Uint8Array(Buffer.from(signature));
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;

  try {
    const { userId, expiresAt } = JSON.parse(Buffer.from(payload, 'base64url').toString()) as ConnectState;
    if (typeof userId !== 'string' || typeof expiresAt !== 'number' || expiresAt < now) return null;
    return userId;
  } catch {
    return null;
  }
};
