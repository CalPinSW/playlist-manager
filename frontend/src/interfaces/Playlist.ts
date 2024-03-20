import { SPUser } from "./SPUser";
import { PlaylistImage } from "./PlaylistImage";

export interface Playlist {
  collaborative: false;
  name: string;
  description: string;
  external_urls: {
    spotify: string;
  };
  href: string;
  id: string;
  images: PlaylistImage[];
  owner: SPUser;
  public: false;
  snapshot_id: string;
  tracks: {
    href: string;
    total: 0;
  };
  type: string;
  uri: string;
}
