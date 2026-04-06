/**
 * Typed API client for the Vercel backend.
 *
 * Every request includes the Auth0 Bearer token from SecureStore.
 * Throws AuthError if the token is missing/expired and can't be refreshed.
 */

import { getValidAccessToken } from './auth';
import { API_ENDPOINTS, albumUrl, playlistAlbumsUrl, addAlbumToPlaylistUrl } from '../constants/api';

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
  } catch (err) {
    console.error('[api] Failed to get access token:', err);
    throw new AuthError();
  }

  if (__DEV__) {
    console.log(`[api] ${options.method ?? 'GET'} ${url}`);
    // Log token shape to diagnose opaque vs JWT tokens.
    // JWT access tokens start with 'eyJ'. Opaque tokens don't.
    const isJwt = token.startsWith('eyJ');
    console.log(`[api] token: ${isJwt ? 'JWT ✓' : 'OPAQUE ✗ (audience not set?)'} — first 20 chars: ${token.slice(0, 20)}...`);
    if (!isJwt) {
      console.warn('[api] Auth0 issued an opaque token. Set EXPO_PUBLIC_AUTH0_AUDIENCE in .env to get a JWT.');
    }
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers
    }
  });

  if (__DEV__) {
    console.log(`[api] → ${response.status} ${response.statusText}`);
  }

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

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PlaylistSummary {
  id: string;
  name: string;
  image_url: string | null;
  description: string;
  created_at: string;
}

export interface PlaylistAlbum {
  id: string;
  name: string;
  imageUrl: string;
  uri: string;
  totalTracks: number;
  artists: { id: string; name: string }[];
  genres: string[];
  progress: {
    lastTrackIndex: number;
    totalTracks: number;
    progressPercent: number;
  } | null;
}

export interface AlbumTrack {
  id: string;
  name: string;
  trackNumber: number;
  discNumber: number;
  durationMs: number;
  uri: string;
}

export interface AlbumDetail {
  id: string;
  name: string;
  imageUrl: string;
  uri: string;
  releaseDate: string;
  totalTracks: number;
  artists: { id: string; name: string }[];
  genres: string[];
  tracks: AlbumTrack[];
  onPlaylists: { id: string; name: string }[];
  progress: {
    lastTrackIndex: number;
    totalTracks: number;
    listenedAt: string;
    playlistId: string;
  } | null;
  rating: number | null;
}

// ── API calls ─────────────────────────────────────────────────────────────────

/**
 * GET /api/progress — listening progress for all active albums, newest first.
 * The first item is the "current album" shown on the Now tab.
 */
export async function fetchProgress(): Promise<ProgressEntry[]> {
  const res = await authedFetch(API_ENDPOINTS.progress);
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.error('[api] fetchProgress failed:', res.status, body);
    throw new Error(`fetchProgress failed: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

/**
 * POST /api/sync-history — triggers recently_played sync for the current user.
 * Call on every app open after auth. Fire-and-forget is acceptable; await for
 * freshest data before rendering the Now tab.
 */
export async function syncHistory(): Promise<void> {
  const res = await authedFetch(API_ENDPOINTS.syncHistory, { method: 'POST' });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.error('[api] syncHistory failed:', res.status, body);
    throw new Error(`syncHistory failed: ${res.status} ${res.statusText}`);
  }
}

/**
 * GET /api/playlists — user's playlists, optionally filtered by search term.
 */
export async function fetchPlaylists(search = '', limit = 20): Promise<PlaylistSummary[]> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (search) params.set('search', search);
  const res = await authedFetch(`${API_ENDPOINTS.playlists}?${params}`);
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.error('[api] fetchPlaylists failed:', res.status, body);
    throw new Error(`fetchPlaylists failed: ${res.status}`);
  }
  return res.json();
}

/**
 * GET /api/playlists/[playlistId]/albums — all albums in a playlist with progress.
 */
export async function fetchPlaylistAlbums(playlistId: string): Promise<PlaylistAlbum[]> {
  const res = await authedFetch(playlistAlbumsUrl(playlistId));
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.error('[api] fetchPlaylistAlbums failed:', res.status, body);
    throw new Error(`fetchPlaylistAlbums failed: ${res.status}`);
  }
  return res.json();
}

/**
 * GET /api/albums?search= — search across all user albums by name or artist.
 */
export async function searchAlbums(search: string, limit = 20): Promise<PlaylistAlbum[]> {
  const params = new URLSearchParams({ search, limit: String(limit) });
  const res = await authedFetch(`${API_ENDPOINTS.albums}?${params}`);
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.error('[api] searchAlbums failed:', res.status, body);
    throw new Error(`searchAlbums failed: ${res.status}`);
  }
  // Shape the response from the albums API format into PlaylistAlbum format
  const raw: Array<{
    id: string;
    name: string;
    image_url: string;
    uri: string;
    total_tracks: number;
    artists: { id: string; name: string }[];
    onPlaylists: { id: string; name: string }[];
  }> = await res.json();
  return raw.map(a => ({
    id: a.id,
    name: a.name,
    imageUrl: a.image_url,
    uri: a.uri,
    totalTracks: a.total_tracks,
    artists: a.artists,
    genres: [],
    progress: null
  }));
}

/**
 * GET /api/albums/[albumId] — full album detail with tracks, progress, rating.
 */
export async function fetchAlbumDetail(albumId: string): Promise<AlbumDetail> {
  const res = await authedFetch(albumUrl(albumId));
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.error('[api] fetchAlbumDetail failed:', res.status, body);
    throw new Error(`fetchAlbumDetail failed: ${res.status}`);
  }
  return res.json();
}

/**
 * POST /api/playlists/[playlistId]/add-album — promote an album to a playlist.
 * Used for "Add to Best Albums". Idempotent — returns 403 if already present.
 */
export async function promoteAlbum(albumId: string, targetPlaylistId: string): Promise<void> {
  const res = await authedFetch(addAlbumToPlaylistUrl(targetPlaylistId), {
    method: 'POST',
    body: JSON.stringify({ albumId })
  });
  if (!res.ok && res.status !== 403) {
    const body = await res.text().catch(() => '');
    console.error('[api] promoteAlbum failed:', res.status, body);
    throw new Error(`promoteAlbum failed: ${res.status}`);
  }
}
