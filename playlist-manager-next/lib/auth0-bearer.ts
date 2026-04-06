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

  const { payload } = await jwtVerify(token, getJwks(), {
    issuer: `https://${domain}/`,
    ...(audience ? { audience } : {})
  });

  if (typeof payload.sub !== 'string') {
    throw new Error('Invalid token: missing sub claim');
  }

  return { sub: payload.sub };
}

/**
 * Extracts the Bearer token from an Authorization header value.
 * Returns null if the header is missing or not a Bearer token.
 */
export function extractBearerToken(authorizationHeader: string | null): string | null {
  if (!authorizationHeader?.startsWith('Bearer ')) return null;
  return authorizationHeader.slice(7);
}
