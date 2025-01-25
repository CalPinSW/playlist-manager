import { Image, StyleSheet, Platform, View, Dimensions, Text } from 'react-native';

import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import React, { useState } from 'react';
import { getRecentPlaylists, searchPlaylistsByAlbums } from '../../api';
import { Playlist } from '../../interfaces/Playlist';
import {useQuery} from '@tanstack/react-query';
import CustomCarousel from '../../components/Carousel/Carousel';
import SearchBar from '../../components/SearchBar';
import PlaylistSlide from '../../components/Playlist/PlaylistSlide';
import Carousel from 'react-native-reanimated-carousel';

interface PaginationState {
  pageIndex: number;
  pageSize: number;
}


export default function HomeScreen() {
  const [playlistSearch, setPlaylistSearch] = useState<string>("")
  const [albumSearch, setAlbumSearch] = useState<string>("")
  const [pagination, ] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 8,
  });

  const playlistQuery = useQuery<Playlist[]>({
    queryKey: ["playlists", pagination, playlistSearch],
    queryFn: () => {
      return getRecentPlaylists(playlistSearch, pagination.pageIndex, pagination.pageSize);
    },
  });

  const albumQuery = useQuery<Playlist[]>({
    queryKey: ["albums", pagination, albumSearch],
    queryFn: () => {
      return searchPlaylistsByAlbums(albumSearch, pagination.pageIndex, pagination.pageSize);
    },
  });
  const { width } = Dimensions.get("window");
  console.log(width)
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={styles.reactLogo}
        />
      }>
        <View style={styles.box}>
        <Carousel
          loop // Enable infinite scrolling
          width={width} // Set the width of each slide
          height={width * 0.6} // Adjust the height to fit the content
          data={[0, 1, 2, 3, 4, 5, 6]}
          defaultIndex={0} // Start at a specific index
          scrollAnimationDuration={1000} // Smooth scrolling
          renderItem={({ index }) => (
            <View
              style={{
                  flex: 1,
                  borderWidth: 1,
                  justifyContent: 'center',
              }}
            >
              <Text style={{ textAlign: 'center', fontSize: 30 }}>
                  {index}
              </Text>
          </View>)
      }
    />
        </View>
      <View style={styles.box}>
        <SearchBar search={playlistSearch} setSearch={setPlaylistSearch} />
        <CustomCarousel
          slides={(playlistQuery.data ?? createUndefinedArray(pagination.pageSize)).map(
            (playlist, index) => <PlaylistSlide key={index} {...playlist} />
          )}
        />
      </View>
      <View style={styles.box}>
        <SearchBar search={albumSearch} setSearch={setAlbumSearch} />
        <CustomCarousel
          slides={(albumQuery.data ?? createUndefinedArray(pagination.pageSize)).map(
            (playlist, index) => <PlaylistSlide key={index} {...playlist} />
          )}
        />
      </View>
    </ParallaxScrollView>
  );
}

const createUndefinedArray = (length: number): undefined[] => {
  return Array.from({ length }, () => undefined);
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    paddingHorizontal: 8,
    gap: 8, // Add padding between items
  },
  box: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 8,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    flex: 1,
    overflow: "visible"
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
});
