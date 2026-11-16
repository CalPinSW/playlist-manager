import { View, Text, ScrollView, Image, StyleSheet, ActivityIndicator, RefreshControl, Pressable, Linking } from 'react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { fetchAlbumInfo, refreshAlbumInfo, AlbumInfo, AuthError } from '../../../lib/api';
import { Colors, Fonts } from '../../../constants/colors';
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
  // Set while a manual "Check again" is running: the `fetchedAt` the info had when it was
  // requested ('' if it had none). The run is done once the server reports a different one.
  const [recheckFrom, setRecheckFrom] = useState<string | null>(null);
  const [recheckError, setRecheckError] = useState(false);

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

  // Queued covers both the first fetch for an album (`pending`) and a refresh of info that
  // was due — e.g. a new release being re-checked for reviews — so poll for either.
  // A manual re-check isn't reflected in `enrichmentQueued` (that only covers automatic
  // runs), so it's tracked here by watching for `fetchedAt` to move.
  const rechecking = recheckFrom !== null && (info?.fetchedAt ?? '') === recheckFrom;
  const waitingForEnrichment = !!info?.enrichmentQueued || rechecking;
  const polling = waitingForEnrichment && pollsLeft > 0 && !loadError;

  const reviewLinks = info?.reviewLinks ?? [];
  const artists = info?.artists ?? [];
  const hasContent = !!info?.summary || !!info?.reception || reviewLinks.length > 0 || artists.length > 0;

  useEffect(() => {
    if (!polling) return;
    pollTimer.current = setTimeout(() => {
      setPollsLeft(n => n - 1);
      load();
    }, POLL_INTERVAL_MS);
    return () => { if (pollTimer.current) clearTimeout(pollTimer.current); };
  }, [polling, info, load]);

  const onCheckAgain = useCallback(async () => {
    setRecheckError(false);
    try {
      await refreshAlbumInfo(albumId);
      setPollsLeft(MAX_POLLS);
      setRecheckFrom(info?.fetchedAt ?? '');
    } catch (err) {
      if (err instanceof AuthError) { await handleAuthError(); return; }
      setRecheckError(true);
    }
  }, [albumId, info?.fetchedAt, handleAuthError]);

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
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />}
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
        <ActivityIndicator size="large" color={Colors.accent} style={styles.spinner} />
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

          {!!info?.summary && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About the album</Text>
              <Text style={styles.body}>{info.summary}</Text>
              <SourceLink
                source={info.summarySource}
                url={info.summarySource === 'wikipedia' ? info.wikipediaUrl : null}
              />
            </View>
          )}

          {(!!info?.reception || reviewLinks.length > 0) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Reviews</Text>
              {!!info?.reception && (
                <>
                  <Text style={styles.body}>{info.reception}</Text>
                  <SourceLink source="wikipedia" url={info.wikipediaUrl} />
                </>
              )}
              {reviewLinks.length > 0 && (
                <View style={[styles.links, !!info?.reception && styles.linksAfterText]}>
                  {reviewLinks.map(link => (
                    <Pressable
                      key={link.url}
                      style={styles.linkChip}
                      onPress={() => openUrl(link.url)}
                      accessibilityRole="link"
                      accessibilityLabel={`Read the review on ${link.source}`}
                    >
                      <Text style={styles.linkChipText}>{link.source}</Text>
                      <Feather name="arrow-up-right" size={13} color={Colors.textMuted} />
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          )}

          {artists.map(artistBio => (
            <View key={artistBio.id} style={styles.section}>
              <Text style={styles.sectionTitle}>About {artistBio.name}</Text>
              {!!artistBio.description && <Text style={styles.descriptor}>{artistBio.description}</Text>}
              <Text style={styles.body}>{artistBio.bio}</Text>
              <SourceLink source={artistBio.bioSource} url={artistBio.url} />
            </View>
          ))}

          {polling ? (
            <View style={styles.pendingRow}>
              <ActivityIndicator size="small" color={Colors.textMuted} />
              <Text style={[styles.message, styles.pendingText]}>
                {hasContent ? 'Checking for more info…' : 'Fetching more info about this album…'}
              </Text>
            </View>
          ) : (
            <>
              {waitingForEnrichment ? (
                <Text style={styles.message}>
                  Still fetching info for this album — pull down to refresh in a minute.
                </Text>
              ) : !hasContent ? (
                <Text style={styles.message}>
                  {info?.pending
                    ? "Couldn't fetch info for this album right now."
                    : 'Nothing has been written about this album yet.'}
                </Text>
              ) : null}
              <View style={[styles.footer, hasContent && styles.footerAfterContent]}>
                <Text style={styles.footerNote}>{checkStatus(info)}</Text>
                <Pressable
                  style={({ pressed }) => [styles.checkButton, pressed && styles.checkButtonPressed]}
                  onPress={onCheckAgain}
                  accessibilityRole="button"
                >
                  <Feather name="refresh-cw" size={14} color={Colors.text} />
                  <Text style={styles.checkButtonText}>Check again</Text>
                </Pressable>
                {recheckError && (
                  <Text style={styles.footerError}>Couldn't start a check. Please try again.</Text>
                )}
              </View>
            </>
          )}
        </>
      )}
    </ScrollView>
  );
}

const SOURCE_NAMES: Record<string, string> = { wikipedia: 'Wikipedia', lastfm: 'Last.fm' };

function openUrl(url: string) {
  Linking.openURL(url).catch(() => {});
}

/** Attribution line under a block of text; a link when there's somewhere to read more. */
function SourceLink({ source, url }: { source: string | null; url: string | null }) {
  const name = source ? SOURCE_NAMES[source] : null;
  if (!name) return null;
  if (!url) return <Text style={styles.source}>From {name}</Text>;
  return (
    <Pressable onPress={() => openUrl(url)} accessibilityRole="link" hitSlop={8} style={styles.sourceRow}>
      <Text style={[styles.source, styles.sourceLinkText]}>Read more on {name}</Text>
      <Feather name="arrow-up-right" size={13} color={Colors.accent} />
    </Pressable>
  );
}

function formatDay(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

/** One line on when this album was last looked up and whether it will be again. */
function checkStatus(info: AlbumInfo | null): string {
  if (!info?.fetchedAt) return 'Not checked yet.';
  const last = `Last checked ${formatDay(info.fetchedAt)}.`;
  return info.nextRefreshAt
    ? `${last} Next automatic check ${formatDay(info.nextRefreshAt)}.`
    : `${last} No more automatic checks.`;
}

const ART_SIZE = 88;

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  return String(n);
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: 20, paddingBottom: 60 },

  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, gap: 14 },
  art: { width: ART_SIZE, height: ART_SIZE, borderRadius: 10 },
  artPlaceholder: { backgroundColor: Colors.surface },
  headerText: { flex: 1 },
  albumName: { color: Colors.text, fontSize: 20, fontFamily: Fonts.display, marginBottom: 4 },
  artistName: { color: Colors.textMuted, fontSize: 14, fontWeight: '500' },

  spinner: { marginTop: 40 },

  chip: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.fill, borderWidth: 1,
    borderColor: Colors.hairline, borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4, marginBottom: 16
  },
  chipText: { color: Colors.textMuted, fontSize: 11, fontWeight: '500' },

  stats: { color: Colors.textMuted, fontSize: 13, fontWeight: '500', marginBottom: 16 },

  section: { marginBottom: 28 },
  sectionTitle: { color: Colors.text, fontSize: 17, fontFamily: Fonts.display, marginBottom: 8 },
  descriptor: { color: Colors.textMuted, fontSize: 13, fontWeight: '500', marginBottom: 8 },
  body: { color: Colors.text, fontSize: 15, lineHeight: 22 },

  sourceRow: { flexDirection: 'row', alignItems: 'center', gap: 3, alignSelf: 'flex-start', marginTop: 10 },
  source: { color: Colors.textFaint, fontSize: 12, fontWeight: '500', marginTop: 10 },
  sourceLinkText: { color: Colors.accent, marginTop: 0 },

  links: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  linksAfterText: { marginTop: 14 },
  linkChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.fill, borderWidth: 1, borderColor: Colors.hairline,
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7
  },
  linkChipText: { color: Colors.text, fontSize: 13, fontWeight: '500' },

  message: { color: Colors.textMuted, fontSize: 14, lineHeight: 20, marginTop: 8 },
  pendingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  pendingText: { marginTop: 0 },

  footer: { marginTop: 16, alignItems: 'flex-start', gap: 12 },
  footerAfterContent: {
    marginTop: 0, paddingTop: 20,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.border
  },
  footerNote: { color: Colors.textFaint, fontSize: 12, lineHeight: 17 },
  footerError: { color: Colors.accent, fontSize: 12 },
  checkButton: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.fill, borderWidth: 1, borderColor: Colors.hairline,
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 9
  },
  checkButtonPressed: { opacity: 0.6 },
  checkButtonText: { color: Colors.text, fontSize: 13, fontWeight: '600' }
});
