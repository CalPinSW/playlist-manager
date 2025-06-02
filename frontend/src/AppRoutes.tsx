import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { PlaylistExplorer } from "./playlistExplorer/PlaylistExplorer";
import Layout from "./presentational/Layout";
import { Login } from "./Login";
import { Index } from "./MainPage";
import { SettingsPage } from "./settingsPage/SettingsPage";
import { ProtectedRoute, UnprotectedRoute } from "./presentational/ProtectedRoutes";
import { PlaybackContextProvider } from "./context/PlaybackContext";
import { getPlaylist } from "./api";
import { useAuthorizedRequest } from "./hooks/useAuthorizedRequest";


const AppRoutes = () => {
  const authorizedRequest = useAuthorizedRequest()
  
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<UnprotectedRoute><Layout /></UnprotectedRoute>}> 
          <Route index element={<Login />} />
        </Route>
        <Route path="/" element={<ProtectedRoute><PlaybackContextProvider><Layout withFooter /></PlaybackContextProvider></ProtectedRoute>} >
          <Route index element={<Index />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route
            path="/edit/:playlistId"
            element={<PlaylistExplorer />}
            loader={async ({ params }) => {
              if (!params.playlistId) {
                throw new Error("Playlist ID is required");
              }
              return authorizedRequest(getPlaylist(params.playlistId));
            }}
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
