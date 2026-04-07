import {
  View,
  Text,
  ScrollView,
  FlatList,
  Image,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Linking,
  Alert
} from 'react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { fetchAlbumDetail, fetchPlaylistAlbums, fetchPlaylists, promoteAlbum, setRating, AuthError, AlbumDetail, AlbumTrack, PlaylistAlbum, PlaylistSummary } from '../../lib/api';
import { ProgressBar } from '../../components/ProgressBar';
import { Colors } from '../../constants/colors';
import { clearTokens } from '../../lib/auth';

const BEST_ALBUMS_PATTERN = /best albums/i;

export default function AlbumDetailScreen() {
  const { albumId, playlistId } = useLocalSearchParams<{ albumId: string; playlistId?: string }>();
  const router = useRouter();

  const [album, setAlbum] = useState<AlbumDetail | null>(null);
  const [bestAlbumsPlaylist, setBestAlbumsPlaylist] = useState<PlaylistSummary | null>(null);
  const [playlistAlbums, setPlaylistAlbums] = useState<PlaylistAlbum[]>([]);
  const [playlistName, setPlaylistName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [promoting, setPromoting] = useState(false);
  const [promoted, setPromoted] = useState(false);
  const [localRating, setLocalRating] = useState<number | null>(null);
  const [ratingPending, setRatingPending] = useState(false);

  // Ref for scrolling the playlist strip to the current album on load.
  const stripRef = useRef<FlatList<PlaylistAlbum>>(null);

  const handleAuthError = useCallback(async () => {
    await clearTokens();
    router.replace('/(auth)/login');
  }, [router]);

  const loadAlbum = useCallback(async () => {
    try {
      const requests: [Promise<AlbumDetail>, Promise<PlaylistSummary[]>, Promise<PlaylistAlbum[]>] = [
        fetchAlbumDetail(albumId),
        fetchPlaylists('Best Albums', 5),
        playlistId ? fetchPlaylistAlbums(playlistId) : Promise.resolve([]),
      ];
      const [data, playlists, siblingAlbums] = await Promise.all(requests);

      setAlbum(data);
      setPromoted(data.onPlaylists.some(p => BEST_ALBUMS_PATTERN.test(p.name)));
      setBestAlbumsPlaylist(playlists[0] ?? null);
      setLocalRating(data.rating);

      if (siblingAlbums.length > 0) {
        setPlaylistAlbums(siblingAlbums);
        // Infer playlist name from album's onPlaylists if we have it, else from the data itself.
        const match = data.onPlaylists.find(p => p.id === playlistId);
        setPlaylistName(match?.name ?? '');
      }
    } catch (err) {
      if (err instanceof AuthError) { await handleAuthError(); return; }
      Alert.alert('Error', 'Could not load album.');
    } finally {
      setLoading(false);
    }
  }, [albumId, playlistId, handleAuthError]);

  useEffect(() => { loadAlbum(); }, [loadAlbum]);

  // Scroll the playlist strip so the current album is centred after data loads.
  useEffect(() => {
    if (playlistAlbums.length === 0) return;
    const idx = playlistAlbums.findIndex(a => a.id === albumId);
    if (idx > 0) {
      // Small delay lets the FlatList finish layout before scrolling.
      setTimeout(() => {
        stripRef.current?.scrollToIndex({ index: idx, animated: false, viewPosition: 0.5 });
      }, 100);
    }
  }, [playlistAlbums, albumId]);

  const handlePromote = useCallback(async () => {
    if (!album || !bestAlbumsPlaylist || promoted || promoting) return;
    setPromoting(true);
    setPromoted(true);
    try {
      await promoteAlbum(album.id, bestAlbumsPlaylist.id);
    } catch (err) {
      setPromoted(false);
      if (err instanceof AuthError) { await handleAuthError(); return; }
      Alert.alert('Error', 'Could not add to Best Albums. Please try again.');
    } finally {
      setPromoting(false);
    }
  }, [album, bestAlbumsPlaylist, promoted, promoting, handleAuthError]);

  const handleRating = useCallback(async (newRating: number) => {
    if (!album || ratingPending) return;
    const previous = localRating;
    setLocalRating(newRating);
    setRatingPending(true);
    try {
      await setRating(album.id, newRating);
    } catch (err) {
      setLocalRating(previous);
      if (err instanceof AuthError) { await handleAuthError(); return; }
      Alert.alert('Error', 'Could not save rating. Please try again.');
    } finally {
      setRatingPending(false);
    }
  }, [album, localRating, ratingPending, handleAuthError]);

  const openInSpotify = useCallback(() => {
    if (!album) return;
    Linking.openURL(album.uri).catch(() => Alert.alert('Spotify not installed', 'Could not open Spotify.'));
  }, [album]);

  const navigateToSibling = useCallback((targetAlbumId: string) => {
    // Replace rather than push so the back stack doesn't grow with each album.
    router.replace(`/album/${targetAlbumId}?playlistId=${playlistId}`);
  }, [router, playlistId]);

  if (loading || !album) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const prog = album.progress;
  const pct = prog ? Math.round(((prog.lastTrackIndex + 1) / prog.totalTracks) * 100) : 0;
  const currentTrackIndex = prog?.lastTrackIndex ?? -1;
  const artistNames = album.artists.map(a => a.name).join(', ');
  const releaseYear = album.releaseDate ? new Date(album.releaseDate).getFullYear() : null;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>

      {/* ── Playlist strip ──────────────────────────────────────────────────── */}
      {playlistAlbums.length > 0 && (
        <PlaylistStrip
          ref={stripRef}
          albums={playlistAlbums}
          currentAlbumId={albumId}
          playlistName={playlistName}
          onSelect={navigateToSibling}
        />
      )}

      {/* ── Art ──────────────────────────────────────────────────────────────── */}
      {album.imageUrl ? (
        <Image
          source={{ uri: album.imageUrl }}
          style={[styles.art, playlistAlbums.length > 0 && styles.artWithStrip]}
          accessibilityLabel={`${album.name} by ${artistNames}`}
        />
      ) : (
        <View style={[styles.art, styles.artPlaceholder, playlistAlbums.length > 0 && styles.artWithStrip]} />
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
          <ProgressBar percent={pct} />
        </View>
      )}

      {/* ── Actions ──────────────────────────────────────────────────────────── */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.btnSpotify} onPress={openInSpotify} activeOpacity={0.8}>
          <Text style={styles.btnSpotifyText}>▶  Open in Spotify</Text>
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
                {promoting ? 'Adding…' : '★  Add to Best Albums'}
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

import { forwardRef } from 'react';

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
    color: '#c9a8ff',
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
    borderColor: Colors.primary,
    // Slight scale-up via padding trick — shadows the current album
    shadowColor: Colors.primary,
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
    backgroundColor: 'rgba(132,61,255,0.15)',
  },
  progressDot: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    borderWidth: 1,
    borderColor: Colors.surface,
  },
  progressDotDone: {
    backgroundColor: '#78a63c',
  },
});

// ── Star rating ────────────────────────────────────────────────────────────────

const STAR_SIZE = 26;

function StarGlyph({ fill, faded }: { fill: 'empty' | 'half' | 'full'; faded?: boolean }) {
  return (
    <View style={styles.starGlyph} pointerEvents="none">
      <Text style={[styles.star, styles.starEmpty, faded && styles.starPending]}>☆</Text>
      {fill !== 'empty' && (
        <View style={[styles.starClip, fill === 'half' ? { width: STAR_SIZE / 2 } : { width: STAR_SIZE }]}>
          <Text style={[styles.star, styles.starFilled, faded && styles.starPending]}>★</Text>
        </View>
      )}
    </View>
  );
}

function StarRating({
  rating,
  pending,
  onRate
}: {
  rating: number | null;
  pending: boolean;
  onRate: (newRating: number) => void;
}) {
  const [pressedRating, setPressedRating] = useState<number | null>(null);
  const displayValue = (pressedRating ?? rating ?? 0) / 2;

  const labelText = pressedRating !== null
    ? `${(pressedRating / 2).toFixed(1)} / 5`
    : rating !== null
      ? `${(rating / 2).toFixed(1)} / 5`
      : 'Tap to rate';

  return (
    <View style={styles.ratingRow}>
      {[1, 2, 3, 4, 5].map(star => {
        const filled = displayValue >= star;
        const half = !filled && displayValue >= star - 0.5;
        const fill: 'full' | 'half' | 'empty' = filled ? 'full' : half ? 'half' : 'empty';
        const leftVal = (star - 1) * 2 + 1;
        const rightVal = star * 2;
        return (
          <View key={star} style={styles.starWrap}>
            <Pressable
              style={[styles.starHalf, styles.starHalfLeft]}
              onPressIn={() => setPressedRating(leftVal)}
              onPressOut={() => setPressedRating(null)}
              onPress={() => { if (leftVal !== rating) onRate(leftVal); }}
              disabled={pending}
            />
            <Pressable
              style={[styles.starHalf, styles.starHalfRight]}
              onPressIn={() => setPressedRating(rightVal)}
              onPressOut={() => setPressedRating(null)}
              onPress={() => { if (rightVal !== rating) onRate(rightVal); }}
              disabled={pending}
            />
            <StarGlyph fill={fill} faded={pending} />
          </View>
        );
      })}
      <Text style={[styles.ratingLabel, pending && styles.starPending]}>{labelText}</Text>
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
  screen: { flex: 1, backgroundColor: Colors.surfaceDark },
  content: { paddingBottom: 60 },
  centered: { flex: 1, backgroundColor: Colors.surfaceDark, justifyContent: 'center', alignItems: 'center' },

  art: { width: '100%', aspectRatio: 1 },
  artWithStrip: { },
  artPlaceholder: { backgroundColor: Colors.surface },

  meta: { padding: 20 },
  albumName: { color: Colors.text, fontSize: 24, fontWeight: '800', letterSpacing: -0.4, marginBottom: 4 },
  artistName: { color: Colors.textMuted, fontSize: 16, fontWeight: '500', marginBottom: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4
  },
  chipText: { color: Colors.textMuted, fontSize: 11, fontWeight: '500' },

  ratingRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 10,
    gap: 2, marginBottom: 4
  },
  starWrap: { width: STAR_SIZE, height: STAR_SIZE, position: 'relative', alignItems: 'center', justifyContent: 'center' },
  starHalf: { position: 'absolute', top: 0, bottom: 0, width: '50%' },
  starHalfLeft: { left: 0 },
  starHalfRight: { right: 0 },
  starGlyph: { width: STAR_SIZE, height: STAR_SIZE, position: 'relative' },
  starClip: { position: 'absolute', top: 0, left: 0, height: STAR_SIZE, overflow: 'hidden' },
  star: { fontSize: STAR_SIZE, lineHeight: STAR_SIZE },
  starFilled: { color: '#de7c38' },
  starEmpty: { color: 'rgba(255,255,255,0.18)' },
  starPending: { opacity: 0.5 },
  ratingLabel: { color: Colors.textMuted, fontSize: 13, marginLeft: 10 },

  progressSection: { paddingHorizontal: 20, marginBottom: 4 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressLabel: { color: Colors.textMuted, fontSize: 13 },
  progressPct: { color: Colors.primary, fontSize: 13, fontWeight: '600' },

  actions: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8, gap: 10 },
  btnSpotify: { backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  btnSpotifyText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  btnPromote: {
    backgroundColor: 'rgba(120,166,60,0.15)', borderWidth: 1,
    borderColor: 'rgba(120,166,60,0.4)', borderRadius: 14,
    paddingVertical: 16, alignItems: 'center'
  },
  btnPromoteDisabled: { opacity: 0.6 },
  btnPromoteText: { color: '#b3d581', fontSize: 15, fontWeight: '700' },
  btnPromotedDone: {
    borderRadius: 14, paddingVertical: 16, alignItems: 'center',
    backgroundColor: 'rgba(120,166,60,0.08)', borderWidth: 1, borderColor: 'rgba(120,166,60,0.2)'
  },
  btnPromotedDoneText: { color: 'rgba(179,213,129,0.5)', fontSize: 15, fontWeight: '600' },

  playlistTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 20, paddingBottom: 16 },
  playlistTag: {
    backgroundColor: 'rgba(132,61,255,0.12)', borderWidth: 1,
    borderColor: 'rgba(132,61,255,0.25)', borderRadius: 6,
    paddingHorizontal: 10, paddingVertical: 3
  },
  playlistTagBest: { backgroundColor: 'rgba(120,166,60,0.12)', borderColor: 'rgba(120,166,60,0.3)' },
  playlistTagText: { color: '#bea6ff', fontSize: 11, fontWeight: '500' },
  playlistTagTextBest: { color: '#b3d581' },

  tracksHeading: { color: Colors.text, fontSize: 16, fontWeight: '700', paddingHorizontal: 20, paddingBottom: 8 },
  trackList: { paddingHorizontal: 20 },
  trackRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 14 },
  trackRowCurrent: {
    backgroundColor: 'rgba(132,61,255,0.08)', borderRadius: 10,
    paddingHorizontal: 10, marginHorizontal: -10
  },
  trackRowListened: { opacity: 0.45 },
  trackNum: { width: 22, textAlign: 'center', color: Colors.textMuted, fontSize: 13, flexShrink: 0 },
  trackNumCurrent: { color: Colors.primary, fontSize: 18 },
  trackInfo: { flex: 1 },
  trackName: { color: Colors.text, fontSize: 15, fontWeight: '500' },
  trackNameCurrent: { color: '#bea6ff', fontWeight: '600' },
  trackDuration: { color: Colors.textMuted, fontSize: 12, marginTop: 2 },
  listenedTick: { color: '#78a63c', fontSize: 16 },
  currentDivider: { height: 1, backgroundColor: 'rgba(132,61,255,0.2)', marginVertical: 2 },
  bottomSpacer: { height: 40 }
});
