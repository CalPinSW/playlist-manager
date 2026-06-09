import {
  View,
  Text,
  Image,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  AppState,
  AppStateStatus,
} from 'react-native';
import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { fetchProgress, fetchNowPlaying, syncHistory, resumePlayback, ProgressEntry, NowPlaying, AuthError } from '../../lib/api';
import { getCachedProgress, cacheProgress } from '../../lib/db';
import { Colors } from '../../constants/colors';
import { useRouter } from 'expo-router';
import { clearTokens } from '../../lib/auth';
import { writeNowPlaying } from '../../modules/widget-bridge';

const POLL_INTERVAL_MS = 10_000;

// ── Grouping helper ────────────────────────────────────────────────────────────

type PlaylistGroup = {
  playlistId: string;
  playlistName: string;
  totalAlbums: number; // all albums in the playlist, not just those with progress
  albums: ProgressEntry[];
};

function groupByPlaylist(entries: ProgressEntry[]): PlaylistGroup[] {
  const map = new Map<string, PlaylistGroup>();
  for (const entry of entries) {
    if (!map.has(entry.playlistId)) {
      map.set(entry.playlistId, {
        playlistId: entry.playlistId,
        playlistName: entry.playlistName,
        totalAlbums: entry.totalPlaylistAlbums,
        albums: [],
      });
    }
    map.get(entry.playlistId)!.albums.push(entry);
  }
  return Array.from(map.values());
}

// ── Screen ─────────────────────────────────────────────────────────────────────

export default function NowScreen() {
  const router = useRouter();
  const [progress, setProgress] = useState<ProgressEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nowPlaying, setNowPlaying] = useState<NowPlaying | null>(null);
  const appState = useRef(AppState.currentState);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollYRef = useRef(0);

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
      if (!syncResult) console.warn('[sync] Sync returned null — progress may be stale.');
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

  // ── Live polling ─────────────────────────────────────────────────────────────

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
    } catch { /* silently ignore */ }
  }, []);

  const startPolling = useCallback(() => {
    if (pollTimerRef.current) return;
    pollNowPlaying();
    pollTimerRef.current = setInterval(pollNowPlaying, POLL_INTERVAL_MS);
  }, [pollNowPlaying]);

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) { clearInterval(pollTimerRef.current); pollTimerRef.current = null; }
  }, []);

  useEffect(() => {
    loadData();
    startPolling();
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && next === 'active') { loadData(); startPolling(); }
      else if (next.match(/inactive|background/)) stopPolling();
      appState.current = next;
    });
    return () => { sub.remove(); stopPolling(); };
  }, [loadData, startPolling, stopPolling]);

  // ── Live data merge ───────────────────────────────────────────────────────────

  const liveActive = !!(nowPlaying && 'albumId' in nowPlaying && nowPlaying.isPlaying);
  const liveData = liveActive ? (nowPlaying as Extract<NowPlaying, { isPlaying: true }>) : null;

  const liveOverrides = useMemo<Map<string, Partial<ProgressEntry>>>(() => {
    if (!liveData) return new Map();
    return new Map([[liveData.albumId, {
      lastTrackIndex: liveData.trackIndex,
      totalTracks: liveData.totalTracks,
      progressPercent: Math.round(((liveData.trackIndex + 1) / liveData.totalTracks) * 100),
    }]]);
  }, [liveData]);

  const applyLive = useCallback((entry: ProgressEntry): ProgressEntry => {
    const override = liveOverrides.get(entry.albumId);
    return override ? { ...entry, ...override } : entry;
  }, [liveOverrides]);

  const groups = useMemo(() => groupByPlaylist(progress), [progress]);

  const navigateToAlbum = useCallback((albumId: string, playlistId: string) => {
    router.push(`/album/${albumId}?playlistId=${playlistId}`);
  }, [router]);

  const navigateToPlaylist = useCallback((playlistId: string) => {
    router.push(`/(tabs)/albums/${playlistId}`);
  }, [router]);

  // ── Render ────────────────────────────────────────────────────────────────────

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
        ref={scrollViewRef}
        contentContainerStyle={styles.scroll}
        scrollEventThrottle={16}
        onScroll={(e) => { scrollYRef.current = e.nativeEvent.contentOffset.y; }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadData({ showRefreshing: true })}
            tintColor={Colors.primary}
          />
        }
      >
        <Text style={styles.heading}>Now Playing</Text>

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {groups.length === 0 && !error && <EmptyState />}

        {groups.map((group, groupIdx) => (
          <PlaylistSection
            key={group.playlistId}
            group={group}
            applyLive={applyLive}
            liveAlbumId={liveData?.albumId ?? null}
            liveTrackName={liveData?.trackName ?? null}
            isFirst={groupIdx === 0}
            onAlbumPress={(albumId) => navigateToAlbum(albumId, group.playlistId)}
            onPlaylistPress={() => navigateToPlaylist(group.playlistId)}
            scrollViewRef={scrollViewRef}
            scrollYRef={scrollYRef}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

// ── PlaylistSection ────────────────────────────────────────────────────────────

function PlaylistSection({
  group,
  applyLive,
  liveAlbumId,
  liveTrackName,
  isFirst,
  onAlbumPress,
  onPlaylistPress,
  scrollViewRef,
  scrollYRef,
}: {
  group: PlaylistGroup;
  applyLive: (entry: ProgressEntry) => ProgressEntry;
  liveAlbumId: string | null;
  liveTrackName: string | null;
  isFirst: boolean;
  onAlbumPress: (albumId: string) => void;
  onPlaylistPress: () => void;
  scrollViewRef: React.RefObject<ScrollView | null>;
  scrollYRef: React.MutableRefObject<number>;
}) {
  const COLLAPSED_COUNT = 2;
  const [expanded, setExpanded] = useState(false);
  const [resuming, setResuming] = useState(false);
  const sectionRef = useRef<View>(null);
  const insets = useSafeAreaInsets();

  // Most-recently-listened album in this playlist group.
  const latestAlbum = group.albums[0] ?? null;

  const handleResume = useCallback(async () => {
    if (!latestAlbum || resuming) return;
    setResuming(true);
    try {
      await resumePlayback(latestAlbum.albumId, latestAlbum.lastTrackIndex);
    } catch (err: any) {
      if (err?.code === 'no_active_device') {
        Alert.alert(
          'No active device',
          'Open Spotify on any device first, then try again.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Playback error', err?.message ?? 'Could not start playback.');
      }
    } finally {
      setResuming(false);
    }
  }, [latestAlbum, resuming]);

  // Percentage of the whole playlist listened — weight each album's progress
  // against the full playlist size, not just the albums that have been started.
  // Fall back to the number of progress entries if totalAlbums is 0/undefined
  // (e.g. stale cache before the server returns the full count).
  const safeTotal = group.totalAlbums || group.albums.length;
  const playlistPct = Math.round(
    group.albums.reduce((sum, a) => sum + a.progressPercent, 0) / safeTotal
  );
  const doneCount = group.albums.filter(a => a.progressPercent >= 95).length;
  const coverImages = group.albums.slice(0, 4).map(a => a.albumImageUrl);

  const visibleAlbums = expanded ? group.albums : group.albums.slice(0, COLLAPSED_COUNT);
  const hiddenCount = group.albums.length - COLLAPSED_COUNT;
  const hasMore = group.albums.length > COLLAPSED_COUNT;

  const handleCollapse = useCallback(() => {
    setExpanded(false);
    // After layout settles, scroll so the section top sits at the top of the visible area.
    setTimeout(() => {
      sectionRef.current?.measure((_fx, _fy, _w, _h, _px, pageY) => {
        // pageY is the section's current top in screen coordinates.
        // insets.top is the safe-area boundary (below the notch/status bar).
        // targetY puts the section top exactly at the top of the content area.
        const targetY = scrollYRef.current + pageY - insets.top;
        scrollViewRef.current?.scrollTo({ y: Math.max(0, targetY), animated: true });
      });
    }, 50);
  }, [scrollViewRef, scrollYRef, insets.top]);

  return (
    <View ref={sectionRef} style={[styles.section, !isFirst && styles.sectionGap]}>
      {/* Playlist header */}
      <TouchableOpacity style={styles.playlistHeader} onPress={onPlaylistPress} activeOpacity={0.75}>
        {/* 2×2 art mosaic */}
        <View style={styles.mosaic}>
          {[0, 1, 2, 3].map(i =>
            coverImages[i]
              ? <Image key={i} source={{ uri: coverImages[i] }} style={styles.mosaicCell} />
              : <View key={i} style={[styles.mosaicCell, styles.mosaicEmpty]} />
          )}
        </View>

        {/* Playlist info */}
        <View style={styles.playlistInfo}>
          <Text style={styles.playlistName} numberOfLines={1}>{group.playlistName}</Text>
          <Text style={styles.playlistMeta}>
            {safeTotal} album{safeTotal !== 1 ? 's' : ''}
            {doneCount > 0 ? `  ·  ${doneCount} done` : ''}
          </Text>
          <View style={styles.playlistProgressRow}>
            <View style={styles.playlistProgressTrack}>
              <View style={[styles.playlistProgressFill, { width: `${playlistPct}%` }]} />
            </View>
            <Text style={styles.playlistProgressPct}>{playlistPct}%</Text>
          </View>
        </View>

        <View style={styles.viewAllBtn}>
          <Text style={styles.viewAllText}>View all</Text>
          <Text style={styles.viewAllChevron}>›</Text>
        </View>
      </TouchableOpacity>

      {/* Resume playback button */}
      {latestAlbum && (
        <TouchableOpacity
          style={[styles.resumeBtn, resuming && styles.resumeBtnDisabled]}
          onPress={handleResume}
          activeOpacity={0.75}
          disabled={resuming}
        >
          {resuming
            ? <ActivityIndicator size="small" color={Colors.primary} />
            : <Text style={styles.resumeBtnText}>▶  Resume</Text>
          }
        </TouchableOpacity>
      )}

      {/* Album card grid */}
      <View style={styles.albumGrid}>
        {visibleAlbums.map(entry => {
          const resolved = applyLive(entry);
          const isLive = entry.albumId === liveAlbumId;
          return (
            <View key={entry.albumId} style={styles.albumCardWrap}>
              <AlbumCard
                entry={resolved}
                isLive={isLive}
                liveTrackName={isLive ? liveTrackName : null}
                onPress={() => onAlbumPress(entry.albumId)}
              />
            </View>
          );
        })}
      </View>

      {/* Expand / collapse footer */}
      {hasMore && (
        <TouchableOpacity
          style={styles.expandBtn}
          onPress={expanded ? handleCollapse : () => setExpanded(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.expandBtnText}>
            {expanded ? 'Show less' : `Show ${hiddenCount} more`}
          </Text>
          <Text style={[styles.expandBtnChevron, expanded && styles.expandBtnChevronUp]}>
            ›
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── AlbumCard ──────────────────────────────────────────────────────────────────

function AlbumCard({
  entry,
  isLive,
  liveTrackName,
  onPress,
}: {
  entry: ProgressEntry;
  isLive: boolean;
  liveTrackName: string | null;
  onPress: () => void;
}) {
  const artistLine = (entry.artistNames ?? []).join(', ');
  const done = entry.progressPercent >= 95;

  return (
    <TouchableOpacity
      style={[styles.albumCard, isLive && styles.albumCardLive]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      {/* Album art */}
      <View style={styles.albumCardArtWrap}>
        <Image
          source={{ uri: entry.albumImageUrl }}
          style={styles.albumCardArt}
          accessibilityLabel={entry.albumName}
        />
        {isLive && (
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        )}
        {done && (
          <View style={styles.doneBadge}>
            <Text style={styles.doneTick}>✓</Text>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.albumCardBody}>
        <Text style={styles.albumCardName} numberOfLines={2}>{entry.albumName}</Text>
        <Text style={styles.albumCardArtist} numberOfLines={1}>{artistLine}</Text>
        {liveTrackName && (
          <Text style={styles.albumCardTrack} numberOfLines={1}>♪ {liveTrackName}</Text>
        )}
        <View style={styles.albumCardProgressTrack}>
          <View style={[styles.albumCardProgressFill, { width: `${entry.progressPercent}%` }]} />
        </View>
        <Text style={styles.albumCardProgressText}>
          {entry.progressPercent}%{'  ·  '}{entry.lastTrackIndex + 1}/{entry.totalTracks}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

// ── Empty state ────────────────────────────────────────────────────────────────

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
  scroll: { padding: 20, paddingBottom: 48 },
  heading: { fontSize: 28, fontWeight: '700', color: Colors.text, marginBottom: 24 },

  // ── Playlist section ────────────────────────────────────────────────────────

  section: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  sectionGap: { marginTop: 20 },

  playlistHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },

  // 2×2 mosaic
  mosaic: {
    width: 68,
    height: 68,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
    borderRadius: 10,
    overflow: 'hidden',
    flexShrink: 0,
  },
  mosaicCell: {
    width: 33,
    height: 33,
  },
  mosaicEmpty: {
    backgroundColor: Colors.border,
  },

  playlistInfo: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  playlistName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#c9a8ff',
    letterSpacing: 0.1,
  },
  playlistMeta: {
    fontSize: 11,
    color: Colors.textMuted,
    letterSpacing: 0.1,
  },
  playlistProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  playlistProgressTrack: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.progressTrack,
    borderRadius: 2,
    overflow: 'hidden',
  },
  playlistProgressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  playlistProgressPct: {
    fontSize: 11,
    color: Colors.textMuted,
    flexShrink: 0,
    minWidth: 32,
    textAlign: 'right',
  },

  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    flexShrink: 0,
  },
  viewAllText: { fontSize: 12, color: Colors.primary, fontWeight: '600' },
  viewAllChevron: { fontSize: 18, color: Colors.primary, lineHeight: 20 },

  // ── Resume button ───────────────────────────────────────────────────────────

  resumeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginHorizontal: 12,
    marginBottom: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(120,166,60,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(120,166,60,0.35)',
    minHeight: 36,
  },
  resumeBtnDisabled: {
    opacity: 0.5,
  },
  resumeBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#78a63c',
    letterSpacing: 0.3,
  },

  // ── Album card grid ─────────────────────────────────────────────────────────

  albumGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  albumCardWrap: {
    width: '47%',
    flexGrow: 1,
  },
  albumCard: {
    backgroundColor: Colors.surfaceDark,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  albumCardLive: {
    borderColor: '#78a63c',
    borderWidth: 1.5,
  },

  albumCardArtWrap: {
    width: '100%',
    aspectRatio: 1,
    position: 'relative',
  },
  albumCardArt: {
    width: '100%',
    height: '100%',
  },

  // Live badge overlaid on art
  liveBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0,0,0,0.72)',
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  liveDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#78a63c' },
  liveText: { fontSize: 9, fontWeight: '800', color: '#78a63c', letterSpacing: 0.5 },

  doneBadge: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#78a63c',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.surface,
  },
  doneTick: { color: '#fff', fontSize: 10, fontWeight: '800' },

  albumCardBody: {
    padding: 8,
  },
  albumCardName: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text,
    lineHeight: 16,
    marginBottom: 2,
  },
  albumCardArtist: {
    fontSize: 11,
    color: Colors.textMuted,
    marginBottom: 7,
  },
  albumCardTrack: {
    fontSize: 10,
    color: 'rgba(200,180,255,0.7)',
    fontStyle: 'italic',
    marginBottom: 5,
  },
  albumCardProgressTrack: {
    height: 3,
    backgroundColor: Colors.progressTrack,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  albumCardProgressFill: {
    height: '100%',
    backgroundColor: Colors.progressFill,
    borderRadius: 2,
  },
  albumCardProgressText: {
    fontSize: 10,
    color: Colors.textMuted,
  },

  // Expand / collapse footer
  expandBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  expandBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
  },
  expandBtnChevron: {
    fontSize: 16,
    color: Colors.primary,
    lineHeight: 18,
    transform: [{ rotate: '90deg' }],
  },
  expandBtnChevronUp: {
    transform: [{ rotate: '-90deg' }],
  },

  // Error
  errorBox: { backgroundColor: '#2d0a0a', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#5c1a1a' },
  errorText: { color: '#ff6b6b', textAlign: 'center' },

  // Empty
  emptyState: { alignItems: 'center', paddingVertical: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: Colors.text, marginBottom: 12 },
  emptySubtitle: { fontSize: 14, color: Colors.textMuted, textAlign: 'center', lineHeight: 22 },
});
