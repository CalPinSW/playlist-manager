import { Dimensions, StyleSheet, Image } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useState } from 'react';
import { getRecentPlaylists, searchPlaylistsByAlbums } from '../../api';
import { Playlist } from '../../interfaces/Playlist';
import { useQuery } from '@tanstack/react-query';
import { DebouncedTextInput } from '../../components/DebouncedTextInput';
import PlaylistSlide from '../../components/Carousel/PlaylistSlide';
import Carousel from '../../components/Carousel/Carousel';

interface PaginationState {
  pageIndex: number;
  pageSize: number;
}

const { width, height: screenHeight } = Dimensions.get('window')

export default function TabOneScreen() {
  const slidesPerPage = 4;
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

  return (
    <View style={styles.container}>
      <View style={styles.separator} />
      <View style={{margin: 12, gap: 12, width: "100%", display: "flex", flexDirection: "row", justifyContent: "center"}}>
        <Text style={{ alignSelf: "flex-start", fontSize: 20}} noBackground>Playlist Search</Text>
        <DebouncedTextInput style={{alignSelf: "flex-start", flexGrow: 1, }} value={playlistSearch} onChange={setPlaylistSearch}/>
      </View>
      <View style={{ flex: 1 }}>
        <Carousel slidesPerPage={slidesPerPage} data={playlistQuery.data} renderItem={(playlist) => <PlaylistSlide playlist={playlist}/>}/>
      </View>
      <View style={{margin: 12, gap: 12, width: "100%", display: "flex", flexDirection: "row", justifyContent: "center"}}>
        <Text style={{ alignSelf: "flex-start", fontSize: 20}} noBackground>Album / Artist Search</Text>
        <DebouncedTextInput style={{alignSelf: "flex-start", flexGrow: 1, }} value={albumSearch} onChange={setAlbumSearch}/>
      </View>
      <View style={{ flex: 1 }}>
        <Carousel slidesPerPage={slidesPerPage} data={albumQuery.data} renderItem={(playlist) => <PlaylistSlide playlist={playlist}/>}/>
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
