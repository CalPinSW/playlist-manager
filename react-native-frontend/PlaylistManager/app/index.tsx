import { Redirect } from "expo-router"
import { useAuth } from "../contexts/authContext"

export default function AuthRedirectHandler() {
  const { isAuthenticated, isLoading, error } = useAuth()
  
  if (isLoading || error) {
    return null
  }

  return isAuthenticated ? (
    <Redirect href="/(protected)" />
  ) : (
    <Redirect href="/(public)" />
  )
}