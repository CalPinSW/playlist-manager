import { StyleSheet } from 'react-native';
import { View } from '@/components/Themed';
import { useEffect, useRef, useState } from 'react';
import { getPlaylistAlbums, getPlaylistTracks, playlistSearch } from '../../../api';
import { Playlist } from '../../../interfaces/Playlist';
import { useQuery } from '@tanstack/react-query';
import { Track } from '../../../interfaces/Track';
import { Album } from '../../../interfaces/Album';
import { useLocalSearchParams } from 'expo-router';
import Carousel from '../../../components/Carousel/Carousel';
import AlbumSlide from '../../../components/Carousel/AlbumSlide/AlbumSlide';
import { useAuth } from '../../../contexts/authContext';
import { ICarouselInstance } from 'react-native-reanimated-carousel';
import PlaylistButtons from '../../../components/PlaylistExplorer/PlaylistButtons';

const PlaylistExplorer: React.FC = () => {
    const playlist = useLocalSearchParams<{id: string, name: string, uri: string}>();
    const { authorizedRequest } = useAuth()
    const carouselRef = useRef<ICarouselInstance>(null);
    const { data: playlistAlbums } = useQuery<Album[]>({
        queryKey: ["playlist albums info", playlist.id],
        queryFn: () => authorizedRequest(getPlaylistAlbums(playlist.id)),
        retry: false,
    });

    const { data: playlistTracks } = useQuery<Track[]>({
    queryKey: ["playlist track info", playlist.id],
    queryFn: () => authorizedRequest(getPlaylistTracks(playlist.id)),
    retry: false,
    });

    const [associatedPlaylists, setAssociatedPlaylists] = useState<Playlist[]>(
        []
    );

    useEffect(() => {
      if (playlist.name.startsWith("New Albums")) {
        authorizedRequest(playlistSearch(playlist.name.slice(11))).then((associated) => {
          setAssociatedPlaylists(
            associated.filter((p) => p.name !== playlist.name)
          );
        });
      }
    }, [playlist.name]);

    const [activeAlbumId, setActiveAlbumId] = useState<string | null>(null);
    
    const onAlbumSelect = (albumId: string) => {
        if (activeAlbumId === albumId) {
            setActiveAlbumId(null)
        } else {
            setActiveAlbumId(albumId)
            if (carouselRef.current) {
              carouselRef.current.scrollTo({index: playlistAlbums?.findIndex((album) => album.id === albumId), animated: true})
            }
        }
    }

    const activeAlbum = playlistAlbums?.find((album) => album.id === activeAlbumId);

    return (
      <View style={styles.container}>
        <View style={styles.separator} />
        <View style={{ flex: 1, alignSelf: "flex-start" }}>
            <Carousel slidesPerPage={2.25} data={playlistAlbums} forwardRef={carouselRef} renderItem={
                (album) => 
                <AlbumSlide album={album} isSelected={activeAlbumId == album.id} onPress={() => onAlbumSelect(album.id)} />}/>
            {activeAlbum && <PlaylistButtons playlistId={playlist.id} playlistUri={playlist.uri} album={activeAlbum} associatedPlaylists={associatedPlaylists} />}
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
