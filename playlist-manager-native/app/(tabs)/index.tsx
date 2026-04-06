import {
  View,
  Text,
  Image,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  AppState,
  AppStateStatus
} from 'react-native';
import { useEffect, useRef, useState, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchProgress, syncHistory, ProgressEntry, AuthError } from '../../lib/api';
import { getCachedProgress, cacheProgress } from '../../lib/db';
import { Colors } from '../../constants/colors';
import { useRouter, usePathname } from 'expo-router';
import { clearTokens } from '../../lib/auth';

/**
 * Now tab — shows the most recently listened album with a progress bar.
 *
 * Data flow:
 * 1. On mount: trigger syncHistory (background) + fetchProgress (display).
 * 2. On AppState 'active' (app foregrounded): re-sync + re-fetch.
 * 3. Pull-to-refresh: force sync + fetch.
 *
 * The first entry from /api/progress is the "current album" (ordered by listened_at desc).
 */
export default function NowScreen() {
  const router = useRouter();
  const [progress, setProgress] = useState<ProgressEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const appState = useRef(AppState.currentState);

  const loadData = useCallback(async (opts: { showRefreshing?: boolean } = {}) => {
    if (opts.showRefreshing) setRefreshing(true);
    setError(null);

    // Show cached data immediately so the screen isn't blank while fetching.
    if (!opts.showRefreshing) {
      const cached = await getCachedProgress().catch(() => []);
      if (cached.length > 0) {
        setProgress(cached);
        setLoading(false);
      }
    }

    try {
      await syncHistory().catch(() => null);
      const data = await fetchProgress();
      setProgress(data);
      await cacheProgress(data).catch(() => null);
    } catch (err) {
      if (err instanceof AuthError) {
        await clearTokens();
        router.replace('/(auth)/login');
        return;
      }
      setError('Could not load progress. Pull to retry.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router]);

  useEffect(() => {
    loadData();

    // Re-sync when app comes back to foreground.
    const subscription = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && next === 'active') {
        loadData();
      }
      appState.current = next;
    });

    return () => subscription.remove();
  }, [loadData]);

  const current = progress[0] ?? null;

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadData({ showRefreshing: true })}
            tintColor={Colors.primary}
          />
        }
      >
        <Text style={styles.heading}>Now Playing</Text>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : current ? (
          <CurrentAlbumCard entry={current} onPress={() => router.push(`/album/${current.albumId}`)} />
        ) : (
          <EmptyState />
        )}

        {progress.length > 1 && (
          <>
            <Text style={styles.sectionHeading}>In Progress</Text>
            {progress.slice(1).map((entry) => (
              <AlbumRow key={`${entry.albumId}:${entry.playlistId}`} entry={entry} onPress={() => router.push(`/album/${entry.albumId}`)} />
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Sub-components ───────────────────────��─────────────────────────────���───────

function CurrentAlbumCard({ entry, onPress }: { entry: ProgressEntry; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <Image
        source={{ uri: entry.albumImageUrl }}
        style={styles.albumArt}
        accessibilityLabel={`Album art for ${entry.albumName}`}
      />
      <Text style={styles.albumName}>{entry.albumName}</Text>
      <Text style={styles.playlistName}>{entry.playlistName}</Text>

      <ProgressBar percent={entry.progressPercent} />

      <Text style={styles.progressText}>
        Track {entry.lastTrackIndex + 1} of {entry.totalTracks}
        {'  ·  '}{entry.progressPercent}%
      </Text>
    </TouchableOpacity>
  );
}

function AlbumRow({ entry, onPress }: { entry: ProgressEntry; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.75}>
      <Image
        source={{ uri: entry.albumImageUrl }}
        style={styles.rowArt}
        accessibilityLabel={`Album art for ${entry.albumName}`}
      />
      <View style={styles.rowText}>
        <Text style={styles.rowAlbumName} numberOfLines={1}>{entry.albumName}</Text>
        <Text style={styles.rowPlaylist} numberOfLines={1}>{entry.playlistName}</Text>
        <ProgressBar percent={entry.progressPercent} compact />
      </View>
      <Text style={styles.rowPercent}>{entry.progressPercent}%</Text>
    </TouchableOpacity>
  );
}

function ProgressBar({ percent, compact = false }: { percent: number; compact?: boolean }) {
  return (
    <View
      style={[styles.progressTrack, compact && styles.progressTrackCompact]}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: percent }}
      accessibilityLabel={`${percent}% complete`}
    >
      <View style={[styles.progressFill, { width: `${percent}%` }]} />
    </View>
  );
}

function EmptyState() {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>No albums in progress</Text>
      <Text style={styles.emptySubtitle}>
        Add albums to a New Albums playlist and start listening.{'\n'}
        Your progress will appear here automatically.
      </Text>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surfaceDark },
  centered: { flex: 1, backgroundColor: Colors.surfaceDark, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: 20, paddingBottom: 40 },
  heading: { fontSize: 28, fontWeight: '700', color: Colors.text, marginBottom: 20 },
  sectionHeading: { fontSize: 18, fontWeight: '600', color: Colors.text, marginTop: 32, marginBottom: 12 },

  // Current album card
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border
  },
  albumArt: {
    width: 220,
    height: 220,
    borderRadius: 12,
    marginBottom: 16
  },
  albumName: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 4
  },
  playlistName: {
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: 16
  },
  progressText: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 8
  },

  // Progress bar
  progressTrack: {
    width: '100%',
    height: 6,
    backgroundColor: Colors.progressTrack,
    borderRadius: 3,
    overflow: 'hidden'
  },
  progressTrackCompact: { height: 4, marginTop: 6 },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.progressFill,
    borderRadius: 3
  },

  // Row (in-progress list)
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border
  },
  rowArt: { width: 56, height: 56, borderRadius: 8, marginRight: 12 },
  rowText: { flex: 1, justifyContent: 'center' },
  rowAlbumName: { fontSize: 14, fontWeight: '600', color: Colors.text },
  rowPlaylist: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  rowPercent: { fontSize: 13, color: Colors.textMuted, marginLeft: 8 },

  // Error
  errorBox: {
    backgroundColor: '#2d0a0a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#5c1a1a'
  },
  errorText: { color: '#ff6b6b', textAlign: 'center' },

  // Empty state
  emptyState: { alignItems: 'center', paddingVertical: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: Colors.text, marginBottom: 12 },
  emptySubtitle: { fontSize: 14, color: Colors.textMuted, textAlign: 'center', lineHeight: 22 }
});
