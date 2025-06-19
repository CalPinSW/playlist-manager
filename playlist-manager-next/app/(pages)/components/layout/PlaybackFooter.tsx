'use client';
import React, { FC } from 'react';
import Link from 'next/link';
import AlbumIcon from '../icons/AlbumIcon';
import { ProgressCircle } from '../icons/dynamic/ProgressCircle';
import SongIcon from '../icons/SongIcon';
import PlaylistIcon from '../PlaylistIcon';
import { usePlaybackContext } from '../../../hooks/usePlaybackContext';
import Image from 'next/image';
import renderArtistList from '../../../utils/renderArtistsList';

const PlaybackFooter: FC = () => {
  const { playbackInfo } = usePlaybackContext();
  if (!playbackInfo) return null;

  const handlePausePlayClick = async (): Promise<void> => {
    if (playbackInfo.is_playing) {
      await fetch('/api/spotify/playback/pause');
    } else {
      await fetch('/api/spotify/playback/start');
    }
  };

  const playbackArtists =
    playbackInfo.type == 'track' ? renderArtistList(playbackInfo.album_artists) : playbackInfo.album_artists;

  return (
    <div className="flex w-full h-fit bg-background-offset px-4 py-2 text-sm sm:text-base space-x-4 sm:space-x-6">
      <div className="flex flex-col space-y-2 w-1/5 max-w-32">
        <button className="opacity-80 size-full" onClick={handlePausePlayClick}>
          <Image
            width={128}
            height={128}
            src={playbackInfo.artwork_url}
            alt={playbackInfo.album_title + ' artwork'}></Image>
        </button>
        <div>Playing:</div>
        <div className="text-balance">{playbackArtists}</div>
      </div>
      <div className="flex flex-col w-4/5 text-sm space-y-2">
        <div className="flex flex-row justify-between">
          <div className="flex flex-row space-x-2">
            <SongIcon className={`my-auto size-8 fill-primary-darker ${playbackInfo.is_playing && 'animate-bounce'}`} />
            <div className="my-auto text-balance">{playbackInfo.track_title}</div>
          </div>
          <div className="size-12 sm:size-16 my-auto">
            <ProgressCircle
              percentage={Math.round((playbackInfo.track_progress / playbackInfo.track_duration) * 100)}
            />
          </div>
        </div>

        {playbackInfo.type == 'track' && (
          <div className="flex flex-row justify-between">
            <div className="flex flex-row space-x-2">
              <AlbumIcon className="my-auto size-8 stroke-primary-darker" />
              <div className="my-auto text-balance">{playbackInfo.album_title}</div>
            </div>
            <div className="size-12 sm:size-16 my-auto">
              <ProgressCircle
                percentage={Math.round((playbackInfo.album_progress / playbackInfo.album_duration) * 100)}
              />
            </div>
          </div>
        )}

        {playbackInfo.playlist?.id && (
          <div className={`flex flex-row justify-between ${playbackInfo.playlist ? '' : 'opacity-0'}`}>
            <div className="flex flex-row space-x-2">
              <PlaylistIcon className="my-auto size-8 fill-primary-darker" />
              <div className="my-auto text-balance">
                {playbackInfo.playlist && (
                  <Link href={`/playlist/${playbackInfo.playlist?.id}`}>{playbackInfo.playlist?.title}</Link>
                )}
              </div>
            </div>
            <div className="size-12 sm:size-16 my-auto">
              <ProgressCircle
                percentage={
                  playbackInfo.playlist
                    ? Math.round((playbackInfo.playlist.progress / playbackInfo.playlist.duration) * 100)
                    : 0
                }
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlaybackFooter;
