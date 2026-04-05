import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '../withAuth';
import { getProgress } from './handler';

const getProgressHandler = async (req: NextRequest) => {
  try {
    const progress = await getProgress(req);
    return NextResponse.json(progress, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: error.status || 500 });
  }
};

export const GET = withAuth(getProgressHandler);
