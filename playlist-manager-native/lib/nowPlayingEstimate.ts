import type { NowPlaying } from './api';

/**
 * Projects a cached NowPlaying forward by elapsedMs, assuming playback carried
 * on through the album uninterrupted. Only for display until the next live poll.
 *
 * Returns null once the estimate passes the end of what we know — the end of
 * the album, or the end of the current track if the snapshot has no track list —
 * since we can't tell what played after that.
 */
export function estimateNowPlaying(snapshot: NowPlaying, elapsedMs: number): NowPlaying | null {
  if (!('albumId' in snapshot) || !snapshot.isPlaying) return snapshot;

  const tracks = snapshot.tracks ?? [];
  let index = snapshot.trackIndex;
  let positionMs = snapshot.progressMs + elapsedMs;
  let durationMs = snapshot.durationMs;

  while (positionMs >= durationMs) {
    positionMs -= durationMs;
    index += 1;
    if (index >= tracks.length) return null;
    durationMs = tracks[index].durationMs;
  }

  return {
    ...snapshot,
    trackIndex: index,
    trackName: index === snapshot.trackIndex ? snapshot.trackName : tracks[index].name,
    progressMs: positionMs,
    durationMs,
  };
}
