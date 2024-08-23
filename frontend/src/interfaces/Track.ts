import { Album } from "./Album";
import { Artist } from "./Artist";

export interface Track {
  album: Album;
  artists: Artist[];
  available_markets: string[];
  disc_number: number;
  duration_ms: number;
  explicit: boolean;
  href: string;
  id: string;
  is_playable?: boolean;
  name: string;
  popularity: number;
  preview_url: string[];
  track_number: number;
  type: string;
  uri: string;
  is_local: boolean;
}
