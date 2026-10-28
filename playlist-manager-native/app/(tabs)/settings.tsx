import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { clearTokens } from '../../lib/auth';
import { reconnectSpotify } from '../../lib/spotifyReconnect';
import { Colors, Fonts } from '../../constants/colors';

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

      <Text style={styles.sectionLabel}>Account</Text>
      <View style={styles.group}>
        <TouchableOpacity
          style={styles.row}
          onPress={handleReconnectSpotify}
          disabled={reconnecting}
          activeOpacity={0.7}
          accessibilityLabel="Reconnect Spotify"
          accessibilityRole="button"
        >
          <View style={styles.rowIcon}>
            <Feather name="refresh-cw" size={16} color={Colors.text} />
          </View>
          <View style={styles.rowText}>
            <Text style={styles.rowLabel}>Reconnect Spotify</Text>
            <Text style={styles.rowHint}>If syncing or playback stops working</Text>
          </View>
          {reconnecting
            ? <ActivityIndicator color={Colors.textMuted} />
            : <Feather name="chevron-right" size={18} color={Colors.textFaint} />}
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity
          style={styles.row}
          onPress={handleSignOut}
          activeOpacity={0.7}
          accessibilityLabel="Sign out"
          accessibilityRole="button"
        >
          <View style={[styles.rowIcon, styles.rowIconDanger]}>
            <Feather name="log-out" size={16} color={Colors.danger} />
          </View>
          <View style={styles.rowText}>
            <Text style={[styles.rowLabel, styles.rowLabelDanger]}>Sign out</Text>
          </View>
        </TouchableOpacity>
      </View>

      <Text style={styles.footer}>
        Playlist Manager {Constants.expoConfig?.version ?? ''}
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg, padding: 20 },
  heading: { fontSize: 30, fontFamily: Fonts.display, color: Colors.text, marginBottom: 28, letterSpacing: -0.3 },
  sectionLabel: {
    color: Colors.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 0.8,
    textTransform: 'uppercase', marginBottom: 8, marginLeft: 4
  },
  group: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden'
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, minHeight: 60 },
  rowIcon: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: Colors.surfaceRaised,
    alignItems: 'center', justifyContent: 'center'
  },
  rowIconDanger: { backgroundColor: Colors.dangerBg },
  rowText: { flex: 1, paddingVertical: 12 },
  rowLabel: { color: Colors.text, fontSize: 16, fontWeight: '500' },
  rowLabelDanger: { color: Colors.danger },
  rowHint: { color: Colors.textMuted, fontSize: 12, marginTop: 2 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.border, marginLeft: 58 },
  footer: { color: Colors.textFaint, fontSize: 12, textAlign: 'center', marginTop: 'auto', paddingBottom: 8 }
});
