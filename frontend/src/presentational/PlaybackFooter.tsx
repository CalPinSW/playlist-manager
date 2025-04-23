import React, { FC } from "react";
import { pausePlayback, startPlayback } from "../api";
import { ProgressCircle } from "../components/ProgressCircle";
import SongIcon from "../components/SongIcon";
import AlbumIcon from "../components/AlbumIcon";
import PlaylistIcon from "../components/PlaylistIcon";
import { usePlaybackContext } from "../hooks/usePlaybackContext";
import { Link } from "react-router-dom";
import { useAuthorizedRequest } from "../hooks/useAuthorizedRequest";

const PlaybackFooter: FC = () => {
  const { playbackInfo } = usePlaybackContext();
  const authorizedRequest = useAuthorizedRequest();
  if (!playbackInfo) return null;

  const handlePausePlayClick = async (): Promise<void> => {
    if (playbackInfo.is_playing){
      await authorizedRequest(pausePlayback());
    } else {
      await authorizedRequest(startPlayback());
    }
  }

  return (
    <div className="flex-shrink-0 w-full h-fit bg-background-offset px-4 py-2 text-sm sm:text-base">
      <div className="flex space-x-4 sm:space-x-6">
        <div className="flex flex-col space-y-2 w-1/5 max-w-32">
          <button className="opacity-80 size-full" onClick={handlePausePlayClick}>
            <img src={playbackInfo.artwork_url}></img>
          </button>
          <div>Playing:</div>
          <div className="text-balance">
            {playbackInfo.album_artists.join(", ")}
          </div>
        </div>
        <div className="flex flex-col w-4/5 text-sm space-y-2">
          <div className="flex flex-row justify-between">
            <div className="flex flex-row space-x-2">
              <SongIcon className={`my-auto size-8 fill-primary-darker ${playbackInfo.is_playing && "animate-bounce"}`} />
              <div className="my-auto text-balance">
                {playbackInfo.track_title}
              </div>
            </div>
            <div className="size-12 sm:size-16 my-auto">
              <ProgressCircle
                percentage={Math.round(
                  (playbackInfo.track_progress / playbackInfo.track_duration) *
                    100
                )}
              />
            </div>
          </div>

          <div className="flex flex-row justify-between">
            <div className="flex flex-row space-x-2">
              <AlbumIcon className="my-auto size-8 stroke-primary-darker" />
              <div className="my-auto text-balance">
                {playbackInfo.album_title}
              </div>
            </div>
            <div className="size-12 sm:size-16 my-auto">
              <ProgressCircle
                percentage={Math.round(
                  (playbackInfo.album_progress / playbackInfo.album_duration) *
                    100
                )}
              />
            </div>
          </div>

          {playbackInfo.playlist?.id && (
            <div
              className={`flex flex-row justify-between ${
                playbackInfo.playlist ? "" : "opacity-0"
              }`}
            >
              <div className="flex flex-row space-x-2">
                <PlaylistIcon className="my-auto size-8 fill-primary-darker" />
                <div className="my-auto text-balance">
                  {playbackInfo.playlist && (
                    <Link to={`edit/${playbackInfo.playlist?.id}`}>
                      {playbackInfo.playlist?.title}
                    </Link>
                  )}
                </div>
              </div>
              <div className="size-12 sm:size-16 my-auto">
                <ProgressCircle
                  percentage={
                    playbackInfo.playlist
                      ? Math.round(
                          (playbackInfo.playlist.progress /
                            playbackInfo.playlist.duration) *
                            100
                        )
                      : 0
                  }
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlaybackFooter;
