import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { clearTokens } from '../../lib/auth';
import { Colors } from '../../constants/colors';

/**
 * Settings tab.
 * For now: just a sign-out button.
 * Future: Spotify re-auth, notification preferences, etc.
 */
export default function SettingsScreen() {
  const router = useRouter();

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
        style={styles.signOutButton}
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
  signOutButton: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border
  },
  signOutText: { color: '#ff6b6b', fontSize: 16, fontWeight: '600' }
});
