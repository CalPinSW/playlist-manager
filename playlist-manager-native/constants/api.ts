/**
 * Base URL for the Vercel backend API.
 *
 * In production this is the deployed Vercel URL.
 * During local development, point to your ngrok tunnel or local server.
 *
 * To override at build time: set EXPO_PUBLIC_API_BASE_URL in your .env file.
 */
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://playlist-manager-next.vercel.app';

export const API_ENDPOINTS = {
  progress: `${API_BASE_URL}/api/progress`,
  syncHistory: `${API_BASE_URL}/api/sync-history`,
  playlists: `${API_BASE_URL}/api/playlists`,
  user: `${API_BASE_URL}/api/user`,
} as const;
