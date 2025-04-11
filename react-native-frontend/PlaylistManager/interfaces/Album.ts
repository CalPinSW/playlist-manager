import { Artist } from "./Artist";

export interface Album {
  album_type: string;
  total_tracks: number;
  available_markets: string[];
  href: string;
  id: string;
  image_url: string;
  name: string;
  release_date: string;
  release_date_precision: string;
  type: string;
  uri: string;
  artists: Artist[];
  genres?: string[];
  label?: string;
  popularity?: number;
}
