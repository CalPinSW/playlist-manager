import { User } from "./User";
import { Image } from "./Image";
import { Track } from "./Track";

export interface PlaylistTrack {
  added_at: string;
  added_by?: User;
  is_local: boolean;
  track: Track; // | Episode; ToDo: Add frontend episode handling
}

export interface Playlist {
  collaborative: false;
  name: string;
  description: string;
  external_urls: {
    spotify: string;
  };
  href: string;
  id: string;
  images: Image[];
  owner: User;
  public: false;
  snapshot_id: string;
  tracks: {
    href: string;
    limit: number;
    next?: string;
    offset: number;
    previous?: string;
    total: number;
    items: PlaylistTrack[];
  };
  type: string;
  uri: string;
}
