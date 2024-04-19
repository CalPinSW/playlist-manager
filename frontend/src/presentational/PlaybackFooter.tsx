import { useQuery } from "@tanstack/react-query";
import React, { FC } from "react";
import { getPlaybackInfo, getPlaylistProgress } from "../api";
import { PlaybackInfo, PlaylistProgress } from "../interfaces/PlaybackInfo";
import { ProgressCircle } from "../components/ProgressCircle";
import useWindowSize from "../hooks/useWindowSize";
import SongIcon from "../components/SongIcon";
import AlbumIcon from "../components/AlbumIcon";
import PlaylistIcon from "../components/PlaylistIcon";

const PlaybackFooter: FC = () => {
  const { isMobileView } = useWindowSize();
  const { data: playbackInfo } = useQuery<PlaybackInfo>({
    queryKey: ["playbackInfo"],
    queryFn: () => {
      return getPlaybackInfo();
    },
    retry: false,
    refetchInterval: 5000,
    refetchIntervalInBackground: false,
  });
  const { data: playlistProgress } = useQuery<PlaylistProgress | undefined>({
    queryKey: ["playlistProgress"],
    queryFn: () => {
      if (playbackInfo?.playlist_id) {
        return getPlaylistProgress(playbackInfo);
      }
    },
    retry: false,
    refetchInterval: 60000,
    refetchIntervalInBackground: false,
    enabled: !!playbackInfo?.playlist_id,
  });
  if (!playbackInfo) return null;
  return (
    <div className="w-full h-fit bg-purple-200 p-1 text-sm sm:text-base">
      <div className="flex space-x-4 sm:space-x-6">
        <div className="flex flex-col space-y-2 w-1/5 max-w-48">
          <div>{`Playing: ${playbackInfo.album_artists.join(", ")}`}</div>
          <img src={playbackInfo.artwork_url}></img>
        </div>
        <div className="flex flex-col text-sm space-y-2">
          <div className="flex flex-row">
            <div className="flex flex-row space-x-2">
              <SongIcon className="my-auto w-6 h-6" />
              <div className="my-auto w-48">{playbackInfo.track_title}</div>
            </div>
            <div className="w-12 h-12 sm:w-20 sm:h-20 my-auto">
              <ProgressCircle
                percentage={Math.round(
                  (playbackInfo.track_progress / playbackInfo.track_duration) *
                    100
                )}
              />
            </div>
          </div>

          <div className="flex flex-row">
            <div className="flex flex-row space-x-2">
              <AlbumIcon className="my-auto w-6 h-6" />
              <div className="my-auto w-48">{playbackInfo.album_title}</div>
            </div>
            <div className="w-12 h-12 sm:w-20 sm:h-20 my-auto">
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
              className={`flex flex-row ${playlistProgress ? "" : "opacity-0"}`}
            >
              <div className="flex flex-row space-x-2">
                <PlaylistIcon className="my-auto w-6 h-6" />
                <div className="my-auto w-48">
                  {playlistProgress?.playlist_title}
                </div>
              </div>
              <div className="w-12 h-12 sm:w-20 sm:h-20 my-auto">
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
