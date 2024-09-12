import React, { FC } from "react";
import { ButtonWithLoadingState } from "./PopulateUserDatabaseButton";
import { populateAdditionalAlbumDetails, populateUniversalGenreList, populateUserAlbumGenres, populateUserData, populateAlbumTracks, populatePlaylistAlbumTracks, populateTrackArtists} from "../api";

export const SettingsPage: FC = () => {
  return (
    <div className="py-4 px-2 space-y-2">
        <h1 className="text-3xl">Settings</h1>
        <div className="flex flex-col justify-between space-y-2">
          <ButtonWithLoadingState text="Populate user data" actionCallback={populateUserData} />
          <ButtonWithLoadingState text="Populate additional album details" actionCallback={populateAdditionalAlbumDetails} />
          <ButtonWithLoadingState text="Populate universal genre list" actionCallback={populateUniversalGenreList} />
          <ButtonWithLoadingState text="Populate user album genres" actionCallback={populateUserAlbumGenres} />
          <ButtonWithLoadingState text="Populate album tracks" actionCallback={populateAlbumTracks} />
          <ButtonWithLoadingState text="Populate playlist album indexes" actionCallback={populatePlaylistAlbumTracks} />
          <ButtonWithLoadingState text="Populate track artists" actionCallback={populateTrackArtists} />
        </div>
    </div>
  );
};
