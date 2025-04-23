import { Link } from "expo-router"
import { Playlist } from "../../interfaces/Playlist"
import ImageWithFallback from "../ImageWithFallback"
import { View, Text } from "../Themed"
import { Pressable } from "react-native"

interface Props {
    playlist: Playlist
}

const PlaylistSlide: React.FC<Props> = ({playlist}) => {
    return (
        <Link style={{display: "flex", gap: 10}} href={{pathname: `/playlist/[id]`, params: {id: playlist.id, name: playlist.name, uri: playlist.uri}}} asChild>
            <Pressable>
                <View 
                    style={{
                        display: "flex",
                        justifyContent: 'flex-start',
                        borderRadius: 10
                    }}
                >
                    <ImageWithFallback
                        viewStyle={{ width: "100%", aspectRatio: 1}} 
                        imageStyle={{borderRadius: 10}}
                        source={playlist.image_url ? {uri: playlist.image_url} : undefined} 
                    />
                </View>
                <Text style={{ display: "flex", wordWrap: "wrap", textAlign: "center" }} noBackground>{playlist.name}</Text>
            </Pressable>
        </Link>
    );
}

export default PlaylistSlide;
