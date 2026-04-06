import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '../withAuth';
import { syncHistory } from './handler';

const syncHistoryHandler = async (req: NextRequest) => {
  try {
    const result = await syncHistory(req);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[sync-history] Error:', message);
    const status = error instanceof Error && 'status' in error ? (error as { status: number }).status : 500;
    return NextResponse.json({ error: message }, { status });
  }
};

export const POST = withAuth(syncHistoryHandler);
