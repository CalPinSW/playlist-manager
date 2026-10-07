import prisma from '../../../../lib/prisma';
import { user } from '../../../../generated/prisma';

/**
 * Spotify rejected the stored refresh token outright (`invalid_grant`) — it was
 * revoked or has expired, so retrying won't help. The user has to go through
 * Spotify's authorize flow again (Settings → Reconnect Spotify in the app).
 */
export class SpotifyReauthRequiredError extends Error {
  readonly status = 409;
  readonly code = 'spotify_reauth_required';

  constructor(message: string) {
    super(message);
    this.name = 'SpotifyReauthRequiredError';
  }
}

/**
 * Refreshes the Spotify access token for a given user.
 *
 * The fetch and DB write are wrapped in a Prisma interactive transaction so that
 * if the DB write fails after Spotify has already issued a new refresh token,
 * the transaction rolls back and the original token remains in the DB.
 *
 * Without this, a failed DB write after a successful Spotify response would
 * permanently invalidate the refresh token, causing all future syncs to 401.
 */
export const refreshSpotifyAccessToken = async (user: user) => {
  const tokens = await prisma.access_token.findUnique({
    where: { user_id: user.id }
  });

  if (!tokens || !tokens.refresh_token) {
    throw new Error('No refresh token found for user');
  }

  const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error(
      `Spotify credentials missing: clientId=${clientId ? 'set' : 'MISSING'}, secret=${
        clientSecret ? 'set' : 'MISSING'
      }`
    );
  }

  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const params = new URLSearchParams();
  params.append('grant_type', 'refresh_token');
  params.append('refresh_token', tokens.refresh_token);

  // Fetch outside the transaction — network calls cannot be rolled back,
  // but we only write to the DB inside the transaction below.
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${basicAuth}`
    },
    body: params.toString()
  });

  if (!response.ok) {
    // Spotify's OAuth error body (`error` / `error_description`, e.g.
    // "invalid_grant: Refresh token revoked") is the only way to tell a revoked
    // token apart from a bad client config — statusText alone is just "Bad Request".
    const errorBody = await response.json().catch(() => null);
    const detail = errorBody?.error
      ? ` (${errorBody.error}${errorBody.error_description ? `: ${errorBody.error_description}` : ''})`
      : '';
    const message = `Spotify token refresh failed for user ${user.id}: ${response.statusText}${detail}`;
    if (errorBody?.error === 'invalid_grant') {
      throw new SpotifyReauthRequiredError(message);
    }
    throw new Error(message);
  }

  const tokenResponse = await response.json();
  const newAccessToken: string = tokenResponse.access_token;
  // Spotify may or may not rotate the refresh token on each call.
  // Use the new one if provided; fall back to the existing one.
  const newRefreshToken: string = tokenResponse.refresh_token ?? tokens.refresh_token;

  // Write both tokens atomically. If this fails, the old refresh_token is still
  // in the DB and the next retry will succeed (Spotify hasn't yet invalidated it
  // because we captured it above before the DB write).
  await prisma.$transaction(async tx => {
    await tx.access_token.update({
      where: { user_id: user.id },
      data: {
        access_token: newAccessToken,
        refresh_token: newRefreshToken,
        expires_in: tokenResponse.expires_in,
        token_type: tokenResponse.token_type
      }
    });
  });
};
