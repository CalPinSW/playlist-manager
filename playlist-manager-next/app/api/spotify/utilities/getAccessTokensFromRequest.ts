import { NextRequest, NextResponse } from 'next/server';
import prisma from "../../../../lib/prisma";
import { getUserFromRequest } from "../../user/route";
import { refreshSpotifyAccessToken } from '../accept-user-token/route';
import { access_token } from '../../../generated/prisma';

export class SpotifyAuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SpotifyAuthorizationError";
  }
}   
 
type Handler = (req: NextRequest, context?: any) => Promise<Response>;
type HandlerWithAccessToken = (accessToken: access_token, req: NextRequest, context?: any) => Promise<Response>;
 
export function withSpotifyAccessToken(handler: HandlerWithAccessToken): Handler {
  return async (req, context) => {
    const user = await getUserFromRequest();
    const accessTokens = await prisma.access_token.findUnique({
      where: {
        user_id: user.id,
      },
    });
    if (!accessTokens) {
      return NextResponse.redirect(
        "/pages/link-user-to-spotify",
        { status: 401 }
      );
    }
    try {
        return handler(accessTokens, req, context);
    } catch (error) {
        if (error instanceof SpotifyAuthorizationError) {
            await refreshSpotifyAccessToken(user)
            return handler(accessTokens, req, context);
        }
        else throw error;
    }
  };
}


export const getSpotifyAccessTokensFromRequest = async (): Promise<access_token> => {
    const user = await getUserFromRequest();
    const access_token = await prisma.access_token.findUnique({
        where: {
            user_id: user.id,
        },
    });
    return access_token;
}
