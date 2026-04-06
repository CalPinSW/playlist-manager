import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Linking,
  Alert
} from 'react-native';
import { useCallback, useEffect, useState } from 'react';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { fetchAlbumDetail, fetchPlaylists, promoteAlbum, AuthError, AlbumDetail, AlbumTrack, PlaylistSummary } from '../../lib/api';
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
  const rating = album.rating;
  const fullStars = rating !== null ? Math.floor(rating / 2) : 0;
  const hasHalf = rating !== null && rating % 2 !== 0;
  const halfStarDisplay = rating !== null ? (rating / 2).toFixed(1) : null;

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

      {/* Rating display */}
      {halfStarDisplay !== null && (
        <View style={styles.ratingRow}>
          {[1, 2, 3, 4, 5].map(i => {
            const filled = i <= fullStars;
            const half = !filled && hasHalf && i === fullStars + 1;
            return (
              <Text key={i} style={[styles.star, filled || half ? styles.starFilled : styles.starEmpty]}>
                {filled ? '★' : half ? '⯨' : '☆'}
              </Text>
            );
          })}
          <Text style={styles.ratingLabel}>{halfStarDisplay} / 5</Text>
        </View>
      )}

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

  ratingRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, gap: 4, marginBottom: 4 },
  star: { fontSize: 24 },
  starFilled: { color: '#de7c38' },
  starEmpty: { color: 'rgba(255,255,255,0.2)' },
  ratingLabel: { color: Colors.textMuted, fontSize: 13, marginLeft: 8 },

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
