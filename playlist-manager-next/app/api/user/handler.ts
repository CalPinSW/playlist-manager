import { auth0 } from '../../../lib/auth0';
import prisma from '../../../lib/prisma';
import { user } from '../../generated/prisma';

export const getUserFromRequest = async (): Promise<user> => {
  const session = await auth0.getSession();
  const user = await prisma.user.findFirst({
    where: {
      auth0_id: session?.user?.sub
    }
  });
  if (!user) {
    throw new Error('User not found');
  }
  return user;
};
