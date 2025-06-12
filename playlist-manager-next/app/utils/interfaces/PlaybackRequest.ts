export type OffsetType = "position" | "uri" | "album_id";

export interface Offset {
  type: OffsetType;
}

export interface PositionOffset extends Offset {
  type: "position";
  position: number;
}

export interface UriOffset extends Offset {
  type: "uri";
  uri: string;
}

export interface AlbumIdOffset extends Offset {
  type: "album_id";
  album_id: string;
}

export type PlaybackOffset = PositionOffset | UriOffset | AlbumIdOffset;

export interface StartPlaybackRequest {
  context_uri?: string;
  uris?: string[];
  offset?: PlaybackOffset;
  position_ms?: number;
}

export interface ResumePlaybackRequest {
  id: string;
  context_uri?: string;
}
