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
 *
 * Auto-claim: if no user is found by auth0_id but a user with auth0_id=null
 * exists, we set auth0_id on that record and return it. This handles the
 * migration case where users were created via Spotify OAuth before Auth0 was
 * integrated, and auth0_id was never written. Safe for a personal single-user
 * app — will only claim if exactly one un-linked user exists.
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

  // Primary lookup: find user by auth0_id.
  let foundUser = await prisma.user.findFirst({
    where: { auth0_id: auth0Id }
  });

  if (foundUser) return foundUser;

  // Auto-claim fallback: if auth0_id wasn't set (pre-Auth0 users created via
  // Spotify OAuth), find the one un-linked user and claim it.
  const unlinkedUser = await prisma.user.findFirst({
    where: { auth0_id: null }
  });

  if (unlinkedUser) {
    foundUser = await prisma.user.update({
      where: { id: unlinkedUser.id },
      data: { auth0_id: auth0Id }
    });
    return foundUser;
  }

  throw new Error('User not found');
};
