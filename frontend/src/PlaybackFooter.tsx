import { useQuery } from "@tanstack/react-query";
import React, { FC } from "react";
import { getPlaybackInfo, getPlaylistProgress } from "./api";
import { PlaybackInfo, PlaylistProgress } from "./interfaces/PlaybackInfo";
import { ProgressCircle } from "./components/ProgressCircle";

const PlaybackFooter: FC = () => {
  const { data: playbackInfo } = useQuery<PlaybackInfo>({
    queryKey: ["playbackInfo"],
    queryFn: () => {
      return getPlaybackInfo();
    },
    staleTime: 5000,
  });
  const { data: playlistProgress } = useQuery<PlaylistProgress | undefined>({
    queryKey: ["playlistProgress"],
    queryFn: () => {
      if (playbackInfo?.playlist_id) {
        return getPlaylistProgress(playbackInfo);
      }
    },
    staleTime: 60000,
    enabled: !!playbackInfo?.playlist_id,
  });
  if (!playbackInfo) return null;
  return (
    <div className="fixed bottom-0 w-full h-36 bg-purple-200">
      <h3 className="m-2">Currently Playing</h3>
      <div className="flex space-x-6">
        <img src={playbackInfo.artwork_url} className="h-24"></img>
        <div className="flex flex-col">
          <div>{playbackInfo.album_artists.join(", ")}</div>
          <div>{playbackInfo.album_title}</div>
          <div>{playbackInfo.track_title}</div>
          {playlistProgress?.playlist_title && (
            <div>{playlistProgress.playlist_title}</div>
          )}
        </div>
        <div className="flex flex-col">
          <div>Track Progress</div>
          <div className="w-12 h-12">
            <ProgressCircle
              percentage={Math.round(
                (playbackInfo.track_progress / playbackInfo.track_duration) *
                  100
              )}
            />
          </div>
        </div>
        <div className="flex flex-col">
          <div>Album Progress</div>
          <ProgressCircle
            percentage={Math.round(
              (playbackInfo.album_progress / playbackInfo.album_duration) * 100
            )}
          />
        </div>
        {playlistProgress && (
          <div className="flex flex-col">
            <div>Playlist Progress</div>
            <ProgressCircle
              percentage={Math.round(
                (playlistProgress.playlist_progress /
                  playlistProgress.playlist_duration) *
                  100
              )}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default PlaybackFooter;
