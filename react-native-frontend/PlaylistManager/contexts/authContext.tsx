import React, { createContext, useContext, useEffect } from "react"
import { useAuth0 } from "react-native-auth0"
import { router, useSegments, useRootNavigationState } from "expo-router"

type AuthContextType = {
  signIn: () => Promise<void>
  signOut: () => Promise<void>
  authorizedRequest: <T>(request: (token: string) => Promise<T>) => Promise<T>
  isAuthenticated: boolean
  isLoading: boolean
  user: any
  error: Error | null
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { authorize, clearSession, user, error, isLoading, getCredentials } = useAuth0();
  
  const segments = useSegments()
  const navigationState = useRootNavigationState()

  useEffect(() => {
    if (!navigationState?.key) return
    
    const inAuthGroup = segments[0] === "(public)"
    if (!!user && inAuthGroup) {
      router.replace("/(protected)")
    } else if (!user && !inAuthGroup) {
      router.replace("/(public)")
    }
  }, [user, segments, navigationState?.key])

  const signIn = async () => {
    try {
      await authorize({audience: "https://playmanbackend.com"})
    } catch (e) {
      console.error("Login error:", e)
    }
  }

  const signOut = async () => {
    try {
      await clearSession()
    } catch (e) {
      console.error("Logout error:", e)
    }
  }

  async function authorizedRequest <T>(request: (token: string) => Promise<T>) {
    const credentials = await getCredentials()
    if (credentials) {
      const token = await credentials?.accessToken;
      return request(token);
    } else {
      await clearSession();
      router.push("/");
      throw Error("Error sending authorized request, signing out");
      } 
    };

  return (
    <AuthContext.Provider
      value={{
        signIn,
        signOut,
        authorizedRequest,
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

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
};
