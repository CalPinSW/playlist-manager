import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {Auth0Provider} from 'react-native-auth0';
import { AuthProvider } from '../contexts/authContext';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useColorScheme } from 'react-native';
export { ErrorBoundary } from 'expo-router';
import Constants from 'expo-constants';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(public)',
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

  const { auth0Domain, auth0ClientId } = Constants.expoConfig?.extra ?? {};

  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <QueryClientProvider client={queryClient}>
          <Auth0Provider 
            domain={auth0Domain} 
            clientId={auth0ClientId}
            redirectUri={`${auth0Scheme}://${auth0Domain}/android/${auth0ClientId}/callback`}
          >
            <AuthProvider>
              <Stack>
                <Stack.Screen name="(protected)" options={{ headerShown: false }} />
                <Stack.Screen name="(public)" options={{ headerShown: false }} />
              </Stack>
              <StatusBar style={'auto'} />
            </AuthProvider>
          </Auth0Provider>
        </QueryClientProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
