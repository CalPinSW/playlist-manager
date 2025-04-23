import { Dimensions, StyleSheet } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useState } from 'react';
import { getRecentPlaylists, searchPlaylistsByAlbums } from '../../api';
import { Playlist } from '../../interfaces/Playlist';
import { useQuery } from '@tanstack/react-query';
import { DebouncedTextInput } from '../../components/DebouncedTextInput';
import PlaylistSlide from '../../components/Carousel/PlaylistSlide';
import Carousel from '../../components/Carousel/Carousel';
import MiniPlayer from '../../components/MiniPlayer/Miniplayer';
import { useAuth } from '../../contexts/authContext';

interface PaginationState {
  pageIndex: number;
  pageSize: number;
}

const { width } = Dimensions.get('window')

export default function TabOneScreen() {
  const slidesPerPage = 4;
  const { authorizedRequest } = useAuth()
  const [playlistSearch, setPlaylistSearch] = useState<string>("")
  const [albumSearch, setAlbumSearch] = useState<string>("")
  const [pagination, ] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 8,
  });

  const playlistQuery = useQuery<Playlist[]>({
    queryKey: ["playlists", {page: pagination, search: playlistSearch}],
    queryFn: () => authorizedRequest(getRecentPlaylists(playlistSearch, pagination.pageIndex, pagination.pageSize)),
  });

  const albumQuery = useQuery<Playlist[]>({
    queryKey: ["albums", {page: pagination, search: albumSearch}],
    queryFn: () => authorizedRequest(searchPlaylistsByAlbums(albumSearch, pagination.pageIndex, pagination.pageSize)),
  });

  return (
    <View style={styles.container}>
      <View style={styles.separator} />
      <View style={styles.searchBar}>
        <Text style={styles.searchDescriptor} noBackground>Playlist Search</Text>
        <DebouncedTextInput style={styles.searchBox} value={playlistSearch} onChange={setPlaylistSearch}/>
      </View>
      <View style={styles.carouselContainer}>
        <Carousel slidesPerPage={slidesPerPage} data={playlistQuery.data} renderItem={(playlist) => <PlaylistSlide playlist={playlist}/>}/>
      </View>
      <View style={styles.searchBar}>
        <Text style={styles.searchDescriptor} noBackground>Album / Artist Search</Text>
        <DebouncedTextInput style={styles.searchBox} value={albumSearch} onChange={setAlbumSearch}/>
      </View>
      <View style={styles.carouselContainer}>
        <Carousel slidesPerPage={slidesPerPage} data={albumQuery.data} renderItem={(playlist) => <PlaylistSlide playlist={playlist}/>}/>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    display: "flex"
  },
  separator: {
    marginVertical: 10,
    height: 1,
    width: '80%',
  },
  searchBar: {
    display: "flex",
    flexDirection: "row", 
    margin: 12, 
    gap: 12, 
    width: width, 
    justifyContent: "center",
  },
  searchDescriptor: { alignSelf: "flex-start", fontSize: 20},
  searchBox: {alignSelf: "flex-start", flexGrow: 1},
  carouselContainer: {height: "auto"}
});
