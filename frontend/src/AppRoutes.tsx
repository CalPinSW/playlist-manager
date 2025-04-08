import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { PlaylistExplorer } from "./playlistExplorer/PlaylistExplorer";
import Layout from "./presentational/Layout";
import { getPlaylist } from "./api";
import { Login } from "./Login";
import { Index } from "./MainPage";
import { SettingsPage } from "./settingsPage/SettingsPage";

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route index element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route
            path="/edit/:playlistId"
            element={<PlaylistExplorer />}
            loader={async ({ params }) => {
              if (!params.playlistId) {
                throw new Error("Playlist ID is required");
              }
              return getPlaylist(params.playlistId);
            }}
          />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
};

export default AppRoutes;
