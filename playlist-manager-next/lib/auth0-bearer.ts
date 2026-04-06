import { createRemoteJWKSet, jwtVerify, jwtDecrypt, base64url } from 'jose';

/**
 * Verifies an Auth0 Bearer token using the JWKS endpoint.
 *
 * Handles two token types that Auth0 may issue:
 * 1. JWS (signed JWT, 3 parts) — verified via JWKS. Standard RS256 access tokens.
 * 2. JWE (encrypted JWT, 5 parts, alg: "dir") — decrypted using AUTH0_CLIENT_SECRET.
 *    Auth0 issues these when "JSON Web Token (JWT) Encryption" is enabled on the
 *    Application, using the client secret as the symmetric Content Encryption Key.
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

/**
 * Returns true if the token is a JWE compact serialisation (5 dot-separated parts).
 * JWS tokens have 3 parts (2 dots). We also peek at the header's `enc` field,
 * which is only present in JWE headers.
 */
function isJweToken(token: string): boolean {
  const parts = token.split('.');
  if (parts.length === 5) return true;
  if (parts.length !== 3) return false;
  try {
    const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString());
    return typeof header.enc === 'string';
  } catch {
    return false;
  }
}

/**
 * Decrypts a JWE token using the AUTH0_CLIENT_SECRET as the symmetric key.
 * Auth0 uses alg:"dir" — the client secret (base64url-decoded) is used directly
 * as the Content Encryption Key.
 */
async function decryptJweToken(token: string, domain: string): Promise<{ sub: string }> {
  const clientSecret = process.env.AUTH0_CLIENT_SECRET;
  if (!clientSecret) {
    throw new Error(
      'AUTH0_CLIENT_SECRET env var is not set — required to decrypt JWE access tokens. ' +
        'Either add it to your environment or disable JWT encryption in the Auth0 dashboard ' +
        '(Applications → <your app> → Advanced Settings → OAuth → uncheck "JSON Web Token Encryption").'
    );
  }

  // Auth0 client secrets are base64url-encoded; decode to raw bytes for the CEK
  const secretKey = base64url.decode(clientSecret);

  console.log('[auth0-bearer] Token is JWE (encrypted). Decrypting with client secret...');

  try {
    const { payload } = await jwtDecrypt(token, secretKey, {
      issuer: `https://${domain}/`
    });

    if (typeof payload.sub !== 'string') {
      throw new Error('Invalid token: missing sub claim after decryption');
    }

    console.log('[auth0-bearer] JWE decryption successful, sub:', payload.sub);
    return { sub: payload.sub };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(
      '[auth0-bearer] jwtDecrypt failed:',
      message,
      '| This usually means AUTH0_CLIENT_SECRET is incorrect or the token was not encrypted with it.',
      '| Consider disabling JWT encryption in Auth0: Applications → Advanced Settings → OAuth.'
    );
    throw err;
  }
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

  // JWE path: Auth0 encrypted the token using the client secret
  if (isJweToken(token)) {
    return decryptJweToken(token, domain);
  }

  // JWS path: standard signed JWT — verify via JWKS
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
      `[auth0-bearer] jwtVerify failed: ${message} | ` + `domain=${domain} | audience=${audience ?? '(not set)'}`
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
