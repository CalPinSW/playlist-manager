import { useQuery } from "@tanstack/react-query";
import React, { FC, useEffect, useState } from "react";
import { getPlaybackInfo, getPlaylistProgress, pauseOrStartPlayback, pausePlayback, startPlayback } from "../api";
import { PlaybackInfo, PlaylistProgress } from "../interfaces/PlaybackInfo";
import { ProgressCircle } from "../components/ProgressCircle";
import useWindowSize from "../hooks/useWindowSize";
import SongIcon from "../components/SongIcon";
import AlbumIcon from "../components/AlbumIcon";
import PlaylistIcon from "../components/PlaylistIcon";
import { usePlaybackContext } from "../hooks/usePlaybackContext";
import { Link } from "react-router-dom";

const PlaybackFooter: FC = () => {
  const { isMobileView } = useWindowSize();
  const { playbackInfo, playlistProgress } = usePlaybackContext();

  if (!playbackInfo) return null;

  const handlePausePlayClick = (): void => {
    pauseOrStartPlayback()
  }

  return (
    <div className="w-full h-fit bg-primary-300 px-4 py-2 text-sm sm:text-base">
      <div className="flex space-x-4 sm:space-x-6">
        <div className="flex flex-col space-y-2 w-1/5 max-w-32">
          <button className="opacity-80 w-full h-full" onClick={handlePausePlayClick}>
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
              <SongIcon className="my-auto w-8 h-8" />
              <div className="my-auto text-balance">
                {playbackInfo.track_title}
              </div>
            </div>
            <div className="w-12 h-12 sm:w-16 sm:h-16 my-auto">
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
              <AlbumIcon className="my-auto w-8 h-8" />
              <div className="my-auto text-balance">
                {playbackInfo.album_title}
              </div>
            </div>
            <div className="w-12 h-12 sm:w-16 sm:h-16 my-auto">
              <ProgressCircle
                percentage={Math.round(
                  (playbackInfo.album_progress / playbackInfo.album_duration) *
                    100
                )}
              />
            </div>
          </div>

          {playbackInfo?.playlist_id && (
            <div
              className={`flex flex-row justify-between ${
                playlistProgress ? "" : "opacity-0"
              }`}
            >
              <div className="flex flex-row space-x-2">
                <PlaylistIcon className="my-auto w-8 h-8" />
                <div className="my-auto text-balance">
                  {playlistProgress && (
                    <Link to={`edit/${playlistProgress?.playlist_id}`}>
                      {playlistProgress?.playlist_title}
                    </Link>
                  )}
                </div>
              </div>
              <div className="w-12 h-12 sm:w-16 sm:h-16 my-auto">
                <ProgressCircle
                  percentage={
                    playlistProgress
                      ? Math.round(
                          (playlistProgress.playlist_progress /
                            playlistProgress.playlist_duration) *
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
