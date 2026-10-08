import { View, Text, ScrollView, Image, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fetchAlbumInfo, AlbumInfo, AuthError } from '../../../lib/api';
import { Colors } from '../../../constants/colors';
import { clearTokens } from '../../../lib/auth';

// While the server is enriching an album in the background, re-fetch on this interval
// so the info appears on-screen instead of needing a revisit. A run usually takes a few
// seconds; stop after ~1 min (queue backlog) and fall back to pull-to-refresh.
const POLL_INTERVAL_MS = 4000;
const MAX_POLLS = 15;

export default function AlbumInfoScreen() {
  const { albumId, name, artist, imageUrl } = useLocalSearchParams<{
    albumId: string;
    name?: string;
    artist?: string;
    imageUrl?: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [info, setInfo] = useState<AlbumInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pollsLeft, setPollsLeft] = useState(MAX_POLLS);
  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleAuthError = useCallback(async () => {
    await clearTokens();
    router.replace('/(auth)/login');
  }, [router]);

  const load = useCallback(async () => {
    try {
      const data = await fetchAlbumInfo(albumId);
      setInfo(data);
      setLoadError(false);
    } catch (err) {
      if (err instanceof AuthError) { await handleAuthError(); return; }
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [albumId, handleAuthError]);

  useEffect(() => { load(); }, [load]);

  const waitingForEnrichment = !!info?.pending && info.enrichmentQueued;
  const polling = waitingForEnrichment && pollsLeft > 0 && !loadError;

  useEffect(() => {
    if (!polling) return;
    pollTimer.current = setTimeout(() => {
      setPollsLeft(n => n - 1);
      load();
    }, POLL_INTERVAL_MS);
    return () => { if (pollTimer.current) clearTimeout(pollTimer.current); };
  }, [polling, info, load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setPollsLeft(MAX_POLLS);
    await load();
    setRefreshing(false);
  }, [load]);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingBottom: 60 + insets.bottom }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
    >
      <View style={styles.header}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.art} accessibilityLabel={name} />
        ) : (
          <View style={[styles.art, styles.artPlaceholder]} />
        )}
        <View style={styles.headerText}>
          {!!name && <Text style={styles.albumName} numberOfLines={2}>{name}</Text>}
          {!!artist && <Text style={styles.artistName} numberOfLines={1}>{artist}</Text>}
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={styles.spinner} />
      ) : loadError ? (
        <Text style={styles.message}>Could not load album info. Please try again later.</Text>
      ) : (
        <>
          {info?.type && (
            <View style={styles.chip}>
              <Text style={styles.chipText}>{info.type}</Text>
            </View>
          )}

          {(info?.listeners || info?.playcount) && (
            <Text style={styles.stats}>
              {[
                info.listeners ? `${formatCount(info.listeners)} listeners` : null,
                info.playcount ? `${formatCount(info.playcount)} plays` : null
              ].filter(Boolean).join(' · ')}
            </Text>
          )}

          {info?.summary ? (
            <Text style={styles.summary}>{info.summary}</Text>
          ) : polling ? (
            <View style={styles.pendingRow}>
              <ActivityIndicator size="small" color={Colors.textMuted} />
              <Text style={[styles.message, styles.pendingText]}>Fetching more info about this album…</Text>
            </View>
          ) : (
            <Text style={styles.message}>
              {waitingForEnrichment
                ? "Still fetching info for this album — pull down to refresh in a minute."
                : info?.pending
                  ? "Couldn't fetch info for this album right now — pull down to try again."
                  : 'No extra info found for this album.'}
            </Text>
          )}
        </>
      )}
    </ScrollView>
  );
}

const ART_SIZE = 88;

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  return String(n);
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.surfaceDark },
  content: { padding: 20, paddingBottom: 60 },

  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, gap: 14 },
  art: { width: ART_SIZE, height: ART_SIZE, borderRadius: 10 },
  artPlaceholder: { backgroundColor: Colors.surface },
  headerText: { flex: 1 },
  albumName: { color: Colors.text, fontSize: 18, fontWeight: '800', letterSpacing: -0.3, marginBottom: 4 },
  artistName: { color: Colors.textMuted, fontSize: 14, fontWeight: '500' },

  spinner: { marginTop: 40 },

  chip: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4, marginBottom: 16
  },
  chipText: { color: Colors.textMuted, fontSize: 11, fontWeight: '500' },

  stats: { color: Colors.textMuted, fontSize: 13, fontWeight: '500', marginBottom: 16 },

  summary: { color: Colors.text, fontSize: 15, lineHeight: 22 },
  message: { color: Colors.textMuted, fontSize: 14, lineHeight: 20, marginTop: 8 },
  pendingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  pendingText: { marginTop: 0 }
});
