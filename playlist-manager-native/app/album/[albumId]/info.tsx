import { View, Text, ScrollView, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { useCallback, useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { fetchAlbumInfo, AlbumInfo, AuthError } from '../../../lib/api';
import { Colors } from '../../../constants/colors';
import { clearTokens } from '../../../lib/auth';

export default function AlbumInfoScreen() {
  const { albumId, name, artist, imageUrl } = useLocalSearchParams<{
    albumId: string;
    name?: string;
    artist?: string;
    imageUrl?: string;
  }>();
  const router = useRouter();

  const [info, setInfo] = useState<AlbumInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const handleAuthError = useCallback(async () => {
    await clearTokens();
    router.replace('/(auth)/login');
  }, [router]);

  const load = useCallback(async () => {
    try {
      const data = await fetchAlbumInfo(albumId);
      setInfo(data);
    } catch (err) {
      if (err instanceof AuthError) { await handleAuthError(); return; }
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [albumId, handleAuthError]);

  useEffect(() => { load(); }, [load]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
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
        <Text style={styles.message}>Couldn't load album info. Please try again later.</Text>
      ) : (
        <>
          {info?.type && (
            <View style={styles.chip}>
              <Text style={styles.chipText}>{info.type}</Text>
            </View>
          )}

          {info?.summary ? (
            <Text style={styles.summary}>{info.summary}</Text>
          ) : (
            <Text style={styles.message}>
              {info?.pending
                ? "We're fetching more info about this album — check back in a bit."
                : 'No extra info found for this album.'}
            </Text>
          )}
        </>
      )}
    </ScrollView>
  );
}

const ART_SIZE = 88;

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

  summary: { color: Colors.text, fontSize: 15, lineHeight: 22 },
  message: { color: Colors.textMuted, fontSize: 14, lineHeight: 20, marginTop: 8 }
});
