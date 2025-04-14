import { createContext, useContext, useEffect, useState } from "react"
import { useAuth0, WebAuthorizeParameters } from "react-native-auth0"
import { router, useSegments, useRootNavigationState } from "expo-router"

// Define the shape of our auth context
type AuthContextType = {
  signIn: () => Promise<void>
  signOut: () => Promise<void>
  isAuthenticated: boolean
  isLoading: boolean
  user: any
  error: Error | null
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType | null>(null)

// Provider component that wraps the app
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { authorize, clearSession, user, error, isLoading } =
    useAuth0()
  
  const segments = useSegments()
  const navigationState = useRootNavigationState()

  // Check if the user is authenticated and redirect accordingly
  useEffect(() => {
    if (!navigationState?.key) return
    
    const inAuthGroup = segments[0] === "(public)"
    if (!!user && inAuthGroup) {
      // Redirect authenticated users from auth screens to the main app
      router.replace("/(protected)")
    } else if (!user && !inAuthGroup) {
      // Redirect unauthenticated users to the login screen
      router.replace("/(public)")
    }
  }, [user, segments, navigationState?.key])

  // Sign in function
  const signIn = async () => {
    try {
      await authorize({audience: "https://playmanbackend.com"})
    } catch (e) {
      console.error("Login error:", e)
    }
  }

  // Sign out function
  const signOut = async () => {
    try {
      await clearSession()
    } catch (e) {
      console.error("Logout error:", e)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        signIn,
        signOut,
        isAuthenticated: !!user,
        isLoading,
        user,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// Custom hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
