export interface GenreInfo {
  count: number;
  name: string;
}

export interface ArtistInfo {
  name: string;
  spotifyId: string;
}
export interface AlbumInfo {
  name: string;
  artists: ArtistInfo[];
  albumImageUrl?: string;
  type?: string;
  summary?: string;
  summary_html?: string;
  genres?: GenreInfo[];
}
