import { PlaybackState, Track, SpotifyApi } from '@spotify/web-api-ts-sdk';
import prisma from '../../../../../lib/prisma';
import { PlaybackInfo } from '../../../../utils/interfaces/PlaybackInfo';
import { buildPlaybackInfoWithPlaylist, PreProcessedPlaybackInfo } from '../../../../utils/playlistPlayback';

export const getPlayback = async (spotifySdk: SpotifyApi, userId: string): Promise<PlaybackInfo> => {
  const playback = await spotifySdk.player.getPlaybackState();
  if (!playback) {
    return null;
  }
  if (playback.currently_playing_type === 'episode') {
    return null;
    // return buildEpisodePlaybackResponse(playback);
  } else {
    await upsertAlbumPlaybackState(playback, userId);

    const context = playback.context;

    let playlistId: string | null = null;

    if (context && context.type === 'playlist') {
      playlistId = context.uri.replace('spotify:playlist:', '');
      await upsertPlaylistPlaybackState(playback, playlistId, userId);
    }

    const item = playback.item as Track;
    const album = await spotifySdk.albums.get(item.album.id);
    const album_duration = album?.tracks.items.reduce((acc, t) => acc + t.duration_ms, 0) ?? 0;
    // Find index of current track in album
    const trackIndex = album?.tracks?.items.findIndex(t => t.id === item.id) ?? -1;
    const album_progress =
      (trackIndex > 0 ? album.tracks.items.slice(0, trackIndex).reduce((acc, t) => acc + t.duration_ms, 0) : 0) +
      (playback.progress_ms ?? 0);
    const playbackInfo: PreProcessedPlaybackInfo = {
      type: 'track',
      track_title: item.name,
      track_id: item.id,
      album_title: item.album.name,
      album_id: item.album.id,
      playlist_id: playlistId,
      track_artists: item.artists,
      album_artists: album?.artists,
      artwork_url: item.album.images?.[0]?.url ?? '',
      track_progress: playback.progress_ms,
      track_duration: item.duration_ms,
      album_progress: album_progress,
      album_duration: album_duration,
      is_playing: playback.is_playing
    };
    return buildPlaybackInfoWithPlaylist(playbackInfo);
  }
};

// const buildEpisodePlaybackResponse = (playback: PlaybackState): PlaybackInfo => {
//   const item = playback.item as Episode;
//   return {
//     type: 'episode',
//     track_title: item.name,
//     track_id: item.id,
//     album_title: item.show.name,
//     album_id: item.show.id,
//     track_artists: item.show.publisher,
//     album_artists: item.show.publisher,
//     artwork_url: item.images?.[0]?.url ?? '',
//     track_progress: playback.progress_ms,
//     track_duration: item.duration_ms,
//     album_progress: 0,
//     album_duration: item.show.total_episodes,
//     is_playing: playback.is_playing
//   };
// };

const upsertAlbumPlaybackState = async (playbackInfo: PlaybackState, userId: string): Promise<void> => {
  const track = playbackInfo.item as Track;
  const playbackStateAlbumRelationship = await prisma.playbackstatealbumrelationship.findUnique({
    where: {
      album_id_user_id: {
        album_id: track.album.id,
        user_id: userId
      }
    }
  });
  if (playbackStateAlbumRelationship) {
    await prisma.playback_state.update({
      where: { id: playbackStateAlbumRelationship.playback_state_id },
      data: {
        item_id: playbackInfo.item.id,
        progress_ms: playbackInfo.progress_ms,
        timestamp: new Date(playbackInfo.timestamp),
        type: playbackInfo.currently_playing_type
      }
    });
  } else {
    const playbackState = await prisma.playback_state.create({
      data: {
        item_id: playbackInfo.item.id,
        progress_ms: playbackInfo.progress_ms,
        timestamp: new Date(playbackInfo.timestamp),
        type: playbackInfo.currently_playing_type
      }
    });
    await prisma.playbackstatealbumrelationship.create({
      data: {
        playback_state_id: playbackState.id,
        album_id: track.album.id,
        user_id: userId
      }
    });
  }
};

const upsertPlaylistPlaybackState = async (
  playbackInfo: PlaybackState,
  playlistId: string,
  userId: string
): Promise<void> => {
  const playbackStatePlaylistRelationship = await prisma.playbackstateplaylistrelationship.findUnique({
    where: {
      playlist_id_user_id: {
        playlist_id: playlistId,
        user_id: userId
      }
    }
  });

  if (playbackStatePlaylistRelationship) {
    await prisma.playback_state.update({
      where: { id: playbackStatePlaylistRelationship.playback_state_id },
      data: {
        item_id: playbackInfo.item.id,
        progress_ms: playbackInfo.progress_ms,
        timestamp: new Date(playbackInfo.timestamp),
        type: playbackInfo.currently_playing_type
      }
    });
  } else {
    const playbackState = await prisma.playback_state.create({
      data: {
        item_id: playbackInfo.item.id,
        progress_ms: playbackInfo.progress_ms,
        timestamp: new Date(playbackInfo.timestamp),
        type: playbackInfo.currently_playing_type
      }
    });
    await prisma.playbackstateplaylistrelationship.create({
      data: {
        playback_state_id: playbackState.id,
        playlist_id: playlistId,
        user_id: userId
      }
    });
  }
};
