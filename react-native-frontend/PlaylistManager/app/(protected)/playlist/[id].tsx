import { StyleSheet } from 'react-native';
import { View } from '@/components/Themed';
import { useState } from 'react';
import { getPlaylistAlbums, getPlaylistTracks } from '../../../api';
import { Playlist } from '../../../interfaces/Playlist';
import { useQuery } from '@tanstack/react-query';
import { Track } from '../../../interfaces/Track';
import { Album } from '../../../interfaces/Album';
import { useLocalSearchParams } from 'expo-router';
import Carousel from '../../../components/Carousel/Carousel';
import AlbumSlide from '../../../components/Carousel/AlbumSlide';
import { useAuthorizedRequest } from '../../../hooks/useAuthorizedRequest';

const PlaylistExplorer: React.FC = () => {
    const { id } = useLocalSearchParams<{id: string}>();
    const authorizedRequest = useAuthorizedRequest()

    const { data: playlistAlbums } = useQuery<Album[]>({
        queryKey: ["playlist albums info", id],
        queryFn: () => authorizedRequest(getPlaylistAlbums(id)),
        retry: false,
    });

    const { data: playlistTracks } = useQuery<Track[]>({
    queryKey: ["playlist track info", id],
    queryFn: () => authorizedRequest(getPlaylistTracks(id)),
    retry: false,
    });

    const [associatedPlaylists, setAssociatedPlaylists] = useState<Playlist[]>(
        []
    );

    const [activeAlbumId, setActiveAlbumId] = useState<string | null>(null);
    
    const onAlbumSelect = (albumId: string) => {
        if (activeAlbumId === albumId) {
            setActiveAlbumId(null)
        } else {
            setActiveAlbumId(albumId)
        }
    }

    return (
        <View style={styles.container}>
        <View style={styles.separator} />
        <View style={{ flex: 1, alignSelf: "flex-start" }}>
            <Carousel slidesPerPage={2.25} data={playlistAlbums} renderItem={
                (album) => 
                <AlbumSlide album={album} isSelected={activeAlbumId == album.id} onPress={() => onAlbumSelect(album.id)} />}/>
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

export default PlaylistExplorer;
