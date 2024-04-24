export interface PlaybackInfo {
  track_title: string;
  track_id: string;
  album_title: string;
  album_id: string;
  playlist_id?: string;
  track_artists: string[];
  album_artists: string[];
  artwork_url: string;
  track_progress: number;
  track_duration: number;
  album_progress: number;
  album_duration: number;
}

export interface PlaylistProgress {
  playlist_id: string;
  playlist_title: string;
  playlist_progress: number;
  playlist_duration: number;
}
