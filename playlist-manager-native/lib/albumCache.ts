/**
 * In-memory cache of album detail responses, so the album pager can prefetch
 * neighbouring albums and swiping back to one already seen is instant.
 *
 * Entries expire after a few minutes so listening progress picked up by the
 * background sync isn't hidden for long. In-flight requests are shared, so a
 * prefetch and the page mounting moments later only cost one fetch.
 */

import { fetchAlbumDetail, AlbumDetail } from './api';

const TTL_MS = 5 * 60 * 1000;

type Entry = { promise: Promise<AlbumDetail>; data: AlbumDetail | null; fetchedAt: number };

const cache = new Map<string, Entry>();

function isFresh(entry: Entry): boolean {
  return Date.now() - entry.fetchedAt < TTL_MS;
}

/** Cached album detail, fetching it if missing or stale. */
export function getAlbumDetail(albumId: string): Promise<AlbumDetail> {
  const existing = cache.get(albumId);
  if (existing && isFresh(existing)) return existing.promise;

  const entry: Entry = { promise: fetchAlbumDetail(albumId), data: null, fetchedAt: Date.now() };
  cache.set(albumId, entry);
  entry.promise.then(
    data => { entry.data = data; },
    // Don't cache failures — the next caller should retry.
    () => { if (cache.get(albumId) === entry) cache.delete(albumId); }
  );
  return entry.promise;
}

/** Synchronously return a fresh cached album, if one has already loaded. */
export function peekAlbumDetail(albumId: string): AlbumDetail | null {
  const entry = cache.get(albumId);
  return entry && isFresh(entry) ? entry.data : null;
}

/** Warm the cache in the background; errors are left for the page to surface. */
export function prefetchAlbumDetail(albumId: string): void {
  getAlbumDetail(albumId).catch(() => {});
}

/** Apply a local change (e.g. a new rating) so revisiting the album reflects it. */
export function updateCachedAlbum(albumId: string, patch: Partial<AlbumDetail>): void {
  const entry = cache.get(albumId);
  if (!entry?.data) return;
  const data = { ...entry.data, ...patch };
  cache.set(albumId, { ...entry, data, promise: Promise.resolve(data) });
}
