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
import { fetchProgress, fetchNowPlaying, syncHistory, ProgressEntry, NowPlaying, AuthError } from '../../lib/api';
import { getCachedProgress, cacheProgress } from '../../lib/db';
import { Colors } from '../../constants/colors';
import { useRouter } from 'expo-router';
import { clearTokens } from '../../lib/auth';
import { writeNowPlaying } from '../../modules/widget-bridge';

const POLL_INTERVAL_MS = 10_000;

export default function NowScreen() {
  const router = useRouter();
  const [progress, setProgress] = useState<ProgressEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nowPlaying, setNowPlaying] = useState<NowPlaying | null>(null);
  const appState = useRef(AppState.currentState);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadData = useCallback(async (opts: { showRefreshing?: boolean } = {}) => {
    if (opts.showRefreshing) setRefreshing(true);
    setError(null);

    if (!opts.showRefreshing) {
      const cached = await getCachedProgress().catch(() => []);
      if (cached.length > 0) {
        setProgress(cached);
        setLoading(false);
      }
    }

    try {
      const syncResult = await syncHistory().catch((err) => {
        console.warn('[sync] syncHistory failed:', err?.message ?? err);
        return null;
      });
      if (!syncResult) {
        console.warn('[sync] Sync returned null — progress may be stale.');
      }
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

  // ── Live playback polling ────────────────────────────────────────────────────

  const pollNowPlaying = useCallback(async () => {
    try {
      const live = await fetchNowPlaying();
      setNowPlaying(live);

      if ('albumId' in live && live.isPlaying) {
        writeNowPlaying({
          albumId:    live.albumId,
          albumName:  live.albumName,
          artistName: live.artistName,
          imageUrl:   live.albumImageUrl,
          rating:     0,
          isPlaying:  live.isPlaying,
        });
      }
    } catch {
      // Silently fail — DB data is still shown.
    }
  }, []);

  const startPolling = useCallback(() => {
    if (pollTimerRef.current) return;
    pollNowPlaying();
    pollTimerRef.current = setInterval(pollNowPlaying, POLL_INTERVAL_MS);
  }, [pollNowPlaying]);

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    loadData();
    startPolling();

    const subscription = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && next === 'active') {
        loadData();
        startPolling();
      } else if (next.match(/inactive|background/)) {
        stopPolling();
      }
      appState.current = next;
    });

    return () => {
      subscription.remove();
      stopPolling();
    };
  }, [loadData, startPolling, stopPolling]);

  // ── Merge live + DB data ─────────────────────────────────────────────────────

  const dbCurrent = progress[0] ?? null;
  const liveActive = nowPlaying && 'albumId' in nowPlaying && nowPlaying.isPlaying;

  const current: ProgressEntry | null = (() => {
    if (!dbCurrent) return null;
    if (!liveActive) return dbCurrent;
    if ((nowPlaying as Extract<NowPlaying, { isPlaying: true }>).albumId === dbCurrent.albumId) {
      const live = nowPlaying as Extract<NowPlaying, { isPlaying: true }>;
      return {
        ...dbCurrent,
        lastTrackIndex: live.trackIndex,
        totalTracks: live.totalTracks,
        progressPercent: Math.round(((live.trackIndex + 1) / live.totalTracks) * 100)
      };
    }
    const live = nowPlaying as Extract<NowPlaying, { isPlaying: true }>;
    const inList = progress.find(p => p.albumId === live.albumId);
    if (inList) {
      return {
        ...inList,
        lastTrackIndex: live.trackIndex,
        totalTracks: live.totalTracks,
        progressPercent: Math.round(((live.trackIndex + 1) / live.totalTracks) * 100)
      };
    }
    return dbCurrent;
  })();

  const navigateToAlbum = useCallback((entry: ProgressEntry) => {
    router.push(`/album/${entry.albumId}?playlistId=${entry.playlistId}`);
  }, [router]);

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  const liveAlbumId = liveActive
    ? (nowPlaying as Extract<NowPlaying, { isPlaying: true }>).albumId
    : null;

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
          <CurrentAlbumCard
            entry={current}
            isLive={liveActive && liveAlbumId === current.albumId}
            trackName={
              liveActive && liveAlbumId === current.albumId
                ? (nowPlaying as Extract<NowPlaying, { isPlaying: true }>).trackName
                : null
            }
            onPress={() => navigateToAlbum(current)}
          />
        ) : (
          <EmptyState />
        )}

        {progress.length > 1 && (
          <>
            <Text style={styles.sectionHeading}>In Progress</Text>
            {progress.slice(1).map((entry) => (
              <AlbumRow
                key={`${entry.albumId}:${entry.playlistId}`}
                entry={entry}
                onPress={() => navigateToAlbum(entry)}
              />
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function CurrentAlbumCard({
  entry,
  isLive,
  trackName,
  onPress
}: {
  entry: ProgressEntry;
  isLive: boolean;
  trackName: string | null;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      {/* Playlist header — prominent coloured band at top of card */}
      <View style={styles.cardPlaylistHeader}>
        <Text style={styles.cardPlaylistLabel} numberOfLines={1}>{entry.playlistName}</Text>
        {isLive && (
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>Live</Text>
          </View>
        )}
      </View>

      <Image
        source={{ uri: entry.albumImageUrl }}
        style={styles.albumArt}
        accessibilityLabel={`Album art for ${entry.albumName}`}
      />

      <Text style={styles.albumName}>{entry.albumName}</Text>

      {trackName && (
        <Text style={styles.trackName} numberOfLines={1}>{trackName}</Text>
      )}

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
        {/* Playlist name is now the primary label */}
        <Text style={styles.rowPlaylist} numberOfLines={1}>{entry.playlistName}</Text>
        <Text style={styles.rowAlbumName} numberOfLines={1}>{entry.albumName}</Text>
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
    overflow: 'hidden',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border
  },
  // Prominent playlist header band
  cardPlaylistHeader: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(132,61,255,0.15)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(132,61,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  cardPlaylistLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: '#c9a8ff',
    letterSpacing: 0.2,
  },
  albumArt: {
    width: 220,
    height: 220,
    borderRadius: 12,
    marginTop: 20,
    marginBottom: 16
  },
  albumName: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 6,
    paddingHorizontal: 16,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(120,166,60,0.2)',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2
  },
  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#78a63c'
  },
  liveText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#78a63c',
    letterSpacing: 0.4
  },
  trackName: {
    fontSize: 13,
    color: Colors.text,
    opacity: 0.75,
    textAlign: 'center',
    marginBottom: 12,
    paddingHorizontal: 8
  },
  progressText: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 8,
    marginBottom: 20,
  },

  // Progress bar
  progressTrack: {
    width: '100%',
    height: 6,
    backgroundColor: Colors.progressTrack,
    borderRadius: 3,
    overflow: 'hidden',
    paddingHorizontal: 0,
    marginHorizontal: 0,
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
  // Playlist is now the primary row label
  rowPlaylist: { fontSize: 13, fontWeight: '700', color: '#c9a8ff', marginBottom: 2 },
  rowAlbumName: { fontSize: 13, color: Colors.text, marginBottom: 2 },
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
