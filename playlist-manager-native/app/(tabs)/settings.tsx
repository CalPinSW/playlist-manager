import { useState } from 'react';
import { Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { clearTokens } from '../../lib/auth';
import { reconnectSpotify } from '../../lib/spotifyReconnect';
import { Colors } from '../../constants/colors';

/**
 * Settings tab.
 * Spotify reconnect (for when the backend's Spotify refresh token has been
 * revoked or expired) and sign-out.
 */
export default function SettingsScreen() {
  const router = useRouter();
  const [reconnecting, setReconnecting] = useState(false);

  const handleReconnectSpotify = async () => {
    setReconnecting(true);
    try {
      await reconnectSpotify();
    } finally {
      setReconnecting(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          await clearTokens();
          router.replace('/(auth)/login');
        }
      }
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.heading}>Settings</Text>

      <TouchableOpacity
        style={[styles.button, styles.spacedButton]}
        onPress={handleReconnectSpotify}
        disabled={reconnecting}
        accessibilityLabel="Reconnect Spotify"
        accessibilityRole="button"
      >
        {reconnecting ? (
          <ActivityIndicator color={Colors.text} />
        ) : (
          <Text style={styles.buttonText}>Reconnect Spotify</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={handleSignOut}
        accessibilityLabel="Sign out"
        accessibilityRole="button"
      >
        <Text style={styles.signOutText}>Sign out</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surfaceDark, padding: 20 },
  heading: { fontSize: 28, fontWeight: '700', color: Colors.text, marginBottom: 32 },
  button: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border
  },
  spacedButton: { marginBottom: 12 },
  buttonText: { color: Colors.text, fontSize: 16, fontWeight: '600' },
  signOutText: { color: '#ff6b6b', fontSize: 16, fontWeight: '600' }
});
