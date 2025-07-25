'use client';
import React, { FC, useEffect, useState } from 'react';
import Link from 'next/link';
import AlbumIcon from '../icons/PlayingAlbumIcon';
import { ProgressCircle } from '../icons/dynamic/ProgressCircle';
import SongIcon from '../icons/SongIcon';
import PlaylistIcon from '../PlaylistIcon';
import { usePlaybackContext } from '../../../hooks/usePlaybackContext';
import Image from 'next/image';
import renderArtistList from '../../../utils/renderArtistsList';
import { PlaybackInfo } from '../../../utils/interfaces/PlaybackInfo';

const PlaybackFooterWrapper: FC = () => {
  const { playbackInfo, handlePausePlay } = usePlaybackContext();
  if (!playbackInfo) return null;
  return <PlaybackFooter playbackInfo={playbackInfo} handlePausePlay={handlePausePlay} />;
};

interface PlaybackFooterProps {
  playbackInfo: PlaybackInfo;
  handlePausePlay: () => Promise<void>;
}

const PlaybackFooter: FC<PlaybackFooterProps> = ({ playbackInfo, handlePausePlay }) => {
  const [trackProgress, setTrackProgress] = useState(playbackInfo.track_progress);
  const [albumProgress, setAlbumProgress] = useState(playbackInfo.album_progress);
  useEffect(() => {
    const trackInterval = setInterval(() => {
      if (playbackInfo.is_playing) {
        setTrackProgress(
          Math.min(
            playbackInfo.track_progress + Number(new Date()) - playbackInfo.timestamp,
            playbackInfo.track_duration
          )
        );
        setAlbumProgress(
          Math.min(
            playbackInfo.album_progress + Number(new Date()) - playbackInfo.timestamp,
            playbackInfo.album_duration
          )
        );
      }
    }, 1000);

    return () => clearInterval(trackInterval);
  }, [playbackInfo]);

  const playbackArtists =
    playbackInfo.type == 'track' ? renderArtistList(playbackInfo.album_artists) : playbackInfo.album_artists;

  return (
    <div className="flex w-full h-fit bg-background-offset px-4 py-2 text-sm sm:text-base space-x-4 sm:space-x-6">
      <div className="flex flex-col space-y-2 w-1/5 max-w-32">
        <button className="opacity-80 size-full" onClick={handlePausePlay}>
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
            <ProgressCircle percentage={Math.round((trackProgress / playbackInfo.track_duration) * 100)} />
          </div>
        </div>

        {playbackInfo.type == 'track' && (
          <Link href={`/album/${playbackInfo.album_id}`} className="flex flex-row justify-between">
            <div className="flex flex-row space-x-2">
              <AlbumIcon className="my-auto size-8 stroke-primary-darker" />
              <div className="my-auto text-balance">{playbackInfo.album_title}</div>
            </div>
            <div className="size-12 sm:size-16 my-auto">
              <ProgressCircle percentage={Math.round((albumProgress / playbackInfo.album_duration) * 100)} />
            </div>
          </Link>
        )}

        {playbackInfo.playlist?.id && (
          <Link
            href={`/playlist/${playbackInfo.playlist?.id}`}
            className={`flex flex-row justify-between ${playbackInfo.playlist ? '' : 'opacity-0'}`}>
            <div className="flex flex-row space-x-2">
              <PlaylistIcon className="my-auto size-8 fill-primary-darker" />
              <div className="my-auto text-balance">
                <div>{playbackInfo.playlist?.title}</div>
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
          </Link>
        )}
      </div>
    </div>
  );
};

export default PlaybackFooterWrapper;
