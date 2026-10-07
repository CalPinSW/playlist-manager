import { NextResponse } from 'next/server';
import { buildSpotifyAuthorizeUrl } from '../../../../lib/spotify';

const getAuthorizeHandler = async () => {
  try {
    return NextResponse.redirect(buildSpotifyAuthorizeUrl('some-random-state'));
  } catch (error) {
    console.log('Error in getAuthorizeHandler:', error);
    return NextResponse.json({ error: error.message }, { status: error.status || 500 });
  }
};

export const GET = getAuthorizeHandler;
