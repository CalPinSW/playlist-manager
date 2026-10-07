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
    // `code` lets the app tell "Spotify needs reconnecting" (spotify_reauth_required) apart from a transient failure.
    const code = error instanceof Error && 'code' in error ? (error as { code: string }).code : undefined;
    return NextResponse.json({ error: message, code }, { status });
  }
};

export const POST = withAuth(syncHistoryHandler);
