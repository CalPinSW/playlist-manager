import React, { FC } from "react";
import { ButtonWithLoadingState } from "./PopulateUserDatabaseButton";
import { populateAdditionalAlbumDetails, populateUniversalGenreList, populateUserData } from "../api";

export const SettingsPage: FC = () => {
  return (
    <div className="py-4 px-2 space-y-2">
        <h1 className="text-3xl">Settings</h1>
        <div className="flex flex-col justify-between space-y-2">
          <ButtonWithLoadingState text="Populate user data" actionCallback={populateUserData} />
          <ButtonWithLoadingState text="Populate additional album details" actionCallback={populateAdditionalAlbumDetails} />
          <ButtonWithLoadingState text="Populate universal genre list" actionCallback={populateUniversalGenreList} />
        </div>
    </div>
  );
};
