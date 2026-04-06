import { NextRequest, NextResponse } from 'next/server';
import { auth0 } from '../../lib/auth0';
import { verifyBearerToken, extractBearerToken } from '../../lib/auth0-bearer';

export interface NextContext {
  params: Promise<Record<string, string>>;
}

type Handler = (req: NextRequest, context?: NextContext) => Promise<Response>;

/**
 * Auth middleware for Next.js API routes.
 *
 * Accepts two authentication methods:
 * 1. Auth0 Bearer token (Authorization: Bearer <token>) — used by the Expo mobile app.
 *    Token is verified against Auth0's JWKS endpoint.
 * 2. Auth0 session cookie — used by the Next.js web app.
 *
 * Bearer check runs first so mobile requests don't incur a session lookup.
 */
export function withAuth(handler: Handler): Handler {
  return async (req: NextRequest, context: NextContext) => {
    const bearerToken = extractBearerToken(req.headers.get('Authorization'));

    if (bearerToken) {
      try {
        await verifyBearerToken(bearerToken);
        return handler(req, context);
      } catch (err) {
        // Return the specific error message so the client can diagnose issues
        // without needing to check Vercel function logs.
        const detail = err instanceof Error ? err.message : 'Unknown verification error';
        return NextResponse.json(
          { error: 'Invalid or expired token', detail },
          { status: 401 }
        );
      }
    }

    const session = await auth0.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    return handler(req, context);
  };
}
