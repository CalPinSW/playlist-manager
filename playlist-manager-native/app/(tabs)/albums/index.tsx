import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  RefreshControl
} from 'react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { AppState, AppStateStatus } from 'react-native';
import { fetchPlaylists, searchAlbums, syncHistory, AuthError, PlaylistSummary, PlaylistAlbum } from '../../../lib/api';
import { getCachedPlaylists, cachePlaylists } from '../../../lib/db';
import { Colors } from '../../../constants/colors';
import { clearTokens } from '../../../lib/auth';

const DEBOUNCE_MS = 350;

export default function AlbumsIndexScreen() {
  const router = useRouter();

  const [playlists, setPlaylists] = useState<PlaylistSummary[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchActive, setSearchActive] = useState(false);
  const [searchAlbumResults, setSearchAlbumResults] = useState<PlaylistAlbum[]>([]);
  const [searchPlaylistResults, setSearchPlaylistResults] = useState<PlaylistSummary[]>([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<TextInput>(null);
  const appState = useRef(AppState.currentState);

  const handleAuthError = useCallback(async () => {
    await clearTokens();
    router.replace('/(auth)/login');
  }, [router]);

  const loadPlaylists = useCallback(async (opts: { showRefreshing?: boolean } = {}) => {
    if (opts.showRefreshing) setRefreshing(true);

    // Render cached playlists immediately on first load.
    if (!opts.showRefreshing) {
      const cached = await getCachedPlaylists().catch(() => []);
      if (cached.length > 0) {
        setPlaylists(cached);
        setLoading(false);
      }
    }

    try {
      await syncHistory().catch(() => null);
      const data = await fetchPlaylists('', 50);
      setPlaylists(data);
      await cachePlaylists(data).catch(() => null);
    } catch (err) {
      if (err instanceof AuthError) { await handleAuthError(); return; }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [handleAuthError]);

  useEffect(() => {
    loadPlaylists();

    // Re-sync when app comes back to foreground (mirrors Now tab behaviour).
    const subscription = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && next === 'active') {
        loadPlaylists();
      }
      appState.current = next;
    });

    return () => subscription.remove();
  }, [loadPlaylists]);

  const runSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setSearchAlbumResults([]);
      setSearchPlaylistResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    try {
      const [albums, lists] = await Promise.all([
        searchAlbums(q, 20),
        fetchPlaylists(q, 10)
      ]);
      setSearchAlbumResults(albums);
      setSearchPlaylistResults(lists);
    } catch (err) {
      if (err instanceof AuthError) { await handleAuthError(); return; }
    } finally {
      setSearching(false);
    }
  }, [handleAuthError]);

  const onChangeText = useCallback((text: string) => {
    setSearchQuery(text);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => runSearch(text), DEBOUNCE_MS);
  }, [runSearch]);

  const onFocus = () => setSearchActive(true);

  const onCancel = () => {
    inputRef.current?.blur();
    setSearchActive(false);
    setSearchQuery('');
    setSearchAlbumResults([]);
    setSearchPlaylistResults([]);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
  };

  const noResults =
    searchQuery.trim().length > 0 &&
    !searching &&
    searchAlbumResults.length === 0 &&
    searchPlaylistResults.length === 0;

  const isNewAlbums = (name: string) => /^New Albums/i.test(name);

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {!searchActive && <Text style={styles.heading}>Albums</Text>}
        <View style={styles.searchRow}>
          <View style={[styles.searchBar, searchActive && styles.searchBarFocused]}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              ref={inputRef}
              style={styles.searchInput}
              placeholder="Search playlists & albums…"
              placeholderTextColor={Colors.textMuted}
              value={searchQuery}
              onChangeText={onChangeText}
              onFocus={onFocus}
              returnKeyType="search"
              autoCorrect={false}
              autoCapitalize="none"
            />
            {searching && <ActivityIndicator size="small" color={Colors.primary} style={{ marginLeft: 4 }} />}
          </View>
          {searchActive && (
            <TouchableOpacity onPress={onCancel} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.cancelBtn}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Content */}
      {searchActive ? (
        <SearchResults
          query={searchQuery}
          albums={searchAlbumResults}
          playlists={searchPlaylistResults}
          noResults={noResults}
          onAlbumPress={(albumId) => router.push(`/album/${albumId}`)}
          onPlaylistPress={(playlistId) => router.push(`/(tabs)/albums/${playlistId}`)}
        />
      ) : (
        <FlatList
          data={playlists}
          keyExtractor={(item) => item.id}
          contentContainerStyle={playlists.length === 0 ? styles.emptyContainer : undefined}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadPlaylists({ showRefreshing: true })}
              tintColor={Colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No playlists yet</Text>
              <Text style={styles.emptySubtitle}>
                Your synced playlists will appear here.
              </Text>
            </View>
          }
          ItemSeparatorComponent={() => <View style={styles.divider} />}
          renderItem={({ item }) => (
            <PlaylistRow
              playlist={item}
              isNew={isNewAlbums(item.name)}
              onPress={() => router.push(`/(tabs)/albums/${item.id}`)}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function PlaylistRow({
  playlist,
  isNew,
  onPress
}: {
  playlist: PlaylistSummary;
  isNew: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.playlistRow} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.playlistThumb, isNew ? styles.thumbNew : styles.thumbBest]}>
        <Text style={styles.thumbIcon}>{isNew ? '♫' : '★'}</Text>
      </View>
      <View style={styles.playlistText}>
        <Text style={styles.playlistName} numberOfLines={1}>{playlist.name}</Text>
        <Text style={styles.playlistMeta} numberOfLines={1}>{playlist.description || ' '}</Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );
}

function SearchResults({
  query,
  albums,
  playlists,
  noResults,
  onAlbumPress,
  onPlaylistPress
}: {
  query: string;
  albums: PlaylistAlbum[];
  playlists: PlaylistSummary[];
  noResults: boolean;
  onAlbumPress: (albumId: string) => void;
  onPlaylistPress: (playlistId: string) => void;
}) {
  if (noResults) {
    return (
      <View style={styles.noResults}>
        <Text style={styles.noResultsIcon}>🔍</Text>
        <Text style={styles.noResultsTitle}>No results for "{query}"</Text>
        <Text style={styles.noResultsSub}>Try searching by album name, artist, or playlist date</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={[]}
      keyExtractor={() => ''}
      renderItem={null}
      ListHeaderComponent={
        <>
          {playlists.length > 0 && (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>PLAYLISTS</Text>
                <Text style={styles.sectionCount}>{playlists.length} result{playlists.length !== 1 ? 's' : ''}</Text>
              </View>
              {playlists.map((p, i) => (
                <View key={p.id}>
                  <PlaylistRow
                    playlist={p}
                    isNew={/^New Albums/i.test(p.name)}
                    onPress={() => onPlaylistPress(p.id)}
                  />
                  {i < playlists.length - 1 && <View style={styles.divider} />}
                </View>
              ))}
              <View style={styles.sectionGap} />
            </>
          )}
          {albums.length > 0 && (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>ALBUMS</Text>
                <Text style={styles.sectionCount}>{albums.length} result{albums.length !== 1 ? 's' : ''}</Text>
              </View>
              {albums.map((a, i) => (
                <View key={a.id}>
                  <AlbumRow album={a} onPress={() => onAlbumPress(a.id)} />
                  {i < albums.length - 1 && <View style={styles.divider} />}
                </View>
              ))}
            </>
          )}
        </>
      }
      contentContainerStyle={{ paddingBottom: 100 }}
    />
  );
}

function AlbumRow({ album, onPress }: { album: PlaylistAlbum; onPress: () => void }) {
  const pct = album.progress?.progressPercent ?? 0;
  const artistNames = album.artists.map(a => a.name).join(', ');

  return (
    <TouchableOpacity style={styles.albumRow} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.albumThumbWrap}>
        {album.imageUrl ? (
          <Image source={{ uri: album.imageUrl }} style={styles.albumThumb} />
        ) : (
          <View style={[styles.albumThumb, styles.albumThumbPlaceholder]} />
        )}
        {/* Progress pip */}
        <View style={styles.progressPipTrack}>
          <View style={[styles.progressPipFill, { width: `${pct}%` as `${number}%` }]} />
        </View>
      </View>
      <View style={styles.albumText}>
        <Text style={styles.albumName} numberOfLines={1}>{album.name}</Text>
        <Text style={styles.albumArtist} numberOfLines={1}>{artistNames}</Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surfaceDark },
  centered: { flex: 1, backgroundColor: Colors.surfaceDark, justifyContent: 'center', alignItems: 'center' },

  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  heading: { fontSize: 28, fontWeight: '800', color: Colors.text, marginBottom: 14, letterSpacing: -0.5 },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 13,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10
  },
  searchBarFocused: {
    borderColor: 'rgba(132,61,255,0.5)',
    backgroundColor: 'rgba(132,61,255,0.06)'
  },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, color: Colors.text, fontSize: 16 },
  cancelBtn: { color: Colors.primary, fontSize: 15, fontWeight: '600' },

  // Playlist row
  playlistRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 10, gap: 12 },
  playlistThumb: {
    width: 46, height: 46, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0
  },
  thumbNew: { backgroundColor: '#4a0fc4' },
  thumbBest: { backgroundColor: '#a04e12' },
  thumbIcon: { fontSize: 20 },
  playlistText: { flex: 1, minWidth: 0 },
  playlistName: { color: Colors.text, fontSize: 15, fontWeight: '600' },
  playlistMeta: { color: Colors.textMuted, fontSize: 12, marginTop: 2 },
  chevron: { color: 'rgba(255,255,255,0.2)', fontSize: 20 },

  // Album row (search results)
  albumRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 10, gap: 12 },
  albumThumbWrap: { width: 46, height: 46, borderRadius: 6, overflow: 'hidden', flexShrink: 0, position: 'relative' },
  albumThumb: { width: 46, height: 46 },
  albumThumbPlaceholder: { backgroundColor: Colors.surface },
  progressPipTrack: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: 3, backgroundColor: 'rgba(255,255,255,0.12)'
  },
  progressPipFill: { height: 3, backgroundColor: '#78a63c' },
  albumText: { flex: 1, minWidth: 0 },
  albumName: { color: Colors.text, fontSize: 15, fontWeight: '600' },
  albumArtist: { color: Colors.textMuted, fontSize: 12, marginTop: 2 },

  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginHorizontal: 20 },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline',
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8
  },
  sectionTitle: { color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '700', letterSpacing: 0.8 },
  sectionCount: { color: 'rgba(255,255,255,0.25)', fontSize: 11 },
  sectionGap: { height: 28 },

  // Empty / no results
  emptyContainer: { flex: 1 },
  emptyState: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: Colors.text, marginBottom: 12 },
  emptySubtitle: { fontSize: 14, color: Colors.textMuted, textAlign: 'center', lineHeight: 22 },

  noResults: { flex: 1, alignItems: 'center', paddingTop: 64, paddingHorizontal: 32 },
  noResultsIcon: { fontSize: 36, marginBottom: 12, opacity: 0.4 },
  noResultsTitle: { color: Colors.text, fontSize: 17, fontWeight: '600', marginBottom: 6 },
  noResultsSub: { color: Colors.textMuted, fontSize: 14, textAlign: 'center', lineHeight: 22 }
});
