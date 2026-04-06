import {
  View,
  Text,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  ActivityIndicator
} from 'react-native';
import { useEffect, useState, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchProgress, syncHistory, ProgressEntry, AuthError } from '../../lib/api';
import { ProgressBar } from '../../components/ProgressBar';
import { Colors } from '../../constants/colors';
import { useRouter } from 'expo-router';
import { clearTokens } from '../../lib/auth';

/**
 * Albums tab — shows all in-progress albums across all New Albums playlists.
 * Pull-to-refresh triggers a fresh sync + data reload.
 */
export default function AlbumsScreen() {
  const router = useRouter();
  const [progress, setProgress] = useState<ProgressEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async (opts: { showRefreshing?: boolean } = {}) => {
    if (opts.showRefreshing) setRefreshing(true);
    try {
      await syncHistory().catch(() => null);
      const data = await fetchProgress();
      setProgress(data);
    } catch (err) {
      if (err instanceof AuthError) {
        await clearTokens();
        router.replace('/(auth)/login');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.heading}>Albums</Text>
      <FlatList
        data={progress}
        keyExtractor={(item) => `${item.albumId}:${item.playlistId}`}
        contentContainerStyle={progress.length === 0 ? styles.emptyContainer : styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadData({ showRefreshing: true })}
            tintColor={Colors.primary}
          />
        }
        ListEmptyComponent={<EmptyState />}
        renderItem={({ item }) => <AlbumCard entry={item} />}
      />
    </SafeAreaView>
  );
}

function AlbumCard({ entry }: { entry: ProgressEntry }) {
  return (
    <View style={styles.card}>
      <Image
        source={{ uri: entry.albumImageUrl }}
        style={styles.art}
        accessibilityLabel={`Album art for ${entry.albumName}`}
      />
      <View style={styles.info}>
        <Text style={styles.albumName} numberOfLines={2}>{entry.albumName}</Text>
        <Text style={styles.playlist} numberOfLines={1}>{entry.playlistName}</Text>
        <ProgressBar percent={entry.progressPercent} />
        <Text style={styles.stats}>
          {entry.lastTrackIndex + 1}/{entry.totalTracks} tracks · {entry.progressPercent}%
        </Text>
      </View>
    </View>
  );
}

function EmptyState() {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>No albums yet</Text>
      <Text style={styles.emptySubtitle}>
        Start listening to albums in your New Albums playlists and they'll appear here.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surfaceDark },
  centered: { flex: 1, backgroundColor: Colors.surfaceDark, justifyContent: 'center', alignItems: 'center' },
  heading: { fontSize: 28, fontWeight: '700', color: Colors.text, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 },
  list: { paddingHorizontal: 16, paddingBottom: 40 },
  emptyContainer: { flex: 1, justifyContent: 'center', paddingHorizontal: 32 },
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border
  },
  art: { width: 80, height: 80, borderRadius: 10, marginRight: 14 },
  info: { flex: 1, justifyContent: 'center' },
  albumName: { fontSize: 15, fontWeight: '600', color: Colors.text, marginBottom: 3 },
  playlist: { fontSize: 12, color: Colors.textMuted, marginBottom: 8 },
  stats: { fontSize: 12, color: Colors.textMuted, marginTop: 6 },
  emptyState: { alignItems: 'center', paddingVertical: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: Colors.text, marginBottom: 12 },
  emptySubtitle: { fontSize: 14, color: Colors.textMuted, textAlign: 'center', lineHeight: 22 }
});
