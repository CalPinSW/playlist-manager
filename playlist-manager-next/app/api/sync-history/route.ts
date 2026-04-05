import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '../withAuth';
import { syncHistory } from './handler';

const syncHistoryHandler = async (req: NextRequest) => {
  try {
    const result = await syncHistory(req);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: error.status || 500 });
  }
};

export const POST = withAuth(syncHistoryHandler);
