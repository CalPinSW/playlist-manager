import { StyleSheet, useColorScheme } from 'react-native';
import { Album } from '../../../interfaces/Album';
import Colors from '../../../constants/Colors';
import { View, Text } from '../../Themed';
import AlbumIcon from '../../../assets/icons/AlbumIcon';
import ArtistIcon from '../../../assets/icons/ArtistIcon';
import { renderArtistList } from '../../../utils/album/renderArtistList';

const AlbumInfo: React.FC<Album> = (album) => {
    const colorScheme = Colors[useColorScheme() ?? 'light']
    const backgroundColor = colorScheme.background.offset
    const iconColour = colorScheme.primary.default
    return (                
        <View noBackground style={styles.absoluteContainer}>
          <View noBackground style={[styles.infoContainer, {backgroundColor}]}>
            <View noBackground style={styles.infoRow}>
              <AlbumIcon color={iconColour} />
              <Text 
                  style={styles.infoText} 
                  noBackground
              >
                  {album.name}
              </Text>
            </View>
            <View noBackground style={styles.infoRow}>
              <ArtistIcon color={iconColour} />
              <Text 
                  style={styles.infoText} 
                  noBackground
              >
                  {renderArtistList(album.artists)}
              </Text>
            </View>
          </View>
        </View>
  )
}


const styles = StyleSheet.create({
    absoluteContainer: {display: "flex", position: "absolute", zIndex: 30, padding: 5},
    infoContainer: {display: "flex", alignSelf:"flex-start", padding: 10, borderRadius: 10, gap: 10, opacity: 0.85},
    infoRow: { display: 'flex', flexDirection: "row", gap: 10, alignItems: "center", maxWidth: "100%"},
    infoText: { display: "flex", flexShrink: 1 },
});

export default AlbumInfo