import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { useCallback, useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { fetchPlaylistAlbums, AuthError, PlaylistAlbum } from '../../../lib/api';
import { ProgressBar } from '../../../components/ProgressBar';
import { Colors } from '../../../constants/colors';
import { clearTokens } from '../../../lib/auth';

export default function PlaylistDetailScreen() {
  const { playlistId } = useLocalSearchParams<{ playlistId: string }>();
  const navigation = useNavigation();
  const router = useRouter();

  const [albums, setAlbums] = useState<PlaylistAlbum[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadAlbums = useCallback(async (opts: { showRefreshing?: boolean } = {}) => {
    if (opts.showRefreshing) setRefreshing(true);
    try {
      const data = await fetchPlaylistAlbums(playlistId);
      setAlbums(data);
      // Set the header title from the first album's playlist context
      // We derive it from the route params; navigation title is set below
    } catch (err) {
      if (err instanceof AuthError) {
        await clearTokens();
        router.replace('/(auth)/login');
        return;
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [playlistId, router]);

  useEffect(() => { loadAlbums(); }, [loadAlbums]);

  const completedCount = albums.filter(a => {
    if (!a.progress) return false;
    return a.progress.lastTrackIndex + 1 >= a.progress.totalTracks;
  }).length;

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <FlatList
      data={albums}
      keyExtractor={(item) => item.id}
      contentContainerStyle={albums.length === 0 ? styles.emptyContainer : styles.list}
      style={styles.screen}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => loadAlbums({ showRefreshing: true })}
          tintColor={Colors.primary}
        />
      }
      ListHeaderComponent={
        albums.length > 0 ? (
          <Text style={styles.subtitle}>
            {albums.length} albums · {completedCount} completed
          </Text>
        ) : null
      }
      ListEmptyComponent={
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No albums</Text>
          <Text style={styles.emptySubtitle}>This playlist has no synced albums yet.</Text>
        </View>
      }
      ItemSeparatorComponent={() => <View style={styles.divider} />}
      renderItem={({ item }) => (
        <AlbumCard
          album={item}
          onPress={() => router.push(`/album/${item.id}`)}
        />
      )}
    />
  );
}

function AlbumCard({ album, onPress }: { album: PlaylistAlbum; onPress: () => void }) {
  const prog = album.progress;
  const pct = prog?.progressPercent ?? 0;
  const artistNames = album.artists.map(a => a.name).join(', ');
  const completed = prog ? prog.lastTrackIndex + 1 >= prog.totalTracks : false;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.thumbWrap}>
        {album.imageUrl ? (
          <Image
            source={{ uri: album.imageUrl }}
            style={styles.thumb}
            accessibilityLabel={`Album art for ${album.name}`}
          />
        ) : (
          <View style={[styles.thumb, styles.thumbPlaceholder]} />
        )}
        {completed && (
          <View style={styles.completedBadge}>
            <Text style={styles.completedTick}>✓</Text>
          </View>
        )}
      </View>
      <View style={styles.info}>
        <Text style={styles.albumName} numberOfLines={2}>{album.name}</Text>
        <Text style={styles.artistName} numberOfLines={1}>{artistNames}</Text>
        {prog ? (
          <>
            <ProgressBar percent={pct} compact />
            <Text style={styles.stats}>
              {prog.lastTrackIndex + 1}/{prog.totalTracks} tracks · {pct}%
            </Text>
          </>
        ) : (
          <Text style={styles.unstarted}>Not started</Text>
        )}
      </View>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.surfaceDark },
  centered: { flex: 1, backgroundColor: Colors.surfaceDark, justifyContent: 'center', alignItems: 'center' },
  list: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 40 },
  emptyContainer: { flex: 1, justifyContent: 'center', paddingHorizontal: 32 },
  subtitle: { color: Colors.textMuted, fontSize: 13, marginBottom: 12, marginTop: 4 },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
    gap: 14
  },
  thumbWrap: { position: 'relative', flexShrink: 0 },
  thumb: { width: 64, height: 64, borderRadius: 8 },
  thumbPlaceholder: { backgroundColor: Colors.surface },
  completedBadge: {
    position: 'absolute',
    bottom: -4, right: -4,
    width: 18, height: 18,
    borderRadius: 9,
    backgroundColor: '#78a63c',
    alignItems: 'center',
    justifyContent: 'center'
  },
  completedTick: { color: '#fff', fontSize: 10, fontWeight: '700' },

  info: { flex: 1 },
  albumName: { color: Colors.text, fontSize: 15, fontWeight: '600', lineHeight: 20 },
  artistName: { color: Colors.textMuted, fontSize: 12, marginTop: 2, marginBottom: 8 },
  stats: { color: Colors.textMuted, fontSize: 11, marginTop: 4 },
  unstarted: { color: 'rgba(255,255,255,0.2)', fontSize: 12, marginTop: 4, fontStyle: 'italic' },

  chevron: { color: 'rgba(255,255,255,0.2)', fontSize: 20 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.06)' },

  emptyState: { alignItems: 'center', paddingVertical: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: Colors.text, marginBottom: 12 },
  emptySubtitle: { fontSize: 14, color: Colors.textMuted, textAlign: 'center' }
});
