import { logger, schedules } from '@trigger.dev/sdk/v3';
import prisma from '../../lib/prisma';
import { updatePlaylistData } from './updatePlaylistData';

export const updateUsersPlaylistDataScheduled = schedules.task({
  id: 'update-users-playlist-data-scheduled',
  maxDuration: 3600, // Stop executing after 300 secs (5 mins) of compute
  // At 00:00 on Saturday.
  cron: '0 0 * * 6',
  run: async () => {
    logger.log('Task beginning');
    const users = await prisma.user.findMany();

    for (const user of users) {
      logger.log('Running updatePlaylistData for user:', { user: user.id });
      await updatePlaylistData.triggerAndWait({ userId: user.id });
      logger.log('Successfully ran updatePlaylistData for user:', { user: user.id });
    }

    logger.log('Task complete');
  }
});
