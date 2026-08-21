import '../global.css';

import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { Ionicons } from '@expo/vector-icons';
import * as Sentry from '@sentry/react-native';
import { getStoredTokens, isTokenExpired, getValidAccessToken, ReauthRequiredError } from '../lib/auth';

// Guard against re-init: Metro Fast Refresh re-executes this module's
// top-level code on every save while iterating on this file, which would
// otherwise spin up a new client/transport on top of the existing one.
if (!Sentry.getClient()) {
  Sentry.init({
    dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
    // EXPO_PUBLIC_SENTRY_ENVIRONMENT is set per EAS build profile (see
    // eas.json) so preview builds don't get tagged as production — __DEV__
    // alone can't tell a preview build from a production one, both are
    // release-mode.
    environment: process.env.EXPO_PUBLIC_SENTRY_ENVIRONMENT ?? (__DEV__ ? 'development' : 'production'),
    tracesSampleRate: 0.2
  });
}

/**
 * Root layout. Handles auth gate:
 * - If no stored tokens → redirect to login
 * - If tokens exist but expired and un-refreshable → redirect to login
 * - If tokens valid → proceed to (tabs)
 *
 * The auth check runs once on mount. Token refresh is handled by getValidAccessToken
 * on every API call, so the app doesn't need to re-check here after the initial gate.
 */
function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const [authChecked, setAuthChecked] = useState(false);

  // Pre-load Ionicons font before the tab bar renders so Font.loadAsync
  // is never called lazily in a production build (where an unhandled rejection
  // would crash the app via Hermes' strict promise-rejection handling).
  const [fontsLoaded] = useFonts({ ...Ionicons.font });

  useEffect(() => {
    async function checkAuth() {
      try {
        const stored = await getStoredTokens();
        const inAuthGroup = segments[0] === '(auth)';

        if (!stored?.accessToken) {
          if (!inAuthGroup) router.replace('/(auth)/login');
          return;
        }

        if (isTokenExpired(stored.expiresAt)) {
          // Try silent refresh. Only bounce to login if Auth0 actually
          // rejected the refresh token — a transient failure (e.g. no
          // network yet at cold start) shouldn't log the user out, and
          // shouldn't be treated as a valid session either; the tab
          // screens will retry the refresh on their own API calls.
          try {
            await getValidAccessToken();
          } catch (err) {
            if (err instanceof ReauthRequiredError && !inAuthGroup) {
              router.replace('/(auth)/login');
            }
            return;
          }
        }

        if (inAuthGroup) router.replace('/(tabs)');
      } catch (err) {
        // Unexpected failure (e.g. a SecureStore/Keychain read error) —
        // report it instead of crashing via an unhandled rejection, and
        // leave navigation as-is rather than bouncing the user mid-failure.
        Sentry.captureException(err);
      } finally {
        setAuthChecked(true);
      }
    }
    checkAuth();
  // Intentionally omit segments from deps — we only want to check auth once on mount.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!authChecked || !fontsLoaded) return null;

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#0f0a1e' }
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen
          name="album/[albumId]"
          options={{
            headerShown: true,
            headerStyle: { backgroundColor: '#0f0a1e' },
            headerTintColor: '#843dff',
            headerTitle: '',
            headerBackTitle: 'Back'
          }}
        />
      </Stack>
    </>
  );
}

export default Sentry.wrap(RootLayout);
