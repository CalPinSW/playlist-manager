import { FC } from "react";
import { View, Text } from "../Themed";
import { StyleSheet} from "react-native";
import Share from 'react-native-share'
import { useAuth } from "../../contexts/authContext";
import { populatePlaylist } from "../../api";
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import { Album } from "../../interfaces/Album";
import { usePlaybackContext } from "../../hooks/usePlaybackContext";
import SmallAsyncButton from "../SmallAsyncButton";
import { Ionicons } from "@expo/vector-icons";
import { useColorTheme } from "../../hooks/useColorTheme";

interface PlaylistManagementButtonsProps {
    playlistId: string;
    refetchAlbums: () => Promise<void>;
    copyAlbumArtists: () => Promise<void>;
    albums: Album[];
}

const PlaylistManagementButtons: FC<PlaylistManagementButtonsProps> = ({playlistId, refetchAlbums, copyAlbumArtists,albums}) => {
    const { authorizedRequest } = useAuth()
    const theme = useColorTheme();
    const { resumeItem } = usePlaybackContext();
        
    const handleSyncClick = async () => {
        await authorizedRequest(populatePlaylist(playlistId))
        await refetchAlbums()
    }

    const handleResumePlaylist = async () => {
        await resumeItem({id: playlistId})
    };

    return (
        <View style={[styles.container, {borderColor: theme.background.offset}]}>
            <SmallAsyncButton onPressAsync={copyAlbumArtists}>
                <View style={styles.buttonContent} >
                    <Ionicons size={28} name="copy-outline" color={theme.text.primary} />
                    <Text noBackground style={styles.buttonText}>Copy Album Artists</Text>
                </View>
            </SmallAsyncButton>
            <SmallAsyncButton onPressAsync={handleSyncClick}>
                <View style={styles.buttonContent} >
                    <Ionicons size={28} name="sync" color={theme.text.primary} />
                    <Text noBackground style={styles.buttonText} >Sync with Spotify</Text>
                </View>
            </SmallAsyncButton>
            <SmallAsyncButton onPressAsync={handleResumePlaylist}>
                <View style={styles.buttonContent} >
                    <Ionicons size={28} name="play" color={theme.text.primary} />
                    <Text noBackground style={styles.buttonText} >Resume Playlist</Text>
                </View>
            </SmallAsyncButton>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        display: "flex",
        flexWrap: "wrap",
        gap: 8,
        flexDirection: "row",
        borderWidth: 2,
        borderRadius: 8,
    },
    buttonContent: {display: "flex", flexDirection: "column", gap: 8, alignItems: "center"},
    buttonText: {fontSize: 12}
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