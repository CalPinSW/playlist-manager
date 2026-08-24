import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  AppState,
  AppStateStatus,
  Modal,
  ScrollView,
  TextInput
} from 'react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { fetchRatings, AuthError, RatedAlbum } from '../../lib/api';
import { Colors } from '../../constants/colors';
import { clearTokens } from '../../lib/auth';

type DateFilter = 'all' | 'thisMonth' | 'thisYear' | number;
type SortOption = 'ratingDesc' | 'ratingAsc' | 'dateDesc' | 'dateAsc' | 'nameAsc' | 'artistAsc';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'ratingDesc', label: 'Rating (high to low)' },
  { value: 'ratingAsc', label: 'Rating (low to high)' },
  { value: 'dateDesc', label: 'Recently rated' },
  { value: 'dateAsc', label: 'Oldest rated' },
  { value: 'nameAsc', label: 'Album name (A–Z)' },
  { value: 'artistAsc', label: 'Artist name (A–Z)' }
];

const MIN_RATING_OPTIONS = [0, 6, 7, 8, 9, 10]; // 1-10 scale; 0 = "Any"

/**
 * Ratings tab — all rated albums, filterable by date/rating/genre/artist and
 * sortable. Filtering and sorting both happen client-side since the API
 * returns the user's full rated-albums list in one call.
 */
export default function RatingsScreen() {
  const router = useRouter();
  const [albums, setAlbums] = useState<RatedAlbum[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const appState = useRef(AppState.currentState);

  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [minRating, setMinRating] = useState(0);
  const [selectedGenres, setSelectedGenres] = useState<Set<string>>(new Set());
  const [selectedArtistIds, setSelectedArtistIds] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<SortOption>('ratingDesc');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [artistSearch, setArtistSearch] = useState('');

  const handleAuthError = useCallback(async () => {
    await clearTokens();
    router.replace('/(auth)/login');
  }, [router]);

  const loadRatings = useCallback(async (opts: { showRefreshing?: boolean } = {}) => {
    if (opts.showRefreshing) setRefreshing(true);
    setError(null);
    try {
      const data = await fetchRatings();
      setAlbums(data);
    } catch (err) {
      if (err instanceof AuthError) { await handleAuthError(); return; }
      setError('Could not load ratings. Pull to retry.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [handleAuthError]);

  useEffect(() => {
    loadRatings();

    const subscription = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && next === 'active') {
        loadRatings();
      }
      appState.current = next;
    });

    return () => subscription.remove();
  }, [loadRatings]);

  // ── Derived filter option lists ────────────────────────────────────────────

  const availableYears = useMemo(() => {
    const years = new Set(albums.map(a => new Date(a.ratedAt).getFullYear()));
    return Array.from(years).sort((a, b) => b - a);
  }, [albums]);

  const availableGenres = useMemo(() => {
    const genres = new Set(albums.flatMap(a => a.genres));
    return Array.from(genres).sort((a, b) => a.localeCompare(b));
  }, [albums]);

  const availableArtists = useMemo(() => {
    const byId = new Map<string, string>();
    for (const album of albums) {
      for (const artist of album.artists) byId.set(artist.id, artist.name);
    }
    return Array.from(byId, ([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [albums]);

  const visibleArtistOptions = useMemo(() => {
    const q = artistSearch.trim().toLowerCase();
    if (!q) return availableArtists;
    return availableArtists.filter(a => a.name.toLowerCase().includes(q));
  }, [availableArtists, artistSearch]);

  // ── Filtering + sorting ─────────────────────────────────────────────────────

  const filteredAlbums = useMemo(() => {
    const now = new Date();
    return albums.filter(album => {
      if (minRating > 0 && album.rating < minRating) return false;

      if (dateFilter !== 'all') {
        const ratedDate = new Date(album.ratedAt);
        if (dateFilter === 'thisMonth') {
          if (ratedDate.getFullYear() !== now.getFullYear() || ratedDate.getMonth() !== now.getMonth()) return false;
        } else if (dateFilter === 'thisYear') {
          if (ratedDate.getFullYear() !== now.getFullYear()) return false;
        } else if (ratedDate.getFullYear() !== dateFilter) {
          return false;
        }
      }

      if (selectedGenres.size > 0 && !album.genres.some(g => selectedGenres.has(g))) return false;
      if (selectedArtistIds.size > 0 && !album.artists.some(a => selectedArtistIds.has(a.id))) return false;

      return true;
    });
  }, [albums, dateFilter, minRating, selectedGenres, selectedArtistIds]);

  const displayedAlbums = useMemo(() => {
    const sorted = [...filteredAlbums];
    sorted.sort((a, b) => {
      switch (sortBy) {
        case 'ratingDesc':
          return b.rating - a.rating || new Date(b.ratedAt).getTime() - new Date(a.ratedAt).getTime();
        case 'ratingAsc':
          return a.rating - b.rating || new Date(b.ratedAt).getTime() - new Date(a.ratedAt).getTime();
        case 'dateDesc':
          return new Date(b.ratedAt).getTime() - new Date(a.ratedAt).getTime();
        case 'dateAsc':
          return new Date(a.ratedAt).getTime() - new Date(b.ratedAt).getTime();
        case 'nameAsc':
          return a.albumName.localeCompare(b.albumName);
        case 'artistAsc':
          return (a.artists[0]?.name ?? '').localeCompare(b.artists[0]?.name ?? '');
        default:
          return 0;
      }
    });
    return sorted;
  }, [filteredAlbums, sortBy]);

  const activeFilterCount =
    (minRating > 0 ? 1 : 0) + (selectedGenres.size > 0 ? 1 : 0) + (selectedArtistIds.size > 0 ? 1 : 0);
  const hasAnyActiveFilter = dateFilter !== 'all' || activeFilterCount > 0;

  const clearAllFilters = () => {
    setDateFilter('all');
    setMinRating(0);
    setSelectedGenres(new Set());
    setSelectedArtistIds(new Set());
    setArtistSearch('');
  };

  const toggleGenre = (genre: string) => {
    setSelectedGenres(prev => {
      const next = new Set(prev);
      if (next.has(genre)) next.delete(genre); else next.add(genre);
      return next;
    });
  };

  const toggleArtist = (artistId: string) => {
    setSelectedArtistIds(prev => {
      const next = new Set(prev);
      if (next.has(artistId)) next.delete(artistId); else next.add(artistId);
      return next;
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={displayedAlbums}
        keyExtractor={(item) => item.albumId}
        contentContainerStyle={displayedAlbums.length === 0 ? styles.emptyContainer : styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadRatings({ showRefreshing: true })}
            tintColor={Colors.primary}
          />
        }
        ListHeaderComponent={
          <>
            <Text style={styles.heading}>Ratings</Text>
            {error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
            {albums.length > 0 && (
              <>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.dateChipRow}
                >
                  <DateChip label="All time" active={dateFilter === 'all'} onPress={() => setDateFilter('all')} />
                  <DateChip label="This month" active={dateFilter === 'thisMonth'} onPress={() => setDateFilter('thisMonth')} />
                  <DateChip label="This year" active={dateFilter === 'thisYear'} onPress={() => setDateFilter('thisYear')} />
                  {availableYears
                    .filter(y => y !== new Date().getFullYear())
                    .map(year => (
                      <DateChip
                        key={year}
                        label={String(year)}
                        active={dateFilter === year}
                        onPress={() => setDateFilter(year)}
                      />
                    ))}
                </ScrollView>

                <View style={styles.controlsRow}>
                  <TouchableOpacity style={styles.filtersButton} onPress={() => setFilterModalVisible(true)}>
                    <Ionicons name="options-outline" size={16} color={Colors.text} />
                    <Text style={styles.filtersButtonText}>Filters & sort</Text>
                    {activeFilterCount > 0 && (
                      <View style={styles.filterBadge}>
                        <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
                      </View>
                    )}
                  </TouchableOpacity>

                  <Text style={styles.resultsCount}>
                    {displayedAlbums.length} album{displayedAlbums.length !== 1 ? 's' : ''}
                  </Text>

                  {hasAnyActiveFilter && (
                    <TouchableOpacity onPress={clearAllFilters}>
                      <Text style={styles.clearLink}>Clear</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </>
            )}
          </>
        }
        ListEmptyComponent={
          albums.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="star" size={40} color="#de7c38" style={styles.emptyIcon} />
              <Text style={styles.emptyTitle}>No ratings yet</Text>
              <Text style={styles.emptySubtitle}>
                Open any album and tap the stars to rate it.
              </Text>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="filter-outline" size={40} color={Colors.textMuted} style={styles.emptyIcon} />
              <Text style={styles.emptyTitle}>No albums match</Text>
              <Text style={styles.emptySubtitle}>
                Try adjusting or clearing your filters.
              </Text>
              <TouchableOpacity style={styles.clearFiltersButton} onPress={clearAllFilters}>
                <Text style={styles.clearFiltersButtonText}>Clear filters</Text>
              </TouchableOpacity>
            </View>
          )
        }
        ItemSeparatorComponent={() => <View style={styles.divider} />}
        renderItem={({ item }) => (
          <RatedAlbumRow
            album={item}
            onPress={() => router.push(`/album/${item.albumId}`)}
          />
        )}
      />

      <FilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        sortBy={sortBy}
        onChangeSort={setSortBy}
        minRating={minRating}
        onChangeMinRating={setMinRating}
        genres={availableGenres}
        selectedGenres={selectedGenres}
        onToggleGenre={toggleGenre}
        artists={visibleArtistOptions}
        selectedArtistIds={selectedArtistIds}
        onToggleArtist={toggleArtist}
        artistSearch={artistSearch}
        onChangeArtistSearch={setArtistSearch}
        onClearAll={clearAllFilters}
      />
    </SafeAreaView>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function DateChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[styles.chip, active && styles.chipActive]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

function StarRow({ rating }: { rating: number }) {
  // rating is 1–10; display as 0.5–5.0 in half-star increments
  const display = rating / 2;
  const fullStars = Math.floor(display);
  const hasHalf = display % 1 !== 0;

  return (
    <View style={styles.starsRow}>
      {[1, 2, 3, 4, 5].map(i => {
        const filled = i <= fullStars;
        const half = !filled && hasHalf && i === fullStars + 1;
        const name: React.ComponentProps<typeof Ionicons>['name'] = filled
          ? 'star'
          : half
          ? 'star-half'
          : 'star-outline';
        const color = filled || half ? '#de7c38' : 'rgba(255,255,255,0.2)';
        return <Ionicons key={i} name={name} size={14} color={color} />;
      })}
      <Text style={styles.ratingLabel}>{display.toFixed(1)}</Text>
    </View>
  );
}

function RatedAlbumRow({ album, onPress }: { album: RatedAlbum; onPress: () => void }) {
  const artistNames = album.artists.map(a => a.name).join(', ');

  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.thumbWrap}>
        {album.albumImageUrl ? (
          <Image source={{ uri: album.albumImageUrl }} style={styles.thumb} />
        ) : (
          <View style={[styles.thumb, styles.thumbPlaceholder]} />
        )}
      </View>

      <View style={styles.rowText}>
        <Text style={styles.albumName} numberOfLines={1}>{album.albumName}</Text>
        <Text style={styles.artistName} numberOfLines={1}>{artistNames}</Text>
        <StarRow rating={album.rating} />
      </View>

      <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.2)" />
    </TouchableOpacity>
  );
}

function FilterModal({
  visible,
  onClose,
  sortBy,
  onChangeSort,
  minRating,
  onChangeMinRating,
  genres,
  selectedGenres,
  onToggleGenre,
  artists,
  selectedArtistIds,
  onToggleArtist,
  artistSearch,
  onChangeArtistSearch,
  onClearAll
}: {
  visible: boolean;
  onClose: () => void;
  sortBy: SortOption;
  onChangeSort: (value: SortOption) => void;
  minRating: number;
  onChangeMinRating: (value: number) => void;
  genres: string[];
  selectedGenres: Set<string>;
  onToggleGenre: (genre: string) => void;
  artists: { id: string; name: string }[];
  selectedArtistIds: Set<string>;
  onToggleArtist: (artistId: string) => void;
  artistSearch: string;
  onChangeArtistSearch: (text: string) => void;
  onClearAll: () => void;
}) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Filters & sort</Text>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close" size={24} color={Colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
          <Text style={styles.sectionLabel}>Sort by</Text>
          <View style={styles.optionList}>
            {SORT_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt.value}
                style={styles.optionRow}
                onPress={() => onChangeSort(opt.value)}
                activeOpacity={0.7}
              >
                <Text style={styles.optionLabel}>{opt.label}</Text>
                <Ionicons
                  name={sortBy === opt.value ? 'radio-button-on' : 'radio-button-off'}
                  size={20}
                  color={sortBy === opt.value ? Colors.primary : 'rgba(255,255,255,0.25)'}
                />
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionLabel}>Minimum rating</Text>
          <View style={styles.chipWrap}>
            {MIN_RATING_OPTIONS.map(value => (
              <TouchableOpacity
                key={value}
                style={[styles.chip, minRating === value && styles.chipActive]}
                onPress={() => onChangeMinRating(value)}
                activeOpacity={0.75}
              >
                <Text style={[styles.chipText, minRating === value && styles.chipTextActive]}>
                  {value === 0 ? 'Any' : `${(value / 2).toFixed(1)}+ ★`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {genres.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>Genres</Text>
              <View style={styles.chipWrap}>
                {genres.map(genre => {
                  const active = selectedGenres.has(genre);
                  return (
                    <TouchableOpacity
                      key={genre}
                      style={[styles.chip, active && styles.chipActive]}
                      onPress={() => onToggleGenre(genre)}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>{genre}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}

          {artists.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>Artists</Text>
              <TextInput
                style={styles.artistSearchInput}
                placeholder="Search artists…"
                placeholderTextColor={Colors.textMuted}
                value={artistSearch}
                onChangeText={onChangeArtistSearch}
                autoCorrect={false}
                autoCapitalize="none"
              />
              <View style={styles.chipWrap}>
                {artists.map(artist => {
                  const active = selectedArtistIds.has(artist.id);
                  return (
                    <TouchableOpacity
                      key={artist.id}
                      style={[styles.chip, active && styles.chipActive]}
                      onPress={() => onToggleArtist(artist.id)}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>{artist.name}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}
        </ScrollView>

        <View style={styles.modalFooter}>
          <TouchableOpacity style={styles.footerClearButton} onPress={onClearAll}>
            <Text style={styles.footerClearButtonText}>Clear all</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.footerDoneButton} onPress={onClose}>
            <Text style={styles.footerDoneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surfaceDark },
  centered: { flex: 1, backgroundColor: Colors.surfaceDark, justifyContent: 'center', alignItems: 'center' },
  listContent: { paddingBottom: 40 },

  heading: {
    fontSize: 28, fontWeight: '800', color: Colors.text,
    letterSpacing: -0.5, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12
  },
  errorBox: {
    backgroundColor: '#2d0a0a', borderRadius: 12, padding: 16,
    marginHorizontal: 20, marginBottom: 16, borderWidth: 1, borderColor: '#5c1a1a'
  },
  errorText: { color: '#ff6b6b', textAlign: 'center' },

  dateChipRow: { paddingHorizontal: 20, gap: 8, paddingBottom: 12 },

  controlsRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 20, paddingBottom: 14
  },
  filtersButton: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7
  },
  filtersButtonText: { color: Colors.text, fontSize: 13, fontWeight: '600' },
  filterBadge: {
    backgroundColor: Colors.primary, borderRadius: 8,
    minWidth: 16, height: 16, paddingHorizontal: 4,
    alignItems: 'center', justifyContent: 'center'
  },
  filterBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  resultsCount: { color: Colors.textMuted, fontSize: 12, flex: 1 },
  clearLink: { color: Colors.primary, fontSize: 13, fontWeight: '600' },

  chip: {
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7
  },
  chipActive: { backgroundColor: 'rgba(132,61,255,0.18)', borderColor: Colors.primary },
  chipText: { color: Colors.textMuted, fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: Colors.text },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },

  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 10, gap: 12
  },
  thumbWrap: { width: 52, height: 52, borderRadius: 6, overflow: 'hidden', flexShrink: 0 },
  thumb: { width: 52, height: 52 },
  thumbPlaceholder: { backgroundColor: Colors.surface },
  rowText: { flex: 1, minWidth: 0 },
  albumName: { color: Colors.text, fontSize: 15, fontWeight: '600' },
  artistName: { color: Colors.textMuted, fontSize: 12, marginTop: 1 },
  starsRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 4 },
  ratingLabel: { color: Colors.textMuted, fontSize: 11, marginLeft: 4 },

  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginHorizontal: 20 },

  emptyContainer: { flex: 1 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
  emptyIcon: { opacity: 0.4, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: Colors.text, marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: Colors.textMuted, textAlign: 'center', lineHeight: 22, paddingHorizontal: 32 },
  clearFiltersButton: {
    marginTop: 16, backgroundColor: Colors.primary,
    borderRadius: 10, paddingHorizontal: 18, paddingVertical: 10
  },
  clearFiltersButtonText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  // Modal
  modalContainer: { flex: 1, backgroundColor: Colors.surfaceDark },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)'
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: Colors.text, letterSpacing: -0.3 },
  modalContent: { padding: 20, paddingBottom: 40 },
  sectionLabel: {
    color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '700',
    letterSpacing: 0.8, marginBottom: 10, marginTop: 4
  },
  optionList: { marginBottom: 24 },
  optionRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)'
  },
  optionLabel: { color: Colors.text, fontSize: 15 },
  artistSearchInput: {
    backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9,
    color: Colors.text, fontSize: 14, marginBottom: 12
  },
  modalFooter: {
    flexDirection: 'row', gap: 12,
    paddingHorizontal: 20, paddingVertical: 14,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)'
  },
  footerClearButton: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', paddingVertical: 12
  },
  footerClearButtonText: { color: Colors.text, fontSize: 15, fontWeight: '600' },
  footerDoneButton: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    borderRadius: 10, backgroundColor: Colors.primary, paddingVertical: 12
  },
  footerDoneButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' }
});
