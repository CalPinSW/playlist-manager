import { NextResponse } from 'next/server';
import { withAuth } from '../withAuth';
import { auth0 } from '../../../lib/auth0';
import prisma from '../../../lib/prisma';
import { user } from '../../generated/prisma';

const getUserHandler = async () => {
  const session = await auth0.getSession();

  try {
    const user = await prisma.user.findFirst({
      where: {
        auth0_id: session?.user?.sub
      }
    });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 }); // Should redirect to spotify connect in this case
    }
    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: error.status || 500 });
  }
};

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

export const GET = withAuth(getUserHandler);
