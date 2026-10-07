import { Alert } from 'react-native';
import { connectSpotify } from './api';

/**
 * Runs the Spotify reconnect flow and reports the outcome in an alert.
 * Resolves true if Spotify was reconnected.
 */
export async function reconnectSpotify(): Promise<boolean> {
  try {
    const connected = await connectSpotify();
    if (connected) Alert.alert('Spotify connected', 'Your Spotify account is reconnected.');
    return connected;
  } catch (err) {
    console.error('[spotify] reconnect failed:', err);
    Alert.alert('Could not connect Spotify', 'Something went wrong. Please try again from Settings.');
    return false;
  }
}

// The Now tab syncs on every open and resume — only nag once per app launch.
let hasPrompted = false;

/**
 * Asks the user to reconnect Spotify after the backend reports its Spotify
 * token is dead. Shown at most once per app launch; Settings → Reconnect
 * Spotify is always available after that.
 */
export function promptSpotifyReconnect(onConnected?: () => void): void {
  if (hasPrompted) return;
  hasPrompted = true;

  Alert.alert(
    'Reconnect Spotify',
    "Your Spotify connection has expired, so listening progress can't sync. Reconnect now?",
    [
      { text: 'Not now', style: 'cancel' },
      {
        text: 'Reconnect',
        onPress: async () => {
          if (await reconnectSpotify()) onConnected?.();
        }
      }
    ]
  );
}
