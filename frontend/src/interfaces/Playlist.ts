import { Moment } from "moment";

export interface Playlist {
  id: number;
  title: string;
  description?: string;
  createdAt: Moment;
}
