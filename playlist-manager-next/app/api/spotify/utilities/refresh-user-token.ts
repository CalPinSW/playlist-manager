import { NextResponse } from 'next/server';
import { user } from '../../../generated/prisma';
import prisma from '../../../../lib/prisma';

export const refreshUserTokens = async (user: user) =>{
    try {
        const accessTokens = await prisma.access_token.findUnique({
            where: { user_id: user.id },
            select: { refresh_token: true },
        }); 
        const params = new URLSearchParams();
        params.append("refresh_token", accessTokens.refresh_token);
        params.append("redirect_uri", process.env.SPOTIFY_REDIRECT_URI);
        params.append("grant_type", "refresh_token");
        
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
            console.log(await response.json());
            throw new Error(`Spotify token exchange failed: ${response.statusText}`);
        }
        
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

        return NextResponse.json({ success: true, message: "Tokens refreshed successfully" });
    } catch (error) {
        console.log("Error in postAcceptUserTokenHandler:", error);
        return NextResponse.json({ error: error.message }, { status: error.status || 500 });
    }
};
