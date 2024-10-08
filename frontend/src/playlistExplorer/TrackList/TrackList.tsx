import React, { FC } from "react";
import { TrackContainer } from "./TrackContainer";
import Box from "../../components/Box";
import SongIcon from "../../components/SongIcon";
import ArtistIcon from "../../components/ArtistIcon";
import { Track } from "../../interfaces/Track";

interface TrackListProps {
	trackList: Track[];
	activeTrackId?: string;
}
export const TrackList: FC<TrackListProps> = ({ trackList, activeTrackId }) => {
	return (
		<Box>
			<div className=" sm:mx-24 space-y-1 ">
				<div className="flex w-full">
					<div className="w-1/2">
						<SongIcon className="h-12 mx-auto fill-text-primary" />
					</div>
					<div className="w-1/2">
						<ArtistIcon className="h-12 mx-auto fill-text-primary" />
					</div>
				</div>
				<div className="h-[50vh] overflow-scroll ">
					{trackList.map((track, index) => (
						<TrackContainer
							index={index + 1}
							track={track}
							key={track.id}
							active={track.id == activeTrackId}
						/>
					))}
				</div>
			</div>
		</Box>
	);
};
