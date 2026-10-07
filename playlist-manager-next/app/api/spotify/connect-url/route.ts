import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '../../withAuth';
import { getUserFromRequest } from '../../user/handler';
import { buildSpotifyAuthorizeUrl } from '../../../../lib/spotify';
import { createConnectState } from '../../../../lib/spotifyConnectState';

/**
 * GET /api/spotify/connect-url — Spotify authorize URL for the mobile app's
 * "Reconnect Spotify" flow. The `state` carries the signed user ID so the
 * callback (`/api/spotify/accept-user-token`) can attach the new tokens to the
 * right user without a session cookie, then bounce back into the app.
 */
const getConnectUrlHandler = async (req: NextRequest) => {
  try {
    const user = await getUserFromRequest(req);
    const url = buildSpotifyAuthorizeUrl(createConnectState(user.id));
    return NextResponse.json({ url: url.toString() });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[spotify/connect-url] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
};

export const GET = withAuth(getConnectUrlHandler);
