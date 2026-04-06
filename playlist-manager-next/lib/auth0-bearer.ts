import { createRemoteJWKSet, jwtVerify } from 'jose';

/**
 * Verifies an Auth0 Bearer token using the JWKS endpoint.
 *
 * Used by withAuth() and getUserFromRequest() to authenticate requests
 * from the Expo mobile app, which sends Auth0 access tokens as Bearer headers
 * rather than session cookies.
 *
 * The JWKS response is cached by jose's createRemoteJWKSet — subsequent calls
 * reuse the cached keys until they rotate.
 */

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

function getJwks() {
  if (!jwks) {
    const domain = process.env.AUTH0_DOMAIN;
    if (!domain) throw new Error('AUTH0_DOMAIN env var is not set');
    jwks = createRemoteJWKSet(new URL(`https://${domain}/.well-known/jwks.json`));
  }
  return jwks;
}

export async function verifyBearerToken(token: string): Promise<{ sub: string }> {
  const domain = process.env.AUTH0_DOMAIN;
  const audience = process.env.AUTH0_AUDIENCE;
  if (!domain) throw new Error('AUTH0_DOMAIN env var is not set');

  // Opaque tokens (issued when no audience is specified in the auth request)
  // are not JWTs — they start with a random prefix, not 'eyJ'. Catch this
  // early with a clear error rather than a confusing JWKS failure.
  if (!token.startsWith('eyJ')) {
    console.error(
      '[auth0-bearer] Token is not a JWT (does not start with eyJ). ' +
      'This usually means AUTH0_AUDIENCE was not set in the mobile app .env, ' +
      'so Auth0 issued an opaque token instead of a signed JWT. ' +
      'Set EXPO_PUBLIC_AUTH0_AUDIENCE in your .env to fix this.'
    );
    throw new Error('Token is opaque (not a JWT) — set EXPO_PUBLIC_AUTH0_AUDIENCE in the mobile app .env');
  }

  try {
    const { payload } = await jwtVerify(token, getJwks(), {
      issuer: `https://${domain}/`,
      ...(audience ? { audience } : {})
    });

    if (typeof payload.sub !== 'string') {
      throw new Error('Invalid token: missing sub claim');
    }

    return { sub: payload.sub };
  } catch (err) {
    // Log the specific jose error so it appears in Vercel function logs.
    const message = err instanceof Error ? err.message : String(err);
    console.error(
      `[auth0-bearer] jwtVerify failed: ${message} | ` +
      `domain=${domain} | audience=${audience ?? '(not set)'}`
    );
    throw err;
  }
}

/**
 * Extracts the Bearer token from an Authorization header value.
 * Returns null if the header is missing or not a Bearer token.
 */
export function extractBearerToken(authorizationHeader: string | null): string | null {
  if (!authorizationHeader?.startsWith('Bearer ')) return null;
  return authorizationHeader.slice(7);
}
