/**
 * Typed API client for the Vercel backend.
 *
 * Every request includes the Auth0 Bearer token from SecureStore.
 * Throws AuthError if the token is missing/expired and can't be refreshed.
 */

import { getValidAccessToken } from './auth';
import { API_ENDPOINTS } from '../constants/api';

export class AuthError extends Error {
  constructor(message = 'Not authenticated') {
    super(message);
    this.name = 'AuthError';
  }
}

async function authedFetch(url: string, options: RequestInit = {}): Promise<Response> {
  let token: string;
  try {
    token = await getValidAccessToken();
  } catch {
    throw new AuthError();
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers
    }
  });

  return response;
}

// ── Types ─────────────────────────────────────────────────────────────────────
export interface ProgressEntry {
  albumId: string;
  albumName: string;
  albumImageUrl: string;
  playlistId: string;
  playlistName: string;
  lastTrackIndex: number;
  totalTracks: number;
  listenedAt: string;
  progressPercent: number;
}

// ── API calls ─────────────────────────────────────────────────────────────────

/**
 * GET /api/progress — listening progress for all active albums, newest first.
 * The first item is the "current album" shown on the Now tab.
 */
export async function fetchProgress(): Promise<ProgressEntry[]> {
  const res = await authedFetch(API_ENDPOINTS.progress);
  if (!res.ok) throw new Error(`fetchProgress failed: ${res.statusText}`);
  return res.json();
}

/**
 * POST /api/sync-history — triggers recently_played sync for the current user.
 * Call on every app open after auth. Fire-and-forget is acceptable; await for
 * freshest data before rendering the Now tab.
 */
export async function syncHistory(): Promise<void> {
  const res = await authedFetch(API_ENDPOINTS.syncHistory, { method: 'POST' });
  if (!res.ok) throw new Error(`syncHistory failed: ${res.statusText}`);
}
