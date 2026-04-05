import { NextRequest } from 'next/server';
import prisma from '../../../lib/prisma';
import { getUserFromRequest } from '../user/handler';
import { syncForUser } from '../../trigger/syncRecentlyPlayed';

/**
 * On-demand recently-played sync for the authenticated user.
 *
 * Called by the Expo app on every open (after auth) so that listening progress
 * is up to date before the user sees the Now tab. Runs synchronously — the
 * Spotify recently_played call + batch DB ops typically complete in <3 seconds.
 *
 * The Trigger.dev scheduled task (every 15 min) is a background safety net;
 * this route is the foreground trigger for a fresh experience on app open.
 */
export const syncHistory = async (req: NextRequest): Promise<{ synced: boolean; message: string }> => {
  const user = await getUserFromRequest(req);

  // Fetch user with access_token included (required by syncForUser).
  const userWithToken = await prisma.user.findUnique({
    where: { id: user.id },
    include: { access_token: true }
  });

  if (!userWithToken) {
    throw new Error('User not found');
  }

  await syncForUser(userWithToken);

  return { synced: true, message: 'Sync complete' };
};
