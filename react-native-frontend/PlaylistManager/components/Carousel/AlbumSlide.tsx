import FallbackImage from "../ImageWithFallback"
import { View, Text } from "../Themed"
import { Pressable } from "react-native"
import { Album } from "../../interfaces/Album"

interface Props {
    album: Album
}

const AlbumSlide: React.FC<Props> = ({album}) => {
    return (
        <View style={{display: "flex", justifyContent: 'flex-start',  height: "100%", width: "100%"}} >
            <View 
                style={{
                    display: "flex",
                    flex: 1,
                    justifyContent: 'flex-start',
                }}>
                <FallbackImage style={{ width: "100%", aspectRatio: 1, objectFit: "fill"}} source={album.image_url ? {uri: album.image_url} : undefined} />
            </View>
            <Text style={{ display: "flex", wordWrap: "wrap", textAlign: "center", alignSelf: "flex-start", marginTop: 0 }} noBackground>{album.name}</Text>
        </View>
    );
}

export default AlbumSlide