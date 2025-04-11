import { Dimensions, StyleSheet, Image } from 'react-native';
import { Text, View } from '@/components/Themed';
import Carousel from 'react-native-reanimated-carousel';
import { useState } from 'react';
import { getRecentPlaylists, searchPlaylistsByAlbums } from '../../api';
import { Playlist } from '../../interfaces/Playlist';
import { useSharedValue } from 'react-native-reanimated';
import { useQuery } from '@tanstack/react-query';
import { DebouncedTextInput } from '../../components/DebouncedTextInput';

interface PaginationState {
  pageIndex: number;
  pageSize: number;
}

const { width, height: screenHeight } = Dimensions.get('window')

export default function TabOneScreen() {
  const COUNT = 4;
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

  console.log(playlistSearch)

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tab One</Text>
      <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
      <DebouncedTextInput value={playlistSearch} onChange={setPlaylistSearch}/>
      <View style={{ flex: 1 }}>
        <Carousel
            loop={false}
            overscrollEnabled={false}
            width={width / COUNT}
            style={{width: width}}
            height={width / 2}
            data={playlistQuery.data ?? []}
            scrollAnimationDuration={500}
            renderItem={({ item }) => (
                <View
                    style={{
                        flex: 1,
                        borderWidth: 1,
                        justifyContent: 'center',
                    }}
                    nativeID={`playlist ${item.id}`}
                >
                    <Image style={{ width: "100%", height: "100%", objectFit: "contain"}} source={{uri: item.image_url}} />
                    <Text style={{height: 100, wordWrap: "wrap"}}>{item.name}</Text>
                </View>
            )}
        />
      </View>
      <DebouncedTextInput value={albumSearch} onChange={setAlbumSearch}/>
      <View style={{ flex: 1 }}>
        <Carousel
            loop={false}
            overscrollEnabled={false}
            width={width / COUNT}
            style={{width: width}}
            height={width / 2}
            data={albumQuery.data ?? []}
            scrollAnimationDuration={500}
            renderItem={({ item }) => (
                <View
                    style={{
                        flex: 1,
                        borderWidth: 1,
                        justifyContent: 'center',
                    }}
                    nativeID={`playlist ${item.id}`}
                >
                    <Image style={{ width: "100%", height: "100%", objectFit: "contain"}} source={{uri: item.image_url}} />
                    <Text style={{height: 100, wordWrap: "wrap"}}>{item.name}</Text>
                </View>
            )}
        />
      </View>
    </View>
  );
}



const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
  },
  scrollViewContainerStyle: {
    alignContent: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    height: 600
  }
});
