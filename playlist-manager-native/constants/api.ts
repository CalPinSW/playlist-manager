/**
 * Base URL for the Vercel backend API.
 *
 * Priority:
 * 1. EXPO_PUBLIC_API_BASE_URL env var (set in .env)
 * 2. Stable production alias — tracks whatever is deployed to main.
 *
 * For local development, use ngrok to expose your local server and set
 * EXPO_PUBLIC_API_BASE_URL in .env.
 */
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  'https://playlist-manager-calums-projects-8679c2fb.vercel.app';

if (__DEV__) {
  console.log('[api] Using backend:', API_BASE_URL);
}

export const API_ENDPOINTS = {
  progress: `${API_BASE_URL}/api/progress`,
  syncHistory: `${API_BASE_URL}/api/sync-history`,
  playlists: `${API_BASE_URL}/api/playlists`,
  user: `${API_BASE_URL}/api/user`,
} as const;
