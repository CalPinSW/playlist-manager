import { NextRequest, NextResponse } from 'next/server';
import { user } from '../../../generated/prisma';
import prisma from '../../../../lib/prisma';
import { getUserFromRequest } from '../../user/route';
import { getSpotifyAccessTokensFromRequest } from '../utilities/getAccessTokensFromRequest';

const getAcceptUserTokenHandler = async (request: NextRequest) =>{
    try {
        const code = request.nextUrl.searchParams.get('code');
        const params = new URLSearchParams();
        params.append("code", code);
        params.append("redirect_uri", process.env.SPOTIFY_REDIRECT_URI);
        params.append("grant_type", "authorization_code");
        
        const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
        const clientSecret = process.env.SPOTIFY_SECRET;
        const auth = btoa(`${clientId}:${clientSecret}`)

        const response = await fetch("https://accounts.spotify.com/api/token", {
            method: "POST",
            headers: {
                "content-type": "application/x-www-form-urlencoded",
                'Authorization': 'Basic ' + auth
            },
            body: params.toString(),
        })
        if (!response.ok) {
            throw new Error(`Spotify token exchange failed: ${response.statusText}`);
        }
        const user = await getUserFromRequest()
        
        const tokenResponse = await response.json();

        await prisma.access_token.upsert({
            where: { user_id: user.id },
            update: {
                access_token: tokenResponse.access_token,
                refresh_token: tokenResponse.refresh_token,
                expires_in: tokenResponse.expires_in,
                token_type: tokenResponse.token_type,
            },
            create: {
                user_id: user.id,
                access_token: tokenResponse.access_token,
                refresh_token: tokenResponse.refresh_token,
                expires_in: tokenResponse.expires_in,
                token_type: tokenResponse.token_type,
            },
        });

        return NextResponse.redirect("http://localhost:3000/");
    } catch (error) {
        console.log("Error in postAcceptUserTokenHandler:", error);
        return NextResponse.json({ error: error.message }, { status: error.status || 500 });
    }
};

export const refreshSpotifyAccessToken = async (user: user) => {
    const tokens = await getSpotifyAccessTokensFromRequest()
    if (!tokens || !tokens.refresh_token) {
        throw new Error("No refresh token found for user");
    }
    const basicAuth = Buffer.from(`${process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_SECRET}`).toString("base64");
    const params = new URLSearchParams();
    params.append("grant_type", "refresh_token");
    params.append("refresh_token", tokens.refresh_token);

    const response = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Basic ${basicAuth}`,
        },
        body: params.toString(),
    });

    if (!response.ok) {
        throw new Error(`Spotify token refresh failed: ${response.statusText}`);
    }

    const tokenResponse = await response.json()

    const accessToken = tokenResponse.access_token;

    await prisma.access_token.update({
        where: { user_id: user.id },
        data: {
            access_token: accessToken,
            refresh_token: tokenResponse.refresh_token || tokens.refresh_token,
            expires_in: tokenResponse.expires_in,
            token_type: tokenResponse.token_type,
        },
    });
};


export const GET = getAcceptUserTokenHandler;
