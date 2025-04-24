import { FC } from "react";
import { View } from "../Themed";
import { StyleSheet} from "react-native";
import Share from 'react-native-share'
import AsyncButton from "../AsyncButton";
import { useAuth } from "../../contexts/authContext";
import { populatePlaylist } from "../../api";
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import { Album } from "../../interfaces/Album";

interface PlaylistManagementButtonsProps {
    playlistId: string;
    refetchAlbums: () => Promise<void>;
    copyAlbumArtists: () => Promise<void>;
    albums: Album[];
}

const PlaylistManagementButtons: FC<PlaylistManagementButtonsProps> = ({playlistId, refetchAlbums, copyAlbumArtists,albums}) => {
    const { authorizedRequest } = useAuth()
    const handleSyncClick = async () => {
        await authorizedRequest(populatePlaylist(playlistId))
        await refetchAlbums()
    }

    return (
        <View style={styles.container}>
            <View style={styles.buttonRow}>
                <AsyncButton text={"Copy Album Artists"} onPressAsync={copyAlbumArtists}/>
                <AsyncButton text={"Sync with Spotify"} onPressAsync={handleSyncClick}/>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        display: "flex",
        gap: 8,
        flexDirection: "column",
    },
    buttonRow: {
        display: "flex",
        gap: 8,
        flexDirection: "row",
    }
})

const downloadAlbumImage = async (album: Album, index: number ): Promise<string | null> => {
    try {
      const fileUri = FileSystem.cacheDirectory + String(index) + "-" + album.name + '.jpg';
      const { uri } = await FileSystem.downloadAsync(album.image_url, fileUri);
      return uri;
    } catch (error) {
      console.error('Error downloading image:', error);
      return null;
    }
  };

const saveImageToGallery = async (album: Album, index: number) => {
    const uri = await downloadAlbumImage(album, index)
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      alert('Permission to access media library is required!');
      return null;
    }
    if (uri) {
        const asset = await MediaLibrary.createAssetAsync(uri);
        return asset;
    }
    else {
        console.error("Image failed to download.")
    }
  };

const openInstagram = async (albums: Album[]) => {
    const assets = await Promise.all(albums.map(saveImageToGallery));
    if (assets){
        await Share.open(
            {
                url: assets.filter(asset => asset?.uri).map(asset => asset?.uri)[0],
                type: 'image/jpeg',
                social: Share.Social.INSTAGRAM,
            } as any
        )
        .then((res) => {
            console.log(res);
        })
        .catch((err) => {
            err && console.log(err);
        })
    }
}

export default PlaylistManagementButtons