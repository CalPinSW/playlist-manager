import { Artist, SimplifiedArtist } from '@spotify/web-api-ts-sdk';

export type PlaybackInfo = EpisodePlaybackInfo | TrackPlaybackInfo;

interface EpisodePlaybackInfo extends PlaybackBase {
  type: 'episode';
  track_artists: string;
  album_artists: string;
}

interface TrackPlaybackInfo extends PlaybackBase {
  type: 'track';
  track_artists: SimplifiedArtist[];
  album_artists: Artist[];
}

interface PlaybackBase {
  type: 'track' | 'episode';
  track_title: string;
  track_id: string;
  album_title: string;
  album_id: string;
  track_artists: SimplifiedArtist[] | string;
  album_artists: Artist[] | string;
  artwork_url: string;
  track_progress: number;
  track_duration: number;
  album_progress: number;
  album_duration: number;
  is_playing: boolean;
  playlist?: PlaylistProgress;
}

export interface PlaylistProgress {
  id: string;
  title: string;
  progress: number;
  duration: number;
  artwork_url: string;
}
