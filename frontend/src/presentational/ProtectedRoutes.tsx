import React from "react";
import { Navigate } from "react-router-dom";
import { useSpotifyAuthContext } from "../hooks/useSpotifyAuthContext";

interface ProtectedRouteProps {
    children: React.ReactElement
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const {user, isSpotifyLinked} = useSpotifyAuthContext()

  return user && isSpotifyLinked ? children : <Navigate to="/login" />;
};

export const UnprotectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const {user, isSpotifyLinked} = useSpotifyAuthContext()

  return user && isSpotifyLinked ? <Navigate to="/" /> : children;
};