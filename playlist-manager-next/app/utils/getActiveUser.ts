import { auth0 } from '../../lib/auth0';
import prisma from '../../lib/prisma';
import { user } from '../generated/prisma';

const getActiveUser = async (): Promise<user> => {
  const { user: auth0User } = await auth0.getSession();
  const user = await prisma.user.findFirst({
    where: {
      auth0_id: auth0User.sub
    }
  });
  if (!user) {
    throw new Error('No user found in the database for the current auth0 session');
  }
  return user;
};

export default getActiveUser;
