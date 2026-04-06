/**
 * Base URL for the Vercel backend API.
 *
 * Priority:
 * 1. EXPO_PUBLIC_API_BASE_URL env var (set in .env)
 * 2. The Vercel preview URL for the claude/weekend-2-expo branch
 *    (used until PRs #85 + #86 are merged to main and production is updated)
 *
 * Once both PRs are merged, switch to the stable production alias:
 *   https://playlist-manager-calums-projects-8679c2fb.vercel.app
 */
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  'https://playlist-manager-git-claude-wee-2d2730-calums-projects-8679c2fb.vercel.app';

if (__DEV__) {
  console.log('[api] Using backend:', API_BASE_URL);
}

export const API_ENDPOINTS = {
  progress: `${API_BASE_URL}/api/progress`,
  syncHistory: `${API_BASE_URL}/api/sync-history`,
  playlists: `${API_BASE_URL}/api/playlists`,
  user: `${API_BASE_URL}/api/user`,
} as const;
