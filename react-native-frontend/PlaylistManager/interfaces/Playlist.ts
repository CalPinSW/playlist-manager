import { User } from "./User";
import { Track } from "./Track";

export interface Playlist {
  collaborative: false;
  name: string;
  description: string;
  external_urls: {
    spotify: string;
  };
  href: string;
  id: string;
  image_url?: string;
  owner: User;
  public: false;
  snapshot_id: string;
  tracks: Track[];
  type: string;
  uri: string;
}
