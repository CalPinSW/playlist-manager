import { access_token } from './../../../generated/prisma/index.d';
import { NextResponse } from 'next/server';
import { withAuth } from '../../withAuth';
import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import { withSpotifyAccessToken } from '../../spotify/utilities/getAccessTokensFromRequest';

const getPlaybackHandler = async (access_tokens: access_token) =>{
    try {
        const spotifySdk = SpotifyApi.withAccessToken(process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID, access_tokens);
        const playback = await spotifySdk.player.getPlaybackState()
        return NextResponse.json({ playback }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: error.status || 500 });
    }
};


export const GET = withAuth(withSpotifyAccessToken(getPlaybackHandler));
