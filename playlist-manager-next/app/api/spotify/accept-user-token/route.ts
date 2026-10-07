import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { getUserFromRequest } from '../../user/handler';
import { getSpotifyRedirectUri } from '../../../../lib/spotify';
import { verifyConnectState } from '../../../../lib/spotifyConnectState';

/**
 * Where the mobile connect flow returns to. The app opens Spotify's authorize
 * page via WebBrowser.openAuthSessionAsync with this as the return URL, so
 * redirecting here closes the browser sheet and hands the result to the app.
 */
const NATIVE_RETURN_URL = 'playlistmanager://spotify-connected';

const nativeRedirect = (error?: string) => {
  const url = new URL(NATIVE_RETURN_URL);
  if (error) url.searchParams.set('error', error);
  return NextResponse.redirect(url.toString());
};

const exchangeCodeForTokens = async (code: string) => {
  const params = new URLSearchParams();
  params.append('code', code);
  params.append('redirect_uri', getSpotifyRedirectUri());
  params.append('grant_type', 'authorization_code');

  const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_SECRET;
  const auth = btoa(`${clientId}:${clientSecret}`);

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      Authorization: 'Basic ' + auth
    },
    body: params.toString()
  });
  if (!response.ok) {
    throw new Error(`Spotify token exchange failed: ${response.statusText}`);
  }
  return response.json();
};

const saveTokens = async (userId: string, tokenResponse: Record<string, unknown>) => {
  const data = {
    access_token: tokenResponse.access_token as string,
    refresh_token: tokenResponse.refresh_token as string,
    expires_in: tokenResponse.expires_in as number,
    token_type: tokenResponse.token_type as string
  };
  await prisma.access_token.upsert({
    where: { user_id: userId },
    update: data,
    create: { user_id: userId, ...data }
  });
};

const getAcceptUserTokenHandler = async (request: NextRequest) => {
  const code = request.nextUrl.searchParams.get('code');

  // Mobile connect flow: the user is identified by the signed state, not a cookie.
  const nativeUserId = verifyConnectState(request.nextUrl.searchParams.get('state'));
  if (nativeUserId) {
    const spotifyError = request.nextUrl.searchParams.get('error');
    if (spotifyError || !code) return nativeRedirect(spotifyError ?? 'missing_code');
    try {
      await saveTokens(nativeUserId, await exchangeCodeForTokens(code));
      return nativeRedirect();
    } catch (error) {
      console.log('Error in getAcceptUserTokenHandler (native):', error);
      return nativeRedirect('exchange_failed');
    }
  }

  try {
    const tokenResponse = await exchangeCodeForTokens(code);
    const user = await getUserFromRequest();
    await saveTokens(user.id, tokenResponse);

    return NextResponse.redirect(new URL('/', process.env.NEXT_PUBLIC_BASE_URL!));
  } catch (error) {
    console.log('Error in postAcceptUserTokenHandler:', error);
    return NextResponse.json({ error: error.message }, { status: error.status || 500 });
  }
};

export const GET = getAcceptUserTokenHandler;
