import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, NavigationContainer, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Slot, Stack, useNavigationContainerRef } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {Auth0Provider} from 'react-native-auth0';
import { AuthProvider } from '../contexts/sessionContext';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(unprotected)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}
const queryClient = new QueryClient();

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const auth0Scheme = "playlistmanager"
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <QueryClientProvider client={queryClient}>
        <Auth0Provider 
          domain={process.env.EXPO_PUBLIC_AUTH0_DOMAIN} 
          clientId={process.env.EXPO_PUBLIC_AUTH0_CLIENT_ID}
          redirectUri={`${auth0Scheme}://${process.env.EXPO_PUBLIC_AUTH0_DOMAIN}/android/${process.env.EXPO_PUBLIC_AUTH0_CLIENT_ID}/callback`}
        >
          <AuthProvider>
            <Slot/>
          </AuthProvider>
        </Auth0Provider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
