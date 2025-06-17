import { NextRequest, NextResponse } from 'next/server';
import { auth0 } from '../../lib/auth0';

export interface NextContext {
  params: Promise<Record<string, string>>;
}

type Handler = (req: NextRequest, context?: NextContext) => Promise<Response>;

export function withAuth(handler: Handler): Handler {
  return async (req: NextRequest, context: NextContext) => {
    const session = await auth0.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // If authenticated, call the original handler
    return handler(req, context);
  };
}
