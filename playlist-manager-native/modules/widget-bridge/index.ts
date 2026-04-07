/**
 * Widget bridge — JS-side API for the native WidgetBridgeModule.
 *
 * Provides two capabilities:
 *  1. writeNowPlaying(data) — writes current album data to App Group
 *     UserDefaults and reloads all WidgetKit timelines.
 *  2. writeAuthToken(token) — stores the Vercel JWT in the App Group
 *     Keychain so the widget extension's SetRatingIntent can call the API.
 *
 * On non-iOS platforms (Android, web) all calls are no-ops so the rest of
 * the app doesn't need platform guards.
 */

import { Platform } from 'react-native';
import WidgetBridgeModule from './WidgetBridgeModule';

export interface NowPlayingWidgetData {
  albumId: string;
  albumName: string;
  artistName: string;
  /** Remote https:// URL — the native module downloads and caches it */
  imageUrl: string;
  /** Current rating 1–5 (half-stars collapsed), or 0 if unrated */
  rating: number;
  isPlaying: boolean;
}

/**
 * Write now-playing data to the widget and trigger a timeline reload.
 * Safe to call on every poll tick — debounce is handled in the native module
 * (skips write if data is identical to last write).
 */
export async function writeNowPlaying(data: NowPlayingWidgetData): Promise<void> {
  if (Platform.OS !== 'ios') return;
  try {
    await WidgetBridgeModule.writeNowPlaying(
      data.albumId,
      data.albumName,
      data.artistName,
      data.imageUrl,
      data.rating,
      data.isPlaying
    );
  } catch (err) {
    // Non-fatal — widget data is just stale, not broken.
    console.warn('[widget-bridge] writeNowPlaying failed:', err);
  }
}

/**
 * Persist the Vercel JWT in the App Group Keychain.
 * Call this after every successful token refresh.
 */
export async function writeAuthToken(token: string): Promise<void> {
  if (Platform.OS !== 'ios') return;
  try {
    await WidgetBridgeModule.writeAuthToken(token);
  } catch (err) {
    console.warn('[widget-bridge] writeAuthToken failed:', err);
  }
}
