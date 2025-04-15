export interface PlaybackInfo {
  track_title: string;
  track_id: string;
  album_title: string;
  album_id: string;
  track_artists: string[];
  album_artists: string[];
  artwork_url: string;
  track_progress: number;
  track_duration: number;
  album_progress: number;
  album_duration: number;
  is_playing: boolean;
  playlist?: PlaylistProgress
}

export interface PlaylistProgress {
  id: string;
  title: string;
  progress: number;
  duration: number;
  artwork_url: string;
}
