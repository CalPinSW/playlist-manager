import React, { FC, useEffect, useState } from "react";
import { Playlist } from "../interfaces/Playlist";
import { Link, useLoaderData } from "react-router-dom";
import Button from "../components/Button";
import { Form, useForm } from "react-hook-form";
import {
  getPlaylistAlbums,
  getPlaylistTracks,
  playlistSearch,
  populatePlaylist,
  updatePlaylist,
} from "../api";
import { useQuery } from "@tanstack/react-query";
import { Album } from "../interfaces/Album";
import { AlbumList } from "./AlbumList/AlbumList";
import { TrackList } from "./TrackList/TrackList";
import { usePlaybackContext } from "../hooks/usePlaybackContext";
import { Track } from "../interfaces/Track";
import InputWithLabelPlaceholder from "../components/Inputs/InputWithLabelPlaceholder";
import ButtonAsync from "../components/ButtonAsync";
import { ImageLink, useDownloadImages } from "../hooks/useDownload";

enum ViewMode {
  ALBUM = "album",
  TRACK = "track",
}

export const PlaylistExplorer: FC = () => {
  const playlist = useLoaderData() as Playlist;
  const { control, register, getValues } = useForm({
    defaultValues: playlist,
  });
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.ALBUM);

  const { data: playlistAlbums } = useQuery<Album[]>({
    queryKey: ["playlist albums info", playlist.id],
    queryFn: () => {
      return getPlaylistAlbums(playlist.id);
    },
    retry: false,
  });

  
  const { data: playlistTracks } = useQuery<Track[]>({
    queryKey: ["playlist track info", playlist.id],
    queryFn: () => {
      return getPlaylistTracks(playlist.id);
    },
    retry: false,
  });

  const [associatedPlaylists, setAssociatedPlaylists] = useState<Playlist[]>(
    []
  );

  useEffect(() => {
    if (playlist.name.slice(0, 10) === "New Albums") {
      playlistSearch(playlist.name.slice(11)).then(
        (associatedPlaylists: Playlist[]) => {
          setAssociatedPlaylists(associatedPlaylists.filter((associatedPlaylist) => associatedPlaylist.name !== playlist.name));
        }
      );
    }
  }, []);

  const { playbackInfo } = usePlaybackContext();
  
  const [images,setImages] = useState<ImageLink[]>([])

  useEffect(()=> {
    if (playlistAlbums) {
      setImages(playlistAlbums.map((album) => ({url: album.image_url, name: `${album.name} - ${album.artists.map((artist) => artist.name).join(", ")}`})))
    }
  }, playlistAlbums)

  const {handleZip} = useDownloadImages()

  return (
    <div className="p-2 text-sm sm:text-base space-y-4">
      <Form
        onSubmit={() => {
          updatePlaylist(getValues());
        }}
        control={control}
      >
        <div className="flex flex-col my-4 space-y-2">
          <InputWithLabelPlaceholder
            register={register("name")}
            type="text"
            name="name"
            placeholder={"Title"}
            defaultValue={playlist.name}
          />
          <InputWithLabelPlaceholder
            register={register("description")}
            type="text"
            name="description"
            placeholder={"Description"}
            defaultValue={playlist.description}
          />
        </div>
        <div className="flex flex-row space-x-4 justify-end sm:justify-start mx-2">
          <Button className="flex" type="submit">
            Update details
          </Button>
          <div className="flex my-auto">
            <Link to={`/`}>Back</Link>
          </div>
        </div>
      </Form>
      <ButtonAsync className="flex" onClick={() => populatePlaylist(playlist.id)}>
        Sync new playlist data
      </ButtonAsync>
      <>
        <div className=" mt-2">
          <button
            className="border-solid rounded-md border border-primary-500 w-full flex justify-between overflow-hidden"
            disabled={!playlistAlbums}
            onClick={() => {
              if (viewMode === ViewMode.ALBUM) {
                setViewMode(ViewMode.TRACK);
              } else {
                setViewMode(ViewMode.ALBUM);
              }
            }}
          >
            <h2
              className={`p-2 flex grow text-right ${
                viewMode === ViewMode.ALBUM ? "bg-primary-darker" : ""
              } ${!playlistAlbums ? "opacity-50 disabled" : ""}`}
            >
              {`Album View (${playlistAlbums?.length ?? 0})`}
            </h2>
            <h2
              className={`p-2 flex grow ${
                viewMode === ViewMode.TRACK ? "bg-primary-darker" : ""
              }`}
            >
              {`Track View (${playlistTracks?.length ?? 0})`}
            </h2>
          </button>
        </div>
        <div className="my-2">
          {viewMode == ViewMode.ALBUM && playlistAlbums && (
            <AlbumList
              albumList={playlistAlbums}
              activeAlbumId={playbackInfo?.album_id}
              contextPlaylist={playlist}
              associatedPlaylists={associatedPlaylists}
            />
          )}
          {viewMode == ViewMode.TRACK &&  playlistTracks &&(
            <TrackList
              trackList={playlistTracks}
              activeTrackId={playbackInfo?.track_id}
            />
          )}
        </div>
      </>
      {images.length > 0 && <Button onClick={() => handleZip(playlist.name, images)}>Download Album Images</Button>}
    </div>
  );
};
