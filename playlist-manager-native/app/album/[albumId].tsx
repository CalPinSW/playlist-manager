import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Linking,
  Alert
} from 'react-native';
import { useCallback, useEffect, useState } from 'react';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { fetchAlbumDetail, fetchPlaylists, promoteAlbum, setRating, AuthError, AlbumDetail, AlbumTrack, PlaylistSummary } from '../../lib/api';
import { ProgressBar } from '../../components/ProgressBar';
import { Colors } from '../../constants/colors';
import { clearTokens } from '../../lib/auth';

const BEST_ALBUMS_PATTERN = /best albums/i;

export default function AlbumDetailScreen() {
  const { albumId } = useLocalSearchParams<{ albumId: string }>();
  const navigation = useNavigation();
  const router = useRouter();

  const [album, setAlbum] = useState<AlbumDetail | null>(null);
  const [bestAlbumsPlaylist, setBestAlbumsPlaylist] = useState<PlaylistSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [promoting, setPromoting] = useState(false);
  const [promoted, setPromoted] = useState(false);
  // Rating state (1–10 integer; null = unrated). Managed locally after initial load.
  const [localRating, setLocalRating] = useState<number | null>(null);
  const [ratingPending, setRatingPending] = useState(false);

  const handleAuthError = useCallback(async () => {
    await clearTokens();
    router.replace('/(auth)/login');
  }, [router]);

  const loadAlbum = useCallback(async () => {
    try {
      const [data, playlists] = await Promise.all([
        fetchAlbumDetail(albumId),
        fetchPlaylists('Best Albums', 5)
      ]);
      setAlbum(data);
      // Determine promoted state from onPlaylists
      const alreadyPromoted = data.onPlaylists.some(p => BEST_ALBUMS_PATTERN.test(p.name));
      setPromoted(alreadyPromoted);
      // Store the target Best Albums playlist (first one found)
      setBestAlbumsPlaylist(playlists[0] ?? null);
      // Seed local rating from server response
      setLocalRating(data.rating);
    } catch (err) {
      if (err instanceof AuthError) { await handleAuthError(); return; }
      Alert.alert('Error', 'Could not load album.');
    } finally {
      setLoading(false);
    }
  }, [albumId, handleAuthError]);

  useEffect(() => { loadAlbum(); }, [loadAlbum]);

  const handlePromote = useCallback(async () => {
    if (!album || !bestAlbumsPlaylist || promoted || promoting) return;
    setPromoting(true);
    // Optimistic update
    setPromoted(true);
    try {
      await promoteAlbum(album.id, bestAlbumsPlaylist.id);
    } catch (err) {
      // Revert on failure
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
    // Optimistic update
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
    Linking.openURL(album.uri).catch(() => {
      Alert.alert('Spotify not installed', 'Could not open Spotify.');
    });
  }, [album]);

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

  const canPromote = !!bestAlbumsPlaylist && !promoted;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {/* Art */}
      {album.imageUrl ? (
        <Image
          source={{ uri: album.imageUrl }}
          style={styles.art}
          accessibilityLabel={`${album.name} by ${artistNames}`}
        />
      ) : (
        <View style={[styles.art, styles.artPlaceholder]} />
      )}

      {/* Meta */}
      <View style={styles.meta}>
        <Text style={styles.albumName}>{album.name}</Text>
        <Text style={styles.artistName}>{artistNames}</Text>
        <View style={styles.chips}>
          {releaseYear && <Chip label={String(releaseYear)} />}
          {album.genres.slice(0, 2).map(g => <Chip key={g} label={g} />)}
          <Chip label={`${album.totalTracks} tracks`} />
        </View>
      </View>

      {/* Rating — interactive half-star picker */}
      <StarRating
        rating={localRating}
        pending={ratingPending}
        onRate={handleRating}
      />

      {/* Progress */}
      {prog && (
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Track {currentTrackIndex + 1} of {album.totalTracks}</Text>
            <Text style={styles.progressPct}>{pct}%</Text>
          </View>
          <ProgressBar percent={pct} />
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.btnSpotify} onPress={openInSpotify} activeOpacity={0.8}>
          <Text style={styles.btnSpotifyText}>▶  Open in Spotify</Text>
        </TouchableOpacity>

        {/* Promote button — hidden if no Best Albums playlist found */}
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
              accessibilityRole="button"
              accessibilityLabel="Add to Best Albums"
            >
              <Text style={styles.btnPromoteText}>
                {promoting ? 'Adding…' : '★  Add to Best Albums'}
              </Text>
            </TouchableOpacity>
          )
        )}
      </View>

      {/* Playlist membership tags */}
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

      {/* Track list */}
      <Text style={styles.tracksHeading}>Tracks</Text>
      <TrackList tracks={album.tracks} currentTrackIndex={currentTrackIndex} />
    </ScrollView>
  );
}

// ── Star rating ────────────────────────────────────────────────────────────────

const STAR_SIZE = 26;

/**
 * Renders a single star glyph: empty, half-filled, or fully filled.
 *
 * Half-star is drawn by overlaying a clipped `★` on top of a full-width `☆`,
 * avoiding Unicode characters like ⯨ that are missing from most mobile fonts.
 */
function StarGlyph({ fill, faded }: { fill: 'empty' | 'half' | 'full'; faded?: boolean }) {
  return (
    <View style={styles.starGlyph} pointerEvents="none">
      {/* Background: empty outline star at full width */}
      <Text style={[styles.star, styles.starEmpty, faded && styles.starPending]}>☆</Text>
      {/* Foreground: filled star clipped to 50% (half) or 100% (full) */}
      {fill !== 'empty' && (
        <View
          style={[
            styles.starClip,
            fill === 'half' ? { width: STAR_SIZE / 2 } : { width: STAR_SIZE }
          ]}
        >
          <Text style={[styles.star, styles.starFilled, faded && styles.starPending]}>★</Text>
        </View>
      )}
    </View>
  );
}

/**
 * Interactive half-star rating row.
 *
 * Each star is split into left (N–0.5) and right (N) Pressable zones.
 * While a finger is held down, pressedRating drives the display so the
 * user sees exactly what they are about to select before lifting.
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
  const [pressedRating, setPressedRating] = useState<number | null>(null);

  // While pressing show the preview; otherwise show the committed rating.
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
            {/* Left half-star touch zone */}
            <Pressable
              style={[styles.starHalf, styles.starHalfLeft]}
              onPressIn={() => setPressedRating(leftVal)}
              onPressOut={() => setPressedRating(null)}
              onPress={() => { if (leftVal !== rating) onRate(leftVal); }}
              disabled={pending}
            />
            {/* Right full-star touch zone */}
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
  starWrap: {
    // Sized to the glyph; touch zones sit absolutely inside.
    width: STAR_SIZE, height: STAR_SIZE,
    position: 'relative', alignItems: 'center', justifyContent: 'center'
  },
  starHalf: { position: 'absolute', top: 0, bottom: 0, width: '50%' },
  starHalfLeft: { left: 0 },
  starHalfRight: { right: 0 },
  // StarGlyph layout: empty star in place, filled star overlaid + clipped.
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
  btnSpotify: {
    backgroundColor: Colors.primary, borderRadius: 14,
    paddingVertical: 16, alignItems: 'center'
  },
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
    backgroundColor: 'rgba(120,166,60,0.08)', borderWidth: 1,
    borderColor: 'rgba(120,166,60,0.2)'
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
