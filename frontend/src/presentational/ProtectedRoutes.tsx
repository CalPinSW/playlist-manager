import React from "react";
import { Navigate } from "react-router-dom";
import { useSpotifyAuthContext } from "../hooks/useSpotifyAuthContext";

interface ProtectedRouteProps {
    children: React.ReactElement
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const {isSpotifyLinked} = useSpotifyAuthContext()

  if (!isSpotifyLinked) {
    return <Navigate to="/login" />;
  }
  return children;
};