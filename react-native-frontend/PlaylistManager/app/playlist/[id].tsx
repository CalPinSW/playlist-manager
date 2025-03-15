import { StyleSheet } from 'react-native';
import { View, Text } from '@/components/Themed';
import { useState } from 'react';
import { getPlaylistAlbums, getPlaylistTracks } from '../../api';
import { Playlist } from '../../interfaces/Playlist';
import { useQuery } from '@tanstack/react-query';
import { Track } from '../../interfaces/Track';
import { Album } from '../../interfaces/Album';
import { useLocalSearchParams } from 'expo-router';
import Carousel from '../../components/Carousel/Carousel';
import AlbumSlide from '../../components/Carousel/AlbumSlide';

export default function PlaylistExplorer() {
    const { id } = useLocalSearchParams<{id: string}>();

    const { data: playlistAlbums } = useQuery<Album[]>({
        queryKey: ["playlist albums info", id],
        queryFn: () => {
            return getPlaylistAlbums(id);
        },
        retry: false,
    });

        
    const { data: playlistTracks } = useQuery<Track[]>({
    queryKey: ["playlist track info", id],
    queryFn: () => {
        return getPlaylistTracks(id);
    },
    retry: false,
    });

    const [associatedPlaylists, setAssociatedPlaylists] = useState<Playlist[]>(
        []
    );

    return (
        <View style={styles.container}>
        <View style={styles.separator} />
        <View style={{ flex: 1 }}>
            <Carousel slidesPerPage={5} data={playlistAlbums} renderItem={(album) => <AlbumSlide album={album}/>}/>
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
