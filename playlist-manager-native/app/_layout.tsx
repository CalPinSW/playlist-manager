import '../global.css';

import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { getStoredTokens, isTokenExpired, getValidAccessToken } from '../lib/auth';

/**
 * Root layout. Handles auth gate:
 * - If no stored tokens → redirect to login
 * - If tokens exist but expired and un-refreshable → redirect to login
 * - If tokens valid → proceed to (tabs)
 *
 * The auth check runs once on mount. Token refresh is handled by getValidAccessToken
 * on every API call, so the app doesn't need to re-check here after the initial gate.
 */
export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      try {
        const stored = await getStoredTokens();
        const inAuthGroup = segments[0] === '(auth)';

        if (!stored?.accessToken) {
          if (!inAuthGroup) router.replace('/(auth)/login');
        } else if (isTokenExpired(stored.expiresAt)) {
          // Try silent refresh — if it throws, go to login.
          try {
            await getValidAccessToken();
            if (inAuthGroup) router.replace('/(tabs)');
          } catch {
            if (!inAuthGroup) router.replace('/(auth)/login');
          }
        } else {
          if (inAuthGroup) router.replace('/(tabs)');
        }
      } finally {
        setAuthChecked(true);
      }
    }
    checkAuth();
  // Intentionally omit segments from deps — we only want to check auth once on mount.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!authChecked) return null;

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" />
      </Stack>
    </>
  );
}
