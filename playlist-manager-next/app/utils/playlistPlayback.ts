// Utility functions for playlist playback info, durations, and progress
import { Artist } from '@spotify/web-api-ts-sdk';
import prisma from '../../lib/prisma';
import { PlaybackInfo } from './interfaces/PlaybackInfo';

export async function getPlaylistByIdOrNone(playlistId: string) {
  return await prisma.playlist.findUnique({
    where: { id: playlistId },
    select: {
      id: true,
      name: true,
      image_url: true
    }
  });
}

export async function getPlaylistDuration(playlistId: string): Promise<number> {
  // Get all albums on the playlist
  const albums = await prisma.playlistalbumrelationship.findMany({
    where: { playlist_id: playlistId },
    select: { album_id: true }
  });
  const albumIds = albums.map(a => a.album_id);
  if (albumIds.length === 0) return 0;
  // Sum durations of all tracks in those albums
  const result = await prisma.track.aggregate({
    where: { album_id: { in: albumIds } },
    _sum: { duration_ms: true }
  });
  return result._sum.duration_ms || 0;
}

export async function getPlaylistDurationUpToTrack(playlistId: string, trackId: string): Promise<number> {
  // Get all albums on the playlist, ordered by album_index
  const albums = await prisma.playlistalbumrelationship.findMany({
    where: { playlist_id: playlistId },
    orderBy: { album_index: 'asc' },
    select: { album_id: true, album_index: true }
  });
  const albumOrder = albums.map(a => a.album_id);
  if (albumOrder.length === 0) return 0;
  // Get all tracks in those albums, with disc/track ordering
  const tracks = await prisma.track.findMany({
    where: { album_id: { in: albumOrder } },
    select: { id: true, duration_ms: true, album_id: true, disc_number: true, track_number: true }
  });
  // Sort tracks by album_index, disc_number, track_number
  tracks.sort((a, b) => {
    const albumA = albumOrder.indexOf(a.album_id);
    const albumB = albumOrder.indexOf(b.album_id);
    if (albumA !== albumB) return albumA - albumB;
    if (a.disc_number !== b.disc_number) return a.disc_number - b.disc_number;
    return a.track_number - b.track_number;
  });
  // Sum durations up to and including the given trackId
  let total = 0;
  for (const t of tracks) {
    total += t.duration_ms;
    if (t.id === trackId) break;
  }
  return total;
}

export interface PreProcessedPlaybackInfo {
  type: 'track' | 'episode';
  track_title: string;
  track_id: string;
  album_title: string;
  album_id: string;
  playlist_id: string;
  track_artists: string[];
  album_artists: Artist[];
  artwork_url: string;
  track_progress: number;
  track_duration: number;
  album_progress: number;
  album_duration: number;
  is_playing: boolean;
}

export async function buildPlaybackInfoWithPlaylist(
  playbackInfo: PreProcessedPlaybackInfo
): Promise<PlaybackInfo | PreProcessedPlaybackInfo> {
  if (!playbackInfo.playlist_id) return playbackInfo;
  const playlist = await getPlaylistByIdOrNone(playbackInfo.playlist_id);
  if (!playlist) return playbackInfo;
  const playlist_duration = await getPlaylistDuration(playbackInfo.playlist_id);
  const playlist_progress =
    (await getPlaylistDurationUpToTrack(playbackInfo.playlist_id, playbackInfo.track_id)) +
    (playbackInfo.track_progress || 0);
  return {
    ...playbackInfo,
    playlist: {
      id: playlist.id,
      title: playlist.name,
      progress: playlist_progress,
      duration: playlist_duration,
      artwork_url: playlist.image_url
    }
  };
}
