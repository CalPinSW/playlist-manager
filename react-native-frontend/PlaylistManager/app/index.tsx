import { Redirect } from "expo-router"
import { useAuth } from "../contexts/sessionContext"

export default function Index() {
  const { isAuthenticated, isLoading, error } = useAuth()
  
  // While checking authentication status, don't redirect yet
  if (isLoading || error) {
    return null
  }
  // Redirect based on authentication status
  return isAuthenticated ? (
    <Redirect href="/(protected)" />
  ) : (
    <Redirect href="/(public)" />
  )
}