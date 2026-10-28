import {
  View,
  Text,
  ScrollView,
  FlatList,
  Image,
  TouchableOpacity,
  GestureResponderEvent,
  LayoutChangeEvent,
  StyleSheet,
  ActivityIndicator,
  Linking,
  Alert,
  Animated,
  Easing,
  useWindowDimensions,
  NativeSyntheticEvent,
  NativeScrollEvent
} from 'react-native';
import { forwardRef, useCallback, useEffect, useRef, useState } from 'react';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { fetchPlaylistAlbums, fetchPlaylists, promoteAlbum, setRating, AuthError, AlbumDetail, AlbumTrack, PlaylistAlbum, PlaylistSummary } from '../../lib/api';
import { SegmentedProgress, trackSegments } from '../../components/SegmentedProgress';
import { Colors, Fonts } from '../../constants/colors';
import { clearTokens } from '../../lib/auth';
import { getAlbumDetail, peekAlbumDetail, prefetchAlbumDetail, updateCachedAlbum } from '../../lib/albumCache';

const BEST_ALBUMS_PATTERN = /best albums/i;
const NEW_ALBUMS_PATTERN  = /new albums/i;

// Long strip jumps fake a page swipe: the current page slides out this
// fraction of the screen width while fading, then the target slides in.
const JUMP_SLIDE_FRACTION = 0.3;
const JUMP_OUT_MS = 120;
const JUMP_IN_MS = 200;

// How many albums either side of the current one to fetch ahead of a swipe.
const PREFETCH_RADIUS = 2;

/**
 * Strip a leading "New Albums" or "Best Albums" label and normalise the
 * remainder so we can match the date/period part across the two playlist types.
 * e.g. "New Albums 2024 H2" → "2024 h2"
 *      "Best Albums 2024 H2" → "2024 h2"
 */
function extractPeriodKey(name: string): string {
  return name
    .replace(/^(new|best)\s+albums\b/i, '')
    .trim()
    .toLowerCase();
}

/**
 * Album detail. When opened with a playlistId, every album in that playlist is
 * laid out in a horizontal pager so the user can swipe (or tap the strip) to
 * move through the playlist without leaving this screen — moving between
 * albums never touches the navigation stack, so Back always returns to
 * wherever the user came from.
 */
export default function AlbumDetailScreen() {
  const { albumId, playlistId } = useLocalSearchParams<{ albumId: string; playlistId?: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();

  const [albums, setAlbums] = useState<PlaylistAlbum[] | null>(null);
  const [index, setIndex] = useState(0);
  const [bestAlbumsPlaylists, setBestAlbumsPlaylists] = useState<PlaylistSummary[]>([]);
  const [playlistName, setPlaylistName] = useState('');

  const pagerRef = useRef<FlatList<{ id: string; summary?: PlaylistAlbum }>>(null);
  const stripRef = useRef<FlatList<PlaylistAlbum>>(null);
  const jumpSlide = useRef(new Animated.Value(0)).current;
  const jumpOpacity = useRef(new Animated.Value(1)).current;

  const handleAuthError = useCallback(async () => {
    await clearTokens();
    router.replace('/(auth)/login');
  }, [router]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [playlists, siblingAlbums] = await Promise.all([
          fetchPlaylists('Best Albums', 5),
          playlistId ? fetchPlaylistAlbums(playlistId) : Promise.resolve([] as PlaylistAlbum[]),
        ]);
        if (cancelled) return;
        setBestAlbumsPlaylists(playlists);
        const idx = siblingAlbums.findIndex(a => a.id === albumId);
        // Only page through the playlist if this album is actually in it —
        // otherwise just show the one album.
        setAlbums(idx >= 0 ? siblingAlbums : []);
        setIndex(Math.max(idx, 0));
      } catch (err) {
        if (cancelled) return;
        if (err instanceof AuthError) { await handleAuthError(); return; }
        // Still show the album itself; only the pager/promote context is lost.
        setAlbums([]);
      }
    })();
    return () => { cancelled = true; };
  }, [albumId, playlistId, handleAuthError]);

  // Keep the current album visible in the strip as the user swipes.
  useEffect(() => {
    if (!albums || albums.length === 0) return;
    // Small delay lets the strip's FlatList finish layout on first render.
    const t = setTimeout(() => {
      stripRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.5 });
    }, 100);
    return () => clearTimeout(t);
  }, [albums, index]);

  // Warm the detail cache and artwork for nearby albums so swiping or tapping
  // into them doesn't wait on the network.
  useEffect(() => {
    if (!albums) return;
    for (let i = index - PREFETCH_RADIUS; i <= index + PREFETCH_RADIUS; i++) {
      const neighbour = albums[i];
      if (!neighbour) continue;
      prefetchAlbumDetail(neighbour.id);
      if (neighbour.imageUrl) Image.prefetch(neighbour.imageUrl).catch(() => {});
    }
  }, [albums, index]);

  const onPagerScrollEnd = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setIndex(Math.round(e.nativeEvent.contentOffset.x / width));
  }, [width]);

  const jumpTo = useCallback((targetAlbumId: string) => {
    if (!albums) return;
    const target = albums.findIndex(a => a.id === targetAlbumId);
    if (target < 0) return;
    if (target === index) return;
    setIndex(target);

    // Adjacent pages: a real animated scroll is already a swipe.
    if (Math.abs(target - index) === 1) {
      pagerRef.current?.scrollToIndex({ index: target, animated: true });
      return;
    }

    // Longer jumps: animating the FlatList would scroll through (and mount,
    // and fetch) every album in between, so instead slide the current page out
    // towards the jump direction, snap to the target, and slide it in from
    // the other side — reads as a swipe matching the playlist order.
    prefetchAlbumDetail(albums[target].id);
    const offset = width * JUMP_SLIDE_FRACTION * (target > index ? 1 : -1);
    jumpSlide.stopAnimation();
    jumpOpacity.stopAnimation();
    Animated.parallel([
      Animated.timing(jumpSlide, { toValue: -offset, duration: JUMP_OUT_MS, easing: Easing.in(Easing.quad), useNativeDriver: true }),
      Animated.timing(jumpOpacity, { toValue: 0, duration: JUMP_OUT_MS, useNativeDriver: true }),
    ]).start(() => {
      pagerRef.current?.scrollToIndex({ index: target, animated: false });
      jumpSlide.setValue(offset);
      Animated.parallel([
        Animated.timing(jumpSlide, { toValue: 0, duration: JUMP_IN_MS, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(jumpOpacity, { toValue: 1, duration: JUMP_IN_MS, useNativeDriver: true }),
      ]).start();
    });
  }, [albums, index, width, jumpSlide, jumpOpacity]);

  const onPlaylistName = useCallback((name: string) => {
    setPlaylistName(prev => prev || name);
  }, []);

  if (albums === null) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  const pages: { id: string; summary?: PlaylistAlbum }[] =
    albums.length > 0 ? albums.map(a => ({ id: a.id, summary: a })) : [{ id: albumId }];

  return (
    <View style={styles.screen}>
      {albums.length > 1 && (
        <Stack.Screen options={{ headerTitle: `${index + 1} of ${albums.length}` }} />
      )}

      {/* ── Playlist strip ──────────────────────────────────────────────────── */}
      {albums.length > 0 && (
        <PlaylistStrip
          ref={stripRef}
          albums={albums}
          currentAlbumId={albums[index]?.id ?? albumId}
          playlistName={playlistName}
          onSelect={jumpTo}
        />
      )}

      {/* ── Pager ────────────────────────────────────────────────────────────── */}
      <Animated.View style={[styles.pager, { opacity: jumpOpacity, transform: [{ translateX: jumpSlide }] }]}>
        <FlatList
          ref={pagerRef}
          style={styles.pager}
          data={pages}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={item => item.id}
          initialScrollIndex={index}
          getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
          onMomentumScrollEnd={onPagerScrollEnd}
          // Mount the neighbours too so a swipe lands on an already-loaded page.
          windowSize={3}
          initialNumToRender={1}
          maxToRenderPerBatch={1}
          renderItem={({ item }) => (
            <View style={{ width }}>
              <AlbumPage
                albumId={item.id}
                summary={item.summary}
                playlistId={playlistId}
                bestAlbumsPlaylists={bestAlbumsPlaylists}
                onAuthError={handleAuthError}
                onPlaylistName={onPlaylistName}
              />
            </View>
          )}
        />
      </Animated.View>
    </View>
  );
}

// ── Album page ─────────────────────────────────────────────────────────────────

function AlbumPage({
  albumId,
  summary,
  playlistId,
  bestAlbumsPlaylists,
  onAuthError,
  onPlaylistName
}: {
  albumId: string;
  /** Playlist listing data, shown while the full detail loads. */
  summary?: PlaylistAlbum;
  playlistId?: string;
  bestAlbumsPlaylists: PlaylistSummary[];
  onAuthError: () => Promise<void>;
  onPlaylistName: (name: string) => void;
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Seed from the cache so a prefetched album renders on the first frame.
  const cached = peekAlbumDetail(albumId);
  const [album, setAlbum] = useState<AlbumDetail | null>(cached);
  const [loadFailed, setLoadFailed] = useState(false);
  const [promoting, setPromoting] = useState(false);
  const [promoted, setPromoted] = useState(
    cached?.onPlaylists.some(p => BEST_ALBUMS_PATTERN.test(p.name)) ?? false
  );
  const [localRating, setLocalRating] = useState<number | null>(cached?.rating ?? null);
  const [ratingPending, setRatingPending] = useState(false);

  const loadAlbum = useCallback(async () => {
    setLoadFailed(false);
    try {
      const data = await getAlbumDetail(albumId);
      setAlbum(data);
      setPromoted(data.onPlaylists.some(p => BEST_ALBUMS_PATTERN.test(p.name)));
      setLocalRating(data.rating);
      const match = data.onPlaylists.find(p => p.id === playlistId);
      if (match) onPlaylistName(match.name);
    } catch (err) {
      if (err instanceof AuthError) { await onAuthError(); return; }
      // No Alert here — neighbouring pages load in the background, so a
      // failure is shown inline on the page instead of popping up unprompted.
      setLoadFailed(true);
    }
  }, [albumId, playlistId, onAuthError, onPlaylistName]);

  useEffect(() => { loadAlbum(); }, [loadAlbum]);

  // Find the "Best Albums" playlist whose period matches the source playlist.
  // We only promote if we can identify an exact corresponding playlist —
  // falling back to "first result" risks silently adding to the wrong one.
  const bestAlbumsPlaylist = (() => {
    if (!album) return null;
    const sourceName =
      // Prefer the playlist the user explicitly navigated from.
      album.onPlaylists.find(p => p.id === playlistId)?.name ??
      // If no playlistId, look for a single unambiguous "New Albums" playlist
      // on this album (if there are multiple we can't safely guess).
      (() => {
        const newAlbumPlaylists = album.onPlaylists.filter(
          p => NEW_ALBUMS_PATTERN.test(p.name)
        );
        return newAlbumPlaylists.length === 1 ? newAlbumPlaylists[0].name : null;
      })();
    return sourceName
      ? (bestAlbumsPlaylists.find(
          p => extractPeriodKey(p.name) === extractPeriodKey(sourceName)
        ) ?? null)
      : null;
  })();

  const handlePromote = useCallback(async () => {
    if (!album || !bestAlbumsPlaylist || promoted || promoting) return;
    setPromoting(true);
    setPromoted(true);
    try {
      await promoteAlbum(album.id, bestAlbumsPlaylist.id);
      updateCachedAlbum(album.id, {
        onPlaylists: [...album.onPlaylists, { id: bestAlbumsPlaylist.id, name: bestAlbumsPlaylist.name }]
      });
    } catch (err) {
      setPromoted(false);
      if (err instanceof AuthError) { await onAuthError(); return; }
      Alert.alert('Error', 'Could not add to Best Albums. Please try again.');
    } finally {
      setPromoting(false);
    }
  }, [album, bestAlbumsPlaylist, promoted, promoting, onAuthError]);

  const handleRating = useCallback(async (newRating: number) => {
    if (!album || ratingPending) return;
    const previous = localRating;
    setLocalRating(newRating);
    setRatingPending(true);
    try {
      await setRating(album.id, newRating);
      updateCachedAlbum(album.id, { rating: newRating });
    } catch (err) {
      setLocalRating(previous);
      if (err instanceof AuthError) { await onAuthError(); return; }
      Alert.alert('Error', 'Could not save rating. Please try again.');
    } finally {
      setRatingPending(false);
    }
  }, [album, localRating, ratingPending, onAuthError]);

  const openInSpotify = useCallback(() => {
    if (!album) return;
    Linking.openURL(album.uri).catch(() => Alert.alert('Spotify not installed', 'Could not open Spotify.'));
  }, [album]);

  const navigateToInfo = useCallback(() => {
    if (!album) return;
    const artistNames = album.artists.map(a => a.name).join(', ');
    const params = new URLSearchParams({ name: album.name, artist: artistNames, imageUrl: album.imageUrl });
    router.push(`/album/${album.id}/info?${params.toString()}`);
  }, [album, router]);

  if (loadFailed) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Could not load album.</Text>
        <TouchableOpacity style={styles.btnRetry} onPress={loadAlbum} activeOpacity={0.8}>
          <Text style={styles.btnInfoText}>Try again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!album) {
    // Show what we already know from the playlist listing so the page isn't
    // blank while the tracks/rating load.
    return (
      <View style={styles.screen}>
        {summary?.imageUrl ? (
          <Image source={{ uri: summary.imageUrl }} style={styles.art} accessibilityLabel={summary.name} />
        ) : (
          <View style={[styles.art, styles.artPlaceholder]} />
        )}
        {summary && (
          <View style={styles.meta}>
            <Text style={styles.albumName}>{summary.name}</Text>
            <Text style={styles.artistName}>{summary.artists.map(a => a.name).join(', ')}</Text>
          </View>
        )}
        <ActivityIndicator size="large" color={Colors.accent} style={styles.pageSpinner} />
      </View>
    );
  }

  const prog = album.progress;
  const pct = prog ? Math.round(((prog.lastTrackIndex + 1) / prog.totalTracks) * 100) : 0;
  const currentTrackIndex = prog?.lastTrackIndex ?? -1;
  const artistNames = album.artists.map(a => a.name).join(', ');
  const releaseYear = album.releaseDate ? new Date(album.releaseDate).getFullYear() : null;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={[styles.content, { paddingBottom: 60 + insets.bottom }]}>

      {/* ── Art ──────────────────────────────────────────────────────────────── */}
      {album.imageUrl ? (
        <Image
          source={{ uri: album.imageUrl }}
          style={styles.art}
          accessibilityLabel={`${album.name} by ${artistNames}`}
        />
      ) : (
        <View style={[styles.art, styles.artPlaceholder]} />
      )}

      {/* ── Meta ─────────────────────────────────────────────────────────────── */}
      <View style={styles.meta}>
        <Text style={styles.albumName}>{album.name}</Text>
        <Text style={styles.artistName}>{artistNames}</Text>
        <View style={styles.chips}>
          {releaseYear && <Chip label={String(releaseYear)} />}
          {album.genres.slice(0, 2).map(g => <Chip key={g} label={g} />)}
          <Chip label={`${album.totalTracks} tracks`} />
        </View>
      </View>

      {/* ── Rating ───────────────────────────────────────────────────────────── */}
      <StarRating
        rating={localRating}
        pending={ratingPending}
        onRate={handleRating}
      />

      {/* ── Progress ─────────────────────────────────────────────────────────── */}
      {prog && (
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Track {currentTrackIndex + 1} of {album.totalTracks}</Text>
            <Text style={styles.progressPct}>{pct}%</Text>
          </View>
          <SegmentedProgress
            segments={trackSegments(currentTrackIndex + 1, album.totalTracks)}
            accessibilityLabel={`Track ${currentTrackIndex + 1} of ${album.totalTracks}`}
          />
        </View>
      )}

      {/* ── Actions ──────────────────────────────────────────────────────────── */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.btnSpotify} onPress={openInSpotify} activeOpacity={0.8}>
          <Text style={styles.btnSpotifyText}>▶  Open in Spotify</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btnInfo} onPress={navigateToInfo} activeOpacity={0.8}>
          <Text style={styles.btnInfoText}>ℹ️  Album Info</Text>
        </TouchableOpacity>

        {bestAlbumsPlaylist && (
          promoted ? (
            <View style={styles.btnPromotedDone}>
              <Text style={styles.btnPromotedDoneText}>✓  In Best Albums</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.btnPromote, promoting && styles.btnPromoteDisabled]}
              onPress={handlePromote}
              activeOpacity={0.8}
              disabled={promoting}
            >
              <Text style={styles.btnPromoteText}>
                {promoting ? 'Adding…' : `★  Add to ${bestAlbumsPlaylist.name}`}
              </Text>
            </TouchableOpacity>
          )
        )}
      </View>

      {/* ── Playlist membership tags ─────────────────────────────────────────── */}
      {album.onPlaylists.length > 0 && (
        <View style={styles.playlistTags}>
          {album.onPlaylists.map(p => (
            <View key={p.id} style={[styles.playlistTag, BEST_ALBUMS_PATTERN.test(p.name) && styles.playlistTagBest]}>
              <Text style={[styles.playlistTagText, BEST_ALBUMS_PATTERN.test(p.name) && styles.playlistTagTextBest]}>
                {p.name}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* ── Track list ───────────────────────────────────────────────────────── */}
      <Text style={styles.tracksHeading}>Tracks</Text>
      <TrackList tracks={album.tracks} currentTrackIndex={currentTrackIndex} />
    </ScrollView>
  );
}

// ── Playlist strip ─────────────────────────────────────────────────────────────

const STRIP_THUMB = 64;

const PlaylistStrip = forwardRef<
  FlatList<PlaylistAlbum>,
  {
    albums: PlaylistAlbum[];
    currentAlbumId: string;
    playlistName: string;
    onSelect: (albumId: string) => void;
  }
>(({ albums, currentAlbumId, playlistName, onSelect }, ref) => {
  return (
    <View style={stripStyles.container}>
      {playlistName ? (
        <Text style={stripStyles.heading} numberOfLines={1}>{playlistName}</Text>
      ) : null}
      <FlatList
        ref={ref}
        data={albums}
        horizontal
        keyExtractor={item => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={stripStyles.list}
        onScrollToIndexFailed={() => {}}
        renderItem={({ item }) => {
          const isCurrent = item.id === currentAlbumId;
          return (
            <TouchableOpacity
              style={[stripStyles.thumb, isCurrent && stripStyles.thumbCurrent]}
              onPress={() => !isCurrent && onSelect(item.id)}
              activeOpacity={isCurrent ? 1 : 0.7}
            >
              <Image
                source={{ uri: item.imageUrl }}
                style={stripStyles.thumbImg}
                accessibilityLabel={item.name}
              />
              {isCurrent && <View style={stripStyles.thumbCurrentOverlay} />}
              {/* Progress dot — show if album has any progress */}
              {item.progress && item.progress.progressPercent > 0 && (
                <View style={[
                  stripStyles.progressDot,
                  item.progress.progressPercent >= 95 && stripStyles.progressDotDone
                ]} />
              )}
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
});

PlaylistStrip.displayName = 'PlaylistStrip';

const stripStyles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingTop: 12,
    paddingBottom: 14,
  },
  heading: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  list: {
    paddingHorizontal: 12,
    gap: 8,
  },
  thumb: {
    width: STRIP_THUMB,
    height: STRIP_THUMB,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  thumbCurrent: {
    borderColor: Colors.accent,
    // Slight scale-up via padding trick — shadows the current album
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 6,
  },
  thumbImg: {
    width: '100%',
    height: '100%',
  },
  thumbCurrentOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.accentSoft,
  },
  progressDot: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.accent,
    borderWidth: 1,
    borderColor: Colors.surface,
  },
  progressDotDone: {
    backgroundColor: Colors.success,
  },
});

// ── Star rating ────────────────────────────────────────────────────────────────

const STAR_SIZE = 34;

function StarGlyph({ fill }: { fill: 'empty' | 'half' | 'full' }) {
  const name = fill === 'full' ? 'star' : fill === 'half' ? 'star-half' : 'star-outline';
  return (
    <Ionicons
      name={name}
      size={STAR_SIZE}
      color={fill === 'empty' ? Colors.textFaint : Colors.rating}
    />
  );
}

/**
 * Rating selector (stored 1–10, shown as 0.5–5 stars). The whole star row is
 * one touch target: tap or drag anywhere along it and the position snaps to
 * the nearest half star, so half ratings don't need a precise tap on half a
 * glyph. The value previews live while the finger is down and commits on
 * release.
 */
function StarRating({
  rating,
  pending,
  onRate
}: {
  rating: number | null;
  pending: boolean;
  onRate: (newRating: number) => void;
}) {
  const [scrubRating, setScrubRating] = useState<number | null>(null);
  const widthRef = useRef(0);
  const shown = scrubRating ?? rating;
  const displayValue = (shown ?? 0) / 2;

  const ratingAt = (x: number) =>
    Math.min(10, Math.max(1, Math.ceil((x / Math.max(1, widthRef.current)) * 10)));

  const onLayout = (e: LayoutChangeEvent) => { widthRef.current = e.nativeEvent.layout.width; };
  const onTouch = (e: GestureResponderEvent) => setScrubRating(ratingAt(e.nativeEvent.locationX));
  const onRelease = (e: GestureResponderEvent) => {
    const next = ratingAt(e.nativeEvent.locationX);
    setScrubRating(null);
    if (next !== rating) onRate(next);
  };

  return (
    <View style={styles.ratingBlock}>
      <View
        style={[styles.ratingRow, pending && styles.starPending]}
        onLayout={onLayout}
        onStartShouldSetResponder={() => !pending}
        onMoveShouldSetResponder={() => !pending}
        // Keep the touch while scrubbing sideways instead of handing it to
        // the album pager / vertical ScrollView.
        onResponderTerminationRequest={() => false}
        onResponderGrant={onTouch}
        onResponderMove={onTouch}
        onResponderRelease={onRelease}
        onResponderTerminate={() => setScrubRating(null)}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel="Rating"
        accessibilityValue={{ text: shown ? `${(shown / 2).toFixed(1)} out of 5 stars` : 'Not rated' }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={e => {
          const current = rating ?? 0;
          const next = e.nativeEvent.actionName === 'increment' ? Math.min(10, current + 1) : Math.max(1, current - 1);
          if (next !== rating) onRate(next);
        }}
      >
        {/* Children ignore touches so locationX is always relative to the row */}
        <View style={styles.starsInner} pointerEvents="none">
          {[1, 2, 3, 4, 5].map(star => {
            const fill = displayValue >= star ? 'full' : displayValue >= star - 0.5 ? 'half' : 'empty';
            return <StarGlyph key={star} fill={fill} />;
          })}
        </View>
      </View>
      <View style={styles.ratingValueWrap} pointerEvents="none">
        {shown ? (
          <Text style={[styles.ratingValue, scrubRating !== null && styles.ratingValueScrub]}>
            {(shown / 2).toFixed(1)}
            <Text style={styles.ratingOutOf}> / 5</Text>
          </Text>
        ) : (
          <Text style={styles.ratingHint}>Tap or slide{'\n'}to rate</Text>
        )}
      </View>
    </View>
  );
}

// ── Track list ─────────────────────────────────────────────────────────────────

function TrackList({ tracks, currentTrackIndex }: { tracks: AlbumTrack[]; currentTrackIndex: number }) {
  return (
    <View style={styles.trackList}>
      {tracks.map((track, idx) => {
        const listened = currentTrackIndex >= 0 && idx <= currentTrackIndex;
        const isCurrent = idx === currentTrackIndex;
        const mins = Math.floor(track.durationMs / 60000);
        const secs = String(Math.floor((track.durationMs % 60000) / 1000)).padStart(2, '0');
        return (
          <View key={track.id}>
            <View style={[styles.trackRow, isCurrent && styles.trackRowCurrent, listened && !isCurrent && styles.trackRowListened]}>
              <Text style={[styles.trackNum, isCurrent && styles.trackNumCurrent]}>
                {isCurrent ? '♪' : track.trackNumber}
              </Text>
              <View style={styles.trackInfo}>
                <Text style={[styles.trackName, isCurrent && styles.trackNameCurrent]} numberOfLines={1}>
                  {track.name}
                </Text>
                <Text style={styles.trackDuration}>{mins}:{secs}</Text>
              </View>
              {listened && !isCurrent && <Text style={styles.listenedTick}>✓</Text>}
            </View>
            {isCurrent && <View style={styles.currentDivider} />}
          </View>
        );
      })}
      <View style={styles.bottomSpacer} />
    </View>
  );
}

function Chip({ label }: { label: string }) {
  return (
    <View style={styles.chip}>
      <Text style={styles.chipText}>{label}</Text>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  content: { paddingBottom: 60 },
  centered: { flex: 1, backgroundColor: Colors.bg, justifyContent: 'center', alignItems: 'center' },

  pager: { flex: 1 },
  pageSpinner: { marginTop: 24 },
  errorText: { color: Colors.textMuted, fontSize: 15, marginBottom: 16 },
  btnRetry: {
    backgroundColor: Colors.fill, borderWidth: 1,
    borderColor: Colors.hairline, borderRadius: 14,
    paddingVertical: 12, paddingHorizontal: 24
  },

  art: { width: '100%', aspectRatio: 1 },
  artPlaceholder: { backgroundColor: Colors.surface },

  meta: { padding: 20 },
  albumName: { color: Colors.text, fontSize: 26, fontFamily: Fonts.display, letterSpacing: -0.3, marginBottom: 4 },
  artistName: { color: Colors.textMuted, fontSize: 16, fontWeight: '500', marginBottom: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    backgroundColor: Colors.fill, borderWidth: 1,
    borderColor: Colors.hairline, borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4
  },
  chipText: { color: Colors.textMuted, fontSize: 11, fontWeight: '500' },

  ratingBlock: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 8, marginBottom: 8, gap: 16
  },
  // Generous vertical padding so the touch strip is easy to hit
  ratingRow: { flex: 1, paddingVertical: 8 },
  starsInner: { flexDirection: 'row', justifyContent: 'space-between' },
  starPending: { opacity: 0.5 },
  ratingValueWrap: { width: 64, alignItems: 'flex-end' },
  ratingValue: { color: Colors.text, fontSize: 24, fontFamily: Fonts.display, fontVariant: ['tabular-nums'] },
  ratingValueScrub: { color: Colors.rating },
  ratingOutOf: { color: Colors.textMuted, fontSize: 13 },
  ratingHint: { color: Colors.textMuted, fontSize: 11, textAlign: 'right', lineHeight: 15 },

  progressSection: { paddingHorizontal: 20, marginBottom: 4 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressLabel: { color: Colors.textMuted, fontSize: 13 },
  progressPct: { color: Colors.accent, fontSize: 13, fontWeight: '600', fontVariant: ['tabular-nums'] },

  actions: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8, gap: 10 },
  btnSpotify: { backgroundColor: Colors.accent, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  btnSpotifyText: { color: Colors.onAccent, fontSize: 15, fontWeight: '700' },
  btnInfo: {
    backgroundColor: Colors.fill, borderWidth: 1,
    borderColor: Colors.hairline, borderRadius: 14,
    paddingVertical: 14, alignItems: 'center'
  },
  btnInfoText: { color: Colors.text, fontSize: 14, fontWeight: '600' },
  btnPromote: {
    backgroundColor: Colors.successSoft, borderWidth: 1,
    borderColor: Colors.successBorder, borderRadius: 14,
    paddingVertical: 16, alignItems: 'center'
  },
  btnPromoteDisabled: { opacity: 0.6 },
  btnPromoteText: { color: Colors.successText, fontSize: 15, fontWeight: '700' },
  btnPromotedDone: {
    borderRadius: 14, paddingVertical: 16, alignItems: 'center',
    backgroundColor: Colors.successSoft, borderWidth: 1, borderColor: Colors.successBorder
  },
  btnPromotedDoneText: { color: Colors.successTextMuted, fontSize: 15, fontWeight: '600' },

  playlistTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 20, paddingBottom: 16 },
  playlistTag: {
    backgroundColor: Colors.accentSoft, borderWidth: 1,
    borderColor: Colors.accentBorder, borderRadius: 6,
    paddingHorizontal: 10, paddingVertical: 3
  },
  playlistTagBest: { backgroundColor: Colors.successSoft, borderColor: Colors.successBorder },
  playlistTagText: { color: Colors.accent, fontSize: 11, fontWeight: '500' },
  playlistTagTextBest: { color: Colors.successText },

  tracksHeading: { color: Colors.text, fontSize: 18, fontFamily: Fonts.displayMedium, paddingHorizontal: 20, paddingBottom: 8 },
  trackList: { paddingHorizontal: 20 },
  trackRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 14 },
  trackRowCurrent: {
    backgroundColor: Colors.accentSoft, borderRadius: 10,
    paddingHorizontal: 10, marginHorizontal: -10
  },
  trackRowListened: { opacity: 0.45 },
  trackNum: { width: 22, textAlign: 'center', color: Colors.textMuted, fontSize: 13, flexShrink: 0 },
  trackNumCurrent: { color: Colors.accent, fontSize: 18 },
  trackInfo: { flex: 1 },
  trackName: { color: Colors.text, fontSize: 15, fontWeight: '500' },
  trackNameCurrent: { color: Colors.accent, fontWeight: '600' },
  trackDuration: { color: Colors.textMuted, fontSize: 12, marginTop: 2 },
  listenedTick: { color: Colors.success, fontSize: 16 },
  currentDivider: { height: 1, backgroundColor: Colors.accentBorder, marginVertical: 2 },
  bottomSpacer: { height: 40 }
});
