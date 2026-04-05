import { NextRequest } from 'next/server';
import { auth0 } from '../../../lib/auth0';
import { verifyBearerToken, extractBearerToken } from '../../../lib/auth0-bearer';
import prisma from '../../../lib/prisma';
import { user } from '../../../generated/prisma';

/**
 * Resolves the authenticated user from either an Auth0 Bearer token (mobile)
 * or an Auth0 session cookie (web). Pass the NextRequest for Bearer support;
 * omit it to fall back to session-cookie-only (preserves backward compatibility
 * with existing callers).
 */
export const getUserFromRequest = async (req?: NextRequest): Promise<user> => {
  let auth0Id: string | undefined;

  const bearerToken = req ? extractBearerToken(req.headers.get('Authorization')) : null;

  if (bearerToken) {
    const { sub } = await verifyBearerToken(bearerToken);
    auth0Id = sub;
  } else {
    const session = await auth0.getSession();
    auth0Id = session?.user?.sub;
  }

  if (!auth0Id) {
    throw new Error('Not authenticated');
  }

  const user = await prisma.user.findFirst({
    where: { auth0_id: auth0Id }
  });

  if (!user) {
    throw new Error('User not found');
  }

  return user;
};
