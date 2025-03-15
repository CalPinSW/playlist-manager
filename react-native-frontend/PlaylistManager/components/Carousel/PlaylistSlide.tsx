import { Link } from "expo-router"
import { Playlist } from "../../interfaces/Playlist"
import FallbackImage from "../ImageWithFallback"
import { View, Text } from "../Themed"
import { Pressable } from "react-native"

interface Props {
    playlist: Playlist
}

const PlaylistSlide: React.FC<Props> = ({playlist}) => {
    return (
        <Link style={{display: "flex", height:"100%"}} href={`/playlist/${playlist.id}`} asChild>
            <Pressable>
                <View 
                    style={{
                        display: "flex",
                        flex: 1,
                        justifyContent: 'flex-start',
                    }}>
                    <FallbackImage style={{ width: "100%",aspectRatio: 1, objectFit: "fill"}} source={playlist.image_url ? {uri: playlist.image_url} : undefined} />
                </View>
                <Text style={{ display: "flex", wordWrap: "wrap", textAlign: "center" }} noBackground>{playlist.name}</Text>
            </Pressable>
        </Link>
    );
}

export default PlaylistSlide