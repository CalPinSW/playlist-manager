import React, { FC } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { EditPlaylist } from "./EditPlaylist";
import Layout from "./presentational/Layout";
import { getPlaylist } from "./api";
import { Login } from "./Login";
import { Index } from "./MainPage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <Index /> },
      { path: "/login", element: <Login /> },
      {
        path: "/edit/:playlistId",
        element: <EditPlaylist />,
        loader: async ({ params: { playlistId } }) => {
          if (!playlistId) {
            throw Error;
          }
          return getPlaylist(playlistId);
        },
      },
    ],
  },
]);
//ToDo: https://tkdodo.eu/blog/react-query-meets-react-router
const AppRoutes: FC = () => {
  return <RouterProvider router={router} />;
};

export default AppRoutes;
