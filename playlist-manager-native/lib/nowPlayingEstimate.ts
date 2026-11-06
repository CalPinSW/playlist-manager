import type { NowPlaying, ProgressEntry } from './api';

/** An album the estimate has moved through, as it should appear in progress. */
export type EstimatedAlbum = {
  albumId: string;
  albumName: string;
  albumImageUrl: string;
  artistNames: string[];
  lastTrackIndex: number;
  totalTracks: number;
};

export type NowPlayingEstimate = {
  nowPlaying: NowPlaying;
  /**
   * Set only when the estimate crossed into a later album: the current album
   * first, then the albums it finished, most recent first.
   */
  albums: EstimatedAlbum[];
};

/**
 * Projects a cached NowPlaying forward by elapsedMs, assuming playback carried
 * on uninterrupted through the album and any upcoming albums in the playlist.
 * Only for display until the next live poll.
 *
 * Returns null once the estimate passes the end of what we know — the last
 * upcoming album, or the current track if the snapshot has no track list —
 * since we can't tell what played after that.
 */
export function estimateNowPlaying(snapshot: NowPlaying, elapsedMs: number): NowPlayingEstimate | null {
  if (!('albumId' in snapshot) || !snapshot.isPlaying) return { nowPlaying: snapshot, albums: [] };

  const upcoming = [...(snapshot.upcomingAlbums ?? [])];
  const finished: EstimatedAlbum[] = [];
  let album = {
    albumId: snapshot.albumId,
    albumName: snapshot.albumName,
    albumImageUrl: snapshot.albumImageUrl,
    albumUri: snapshot.albumUri,
    artistNames: [snapshot.artistName],
    tracks: snapshot.tracks ?? [],
  };
  let index = snapshot.trackIndex;
  let positionMs = snapshot.progressMs + elapsedMs;
  let durationMs = snapshot.durationMs;

  while (positionMs >= durationMs) {
    positionMs -= durationMs;
    index += 1;
    if (index >= album.tracks.length) {
      const next = upcoming.shift();
      if (!next?.tracks.length) return null;
      finished.unshift(toEstimatedAlbum(album, album.tracks.length - 1));
      album = next;
      index = 0;
    }
    durationMs = album.tracks[index].durationMs;
  }

  return {
    nowPlaying: {
      ...snapshot,
      albumId: album.albumId,
      albumName: album.albumName,
      albumImageUrl: album.albumImageUrl,
      albumUri: album.albumUri,
      artistName: album.artistNames.join(', '),
      trackIndex: index,
      trackName: album.tracks[index]?.name ?? snapshot.trackName,
      totalTracks: album.tracks.length || snapshot.totalTracks,
      progressMs: positionMs,
      durationMs,
      tracks: album.tracks,
      upcomingAlbums: upcoming,
    },
    albums: finished.length > 0 ? [toEstimatedAlbum(album, index), ...finished] : [],
  };
}

function toEstimatedAlbum(
  album: Omit<EstimatedAlbum, 'lastTrackIndex' | 'totalTracks'> & { tracks: unknown[] },
  lastTrackIndex: number,
): EstimatedAlbum {
  return {
    albumId: album.albumId,
    albumName: album.albumName,
    albumImageUrl: album.albumImageUrl,
    artistNames: album.artistNames,
    lastTrackIndex,
    totalTracks: album.tracks.length,
  };
}

/**
 * Puts the albums from an estimate at the front of the progress list, the same
 * place a real listen would put them, creating entries for albums not yet
 * started. The result is for display only and is never cached.
 */
export function mergeEstimatedAlbums(
  progress: ProgressEntry[],
  albums: EstimatedAlbum[],
  playlist: { id: string; name: string },
  listenedAt: string,
): ProgressEntry[] {
  if (albums.length === 0) return progress;

  const inPlaylist = progress.filter(e => e.playlistId === playlist.id);
  const estimated = albums.map((album): ProgressEntry => {
    const existing = inPlaylist.find(e => e.albumId === album.albumId);
    return {
      ...album,
      artistNames: existing?.artistNames.length ? existing.artistNames : album.artistNames,
      playlistId: playlist.id,
      playlistName: playlist.name,
      totalPlaylistAlbums: inPlaylist[0]?.totalPlaylistAlbums ?? 0,
      listenedAt,
      progressPercent: Math.round(((album.lastTrackIndex + 1) / album.totalTracks) * 100),
    };
  });

  const estimatedIds = new Set(albums.map(a => a.albumId));
  const rest = progress.filter(e => !(e.playlistId === playlist.id && estimatedIds.has(e.albumId)));
  return [...estimated, ...rest];
}
