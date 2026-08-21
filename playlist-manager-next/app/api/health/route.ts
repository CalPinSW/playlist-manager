import { NextResponse } from 'next/server';

/**
 * GET /api/health
 *
 * Unauthenticated liveness check — returns 200 as soon as the server can
 * handle requests. Used by test:integration's wait-on step (every other
 * route either requires a session or redirects through Auth0's hosted
 * login, so nothing else on this app reliably returns 2xx when logged
 * out) and is a reasonable target for external uptime monitors too.
 */
export function GET() {
  return NextResponse.json({ status: 'ok' });
}
