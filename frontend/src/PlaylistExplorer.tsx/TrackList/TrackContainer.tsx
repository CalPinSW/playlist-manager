import React, { FC } from "react";
import { Track } from "../../interfaces/Track";

interface TrackContainerProps {
  index: number;
  track: Track;
}

export const TrackContainer: FC<TrackContainerProps> = ({ index, track }) => {
  return (
    <div className="flex flex-row text-sm space-x-2">
      <div className="flex w-1/2 whitespace-wrap">
        {index}: {track.name}
      </div>
      <div className="flex w-1/2 whitespace-wrap">
        {track.artists.map((artist) => artist.name).join(", ")}
      </div>
    </div>
  );
};
