import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { access_token } from '../../../generated/prisma';
import { refreshSpotifyAccessToken } from './refreshSpotifyAccessToken';
import { NextContext } from '../../withAuth';
import { getUserFromRequest } from '../../user/handler';

export class SpotifyAuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SpotifyAuthorizationError';
  }
}

type Handler = (req: NextRequest, context?: NextContext) => Promise<Response>;
type HandlerWithAccessToken = (accessToken: access_token, req: NextRequest, context?: NextContext) => Promise<Response>;

export function withSpotifyAccessToken(handler: HandlerWithAccessToken): Handler {
  return async (req, context) => {
    const user = await getUserFromRequest();
    const accessTokens = await prisma.access_token.findUnique({
      where: {
        user_id: user.id
      }
    });
    if (!accessTokens) {
      return NextResponse.redirect('/spotify-settings', { status: 401 });
    }
    try {
      const response = await handler(accessTokens, req, context);
      return response;
    } catch (_e) {
      await refreshSpotifyAccessToken(user);
      return handler(accessTokens, req, context);
    }
  };
}

export const getSpotifyAccessTokensFromRequest = async (): Promise<access_token> => {
  const user = await getUserFromRequest();
  const access_token = await prisma.access_token.findUnique({
    where: {
      user_id: user.id
    }
  });
  return access_token;
};
