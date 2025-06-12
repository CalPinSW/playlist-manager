"use client"

import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import prisma from "../../../lib/prisma";
import { album, playlist } from "../../generated/prisma";
import { usePlaybackContext } from "../../hooks/usePlaybackContext";
import { ImageLink, useDownloadImages } from "../../hooks/useDownload";
import { fetchPlaylists } from "../../pages/index/PlaylistSearch";
import Link from "next/link";


enum ViewMode {
  ALBUM = "album",
  TRACK = "track",
}

export default async function Index () {
  const router = useRouter();
  const playlistId = router.query.playlistId as string;
  const playlist = await prisma.playlist.findUnique({where: {id: playlistId}});
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.ALBUM);
  const [associatedPlaylists, setAssociatedPlaylists] = useState<playlist[]>([]);
  const { playbackInfo } = usePlaybackContext();
  const [images, setImages] = useState<ImageLink[]>([]);

  const playlistAlbums = await getPlaylistAlbumsWithGenres(playlistId)
  
  const playlistTracks = await getPlaylistTracks(playlistId)


    if (playlist?.name.startsWith("New Albums")) {
    fetchPlaylists(playlist.name.slice(11)).then((associated) => {
        setAssociatedPlaylists(
        associated.filter((p) => p.name !== playlist.name)
        );
    });
    }

    if (playlistAlbums) {
        setImages(
        playlistAlbums.map((album, i) => ({
            url: album.image_url,
            name: `${i + 1}_${album.name} - ${album.artists
            .map((artist) => artist.name)
            .join(", ")}`,
        }))
        );
    }

if (playlist?.name.slice(0, 10) === "New Albums") {
    fetchPlaylists(playlist.name.slice(11)).then(
        (associatedPlaylists: playlist[]) => {
        setAssociatedPlaylists(associatedPlaylists.filter((associatedPlaylist) => associatedPlaylist.name !== playlist.name));
        }
    );
    }

  const { handleZip } = useDownloadImages();
  const copyAlbumArtistList = async (data: album[]): Promise<void> => {
    const albumArtistList = data.map(album => {
      const artistNames = album.artists.map(artist => artist.name).join(", ");
      return `${album.name} - ${artistNames}`;
    }).join("\n");

    try {
      await navigator.clipboard.writeText(albumArtistList);
      toast("Copied album list to clipboard!");
    } catch (err) {
      console.error("Failed to copy:", err);
      toast("Failed to copy album list 😕", {type: "error"});
    }
  }
  if (!playlist) return <p>Playlist not found</p>;

  return (
    <div className="p-2 text-sm sm:text-base space-y-4">
        <div className="flex flex-col my-4 space-y-2">
          <input
            placeholder={"Title"}
            defaultValue={playlist.name}
          />
          <input
            placeholder={"Description"}
            defaultValue={playlist.description}
          />
        </div>
        <div className="flex flex-row space-x-4 justify-end sm:justify-start mx-2">
          <button className="flex" type="submit">
            Update details
          </button>
          <div className="flex my-auto">
            <Link href={`/`}>Back</Link>
          </div>
        </div>
      <button 
        className="flex" 
        // onClick={() => authorizedRequest(populatePlaylist(playlist.id))}
      >
        Sync new playlist data
      </button>
      <button 
        //onClick={() => authorizedRequest(resumePlayback({id: playlist.id }))}
      >
          Resume Playlist
      </button>
      <>
        <div className="mt-2">
        <div className="mt-2">
          <button
            className="border-solid rounded-md border border-primary-500 w-full flex justify-between overflow-hidden"
            disabled={!playlistAlbums}
            onClick={() =>
              setViewMode(viewMode === ViewMode.ALBUM ? ViewMode.TRACK : ViewMode.ALBUM)
            }
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
          {viewMode === ViewMode.ALBUM && playlistAlbums && (
            <AlbumList
              albumList={playlistAlbums}
              activeAlbumId={playbackInfo?.album_id}
              contextPlaylist={playlist}
              associatedPlaylists={associatedPlaylists}
            />
          )}
          {viewMode === ViewMode.TRACK && playlistTracks && (
            <TrackList trackList={playlistTracks} activeTrackId={playbackInfo?.track_id} />
          )}
        </div>
        </div>
      </>
      {images.length > 0 && (
        <button onClick={() => handleZip(playlist.name, images)}>
          Download Album Images
        </button>
      )}
      <ToastContainer />
      {playlistAlbums && (
        <button onClick={() => void copyAlbumArtistList(playlistAlbums)}>
          Copy Album List
        </button>
      )}
    </div>
  );
};

async function getPlaylistAlbumsWithGenres(playlist_id: string) {
  // Fetch albums for the playlist, ordered by album_index, with genres, artists, and notes
  const playlistAlbums = await prisma.playlistalbumrelationship.findMany({
    where: { playlist_id },
    orderBy: { album_index: 'asc' },
    include: {
      album: {
        select: {
          id: true,
          name: true,
          image_url: true,
          uri: true,
          albumgenrerelationship: {
            include: { genre: { select: { name: true } } }
          },
          albumartistrelationship: {
            include: { artist: { select: { name: true } } }
          },
          album_notes: {
            select: { text: true }
          }
        }
      }
    }
  });

  // Transform to match the Python output structure
  return playlistAlbums.map(rel => {
    const album = rel.album;
    return {
      id: album.id,
      name: album.name,
      image_url: album.image_url,
      genres: album.albumgenrerelationship.map(g => g.genre.name),
      artists: album.albumartistrelationship.map(a => ({ name: a.artist.name })),
      notes: album.album_notes.map(n => n.text),
      uri: album.uri,
    };
  });
}

async function getPlaylistTracks(playlist_id: string) {
  // Find all tracks for the playlist, ordered by album_index, disc_number, track_number
  const playlistAlbums = await prisma.playlistalbumrelationship.findMany({
    where: { playlist_id },
    orderBy: { album_index: 'asc' },
    include: {
      album: {
        select: {
          id: true,
          name: true,
          track: {
            orderBy: [
              { disc_number: 'asc' },
              { track_number: 'asc' }
            ],
            include: {
              trackartistrelationship: {
                include: { artist: { select: { name: true } } }
              }
            }
          }
        }
      }
    }
  });

  // Flatten tracks from all albums, preserving album_index order
  const result: Array<any> = [];
  for (const rel of playlistAlbums) {
    const album = rel.album;
    for (const track of album.track) {
      result.push({
        id: track.id,
        name: track.name,
        album: { name: album.name },
        artists: track.trackartistrelationship.map(rel => ({ name: rel.artist.name })),
      });
    }
  }
  return result;
}