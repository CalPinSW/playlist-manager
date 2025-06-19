import { FC, Fragment } from 'react';
import { AlbumWithTracks } from '../[artistId]/page';
import renderArtistsList from '../../../utils/renderArtistsList';

interface TrackListProps {
  album: AlbumWithTracks;
}

const TrackList: FC<TrackListProps> = ({ album }) => {
  return (
    <div className="max-h-[30vh] overflow-auto grid grid-cols-[3fr_2fr_1fr] w-full bg-background-offset rounded-md p-2">
      <div className="px-1 py-2 font-bold">Title</div>
      <div className="px-2 py-2 font-bold">Artist</div>
      <div className="px-1 py-2 text-right font-bold">Duration</div>
      {album.tracks.map(track => (
        <Fragment key={track.id}>
          <div className="p-1" key={track.id + '-title'}>
            {track.name}
          </div>
          <div className="border-x-2 border-background py-1 px-2" key={track.id + '-artist'}>
            {renderArtistsList(track.artists)}
          </div>
          <div className="text-right p-1" key={track.id + '-duration'}>
            {formatDurationMs(track.duration_ms)}
          </div>
        </Fragment>
      ))}
    </div>
  );
};

export default TrackList;

export function formatDurationMs(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');

  if (hrs > 0) {
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  } else {
    return `${pad(mins)}:${pad(secs)}`;
  }
}
