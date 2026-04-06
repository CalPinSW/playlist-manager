import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  AppState,
  AppStateStatus
} from 'react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { fetchRatings, AuthError, RatedAlbum } from '../../lib/api';
import { Colors } from '../../constants/colors';
import { clearTokens } from '../../lib/auth';

/**
 * Ratings tab — all rated albums ordered by rating desc, then date desc.
 * Tapping an album navigates to the full album detail screen.
 */
export default function RatingsScreen() {
  const router = useRouter();
  const [albums, setAlbums] = useState<RatedAlbum[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const appState = useRef(AppState.currentState);

  const handleAuthError = useCallback(async () => {
    await clearTokens();
    router.replace('/(auth)/login');
  }, [router]);

  const loadRatings = useCallback(async (opts: { showRefreshing?: boolean } = {}) => {
    if (opts.showRefreshing) setRefreshing(true);
    try {
      const data = await fetchRatings();
      setAlbums(data);
    } catch (err) {
      if (err instanceof AuthError) { await handleAuthError(); return; }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [handleAuthError]);

  useEffect(() => {
    loadRatings();

    const subscription = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && next === 'active') {
        loadRatings();
      }
      appState.current = next;
    });

    return () => subscription.remove();
  }, [loadRatings]);

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={albums}
        keyExtractor={(item) => item.albumId}
        contentContainerStyle={albums.length === 0 ? styles.emptyContainer : styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadRatings({ showRefreshing: true })}
            tintColor={Colors.primary}
          />
        }
        ListHeaderComponent={
          <Text style={styles.heading}>Ratings</Text>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>★</Text>
            <Text style={styles.emptyTitle}>No ratings yet</Text>
            <Text style={styles.emptySubtitle}>
              Open any album and tap the stars to rate it.
            </Text>
          </View>
        }
        ItemSeparatorComponent={() => <View style={styles.divider} />}
        renderItem={({ item }) => (
          <RatedAlbumRow
            album={item}
            onPress={() => router.push(`/album/${item.albumId}`)}
          />
        )}
      />
    </SafeAreaView>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function RatedAlbumRow({ album, onPress }: { album: RatedAlbum; onPress: () => void }) {
  const artistNames = album.artists.map(a => a.name).join(', ');
  const displayRating = album.rating / 2; // 1–10 → 0.5–5.0
  const fullStars = Math.floor(displayRating);
  const hasHalf = displayRating % 1 !== 0;

  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.thumbWrap}>
        {album.albumImageUrl ? (
          <Image source={{ uri: album.albumImageUrl }} style={styles.thumb} />
        ) : (
          <View style={[styles.thumb, styles.thumbPlaceholder]} />
        )}
      </View>

      <View style={styles.rowText}>
        <Text style={styles.albumName} numberOfLines={1}>{album.albumName}</Text>
        <Text style={styles.artistName} numberOfLines={1}>{artistNames}</Text>
        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map(i => {
            const filled = i <= fullStars;
            const half = !filled && hasHalf && i === fullStars + 1;
            return (
              <Text
                key={i}
                style={[styles.star, (filled || half) ? styles.starFilled : styles.starEmpty]}
              >
                {filled ? '★' : half ? '⯨' : '☆'}
              </Text>
            );
          })}
          <Text style={styles.ratingLabel}>{displayRating.toFixed(1)}</Text>
        </View>
      </View>

      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surfaceDark },
  centered: { flex: 1, backgroundColor: Colors.surfaceDark, justifyContent: 'center', alignItems: 'center' },
  listContent: { paddingBottom: 40 },

  heading: {
    fontSize: 28, fontWeight: '800', color: Colors.text,
    letterSpacing: -0.5, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12
  },

  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 10, gap: 12
  },
  thumbWrap: { width: 52, height: 52, borderRadius: 6, overflow: 'hidden', flexShrink: 0 },
  thumb: { width: 52, height: 52 },
  thumbPlaceholder: { backgroundColor: Colors.surface },
  rowText: { flex: 1, minWidth: 0 },
  albumName: { color: Colors.text, fontSize: 15, fontWeight: '600' },
  artistName: { color: Colors.textMuted, fontSize: 12, marginTop: 1 },
  starsRow: { flexDirection: 'row', alignItems: 'center', gap: 1, marginTop: 4 },
  star: { fontSize: 14 },
  starFilled: { color: '#de7c38' },
  starEmpty: { color: 'rgba(255,255,255,0.18)' },
  ratingLabel: { color: Colors.textMuted, fontSize: 11, marginLeft: 4 },
  chevron: { color: 'rgba(255,255,255,0.2)', fontSize: 20 },

  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginHorizontal: 20 },

  emptyContainer: { flex: 1 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
  emptyIcon: { fontSize: 40, color: '#de7c38', opacity: 0.4, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: Colors.text, marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: Colors.textMuted, textAlign: 'center', lineHeight: 22, paddingHorizontal: 32 }
});
