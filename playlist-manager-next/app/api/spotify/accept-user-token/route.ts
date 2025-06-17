import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { getUserFromRequest } from '../../user/handler';

const getAcceptUserTokenHandler = async (request: NextRequest) => {
  try {
    const code = request.nextUrl.searchParams.get('code');
    const params = new URLSearchParams();
    params.append('code', code);
    params.append('redirect_uri', process.env.SPOTIFY_REDIRECT_URI);
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
    const tokenResponse = await response.json();

    const user = await getUserFromRequest();

    await prisma.access_token.upsert({
      where: { user_id: user.id },
      update: {
        access_token: tokenResponse.access_token,
        refresh_token: tokenResponse.refresh_token,
        expires_in: tokenResponse.expires_in,
        token_type: tokenResponse.token_type
      },
      create: {
        user_id: user.id,
        access_token: tokenResponse.access_token,
        refresh_token: tokenResponse.refresh_token,
        expires_in: tokenResponse.expires_in,
        token_type: tokenResponse.token_type
      }
    });

    return NextResponse.redirect('http://localhost:3000/');
  } catch (error) {
    console.log('Error in postAcceptUserTokenHandler:', error);
    return NextResponse.json({ error: error.message }, { status: error.status || 500 });
  }
};

export const GET = getAcceptUserTokenHandler;
