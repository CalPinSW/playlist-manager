import { NextRequest, NextResponse } from 'next/server';
import { auth0 } from '../../lib/auth0';

export type HandlerContext = { params: Record<string, string> };

type Handler = (req: NextRequest, context?: HandlerContext) => Promise<Response>;

export function withAuth(handler: Handler): Handler {
  return async (req, context) => {
    const session = await auth0.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // If authenticated, call the original handler
    return handler(req, context);
  };
}
