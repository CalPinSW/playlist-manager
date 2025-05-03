import { FC } from "react";
import { Playlist } from "../../interfaces/Playlist";
import { View } from "../Themed";
import { StyleSheet} from "react-native";
import AsyncButton from "../AsyncButton";
import { useAuth } from "../../contexts/authContext";
import { addAlbumToPlaylist } from "../../api";
import { usePlaybackContext } from "../../hooks/usePlaybackContext";
import { Album } from "../../interfaces/Album";

interface PlaylistButtonsProps {
    playlistId: string;
    playlistUri: string;
    album: Album;
    associatedPlaylists: Playlist[];
}

const PlaylistButtons: FC<PlaylistButtonsProps> = ({playlistId, playlistUri, album, associatedPlaylists}) => {
    const { authorizedRequest } = useAuth()
    const { resumeItem } = usePlaybackContext();
    
    const handlePlayClick = async () => {
        resumeItem({id: album.id, context_uri: playlistUri })
        await resumeItem({context_uri: playlistUri, id: album.id })
    }
    return (
        <View style={styles.container}>
            <AsyncButton text={"Play Album"} onPressAsync={handlePlayClick}/>
            {associatedPlaylists.map((playlist) => 
                <AsyncButton 
                    key={playlist.id} 
                    text={`Add to ${playlist.name}`} 
                    onPressAsync={async () => {await authorizedRequest(addAlbumToPlaylist(playlist.id, album.id))}} 
                />
            )}
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        display: "flex",
        flexDirection: "column",
        alignContent: "flex-start"
    }
})

export default PlaylistButtons