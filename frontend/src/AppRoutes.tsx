import React, { FC } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { PlaylistExplorer } from "./playlistExplorer/PlaylistExplorer";
import Layout from "./presentational/Layout";
import { getPlaylist } from "./api";
import { Login } from "./Login";
import { Index } from "./MainPage";
import { SettingsPage } from "./settingsPage/SettingsPage";
import { ProtectedRoute } from "./presentational/ProtectedRoutes";
import { PlaybackContextProvider } from "./context/PlaybackContext";
import { useAuthorizedRequest } from "./hooks/useAuthorizedRequest";


//ToDo: https://tkdodo.eu/blog/react-query-meets-react-router
const AppRoutes: FC = () => {
  const authorizedRequest = useAuthorizedRequest()
  const router = createBrowserRouter([
    {
      path: "/",
      element: <ProtectedRoute><PlaybackContextProvider><Layout /></PlaybackContextProvider></ProtectedRoute>,
      children: [
        { index: true, element: <Index /> },
        { path: "/settings", element: <SettingsPage /> },
        {
          path: "/edit/:playlistId",
          element: <PlaylistExplorer />,
          loader: async ({ params: { playlistId } }) => {
            
            if (!playlistId) {
              throw Error;
            }
            return authorizedRequest(getPlaylist(playlistId));
          },
        },
      ],
    },
    { path: "/", element: <Layout />, children: [
        { path: "/login", element: <Login /> },
      ]
    },
  ]);
  return <RouterProvider router={router} />;
};

export default AppRoutes;
