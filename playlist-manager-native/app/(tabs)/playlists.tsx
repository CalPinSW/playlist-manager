import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';

/**
 * Playlists tab — lists New Albums playlists.
 * Full implementation in Weekend 3. Placeholder for now.
 */
export default function PlaylistsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.heading}>Playlists</Text>
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>Playlist management coming in Weekend 3.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surfaceDark, padding: 20 },
  heading: { fontSize: 28, fontWeight: '700', color: Colors.text, marginBottom: 24 },
  placeholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  placeholderText: { fontSize: 15, color: Colors.textMuted, textAlign: 'center' }
});
