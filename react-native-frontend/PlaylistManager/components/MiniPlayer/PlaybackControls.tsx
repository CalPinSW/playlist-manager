import { StyleSheet, TouchableOpacity } from 'react-native';
import { FC } from "react";
import { useColorTheme } from "../../hooks/useColorTheme";
import { View, Text } from "../Themed";
import { Ionicons } from '@expo/vector-icons';
import { usePlaybackContext } from '../../hooks/usePlaybackContext';
import TrackIcon from '../../assets/icons/TrackIcon';
import ArtistIcon from '../../assets/icons/ArtistIcon';

const PlaybackControls: FC = () => {
    const { playbackInfo, pauseOrPlay} = usePlaybackContext()
    const theme = useColorTheme()
    const handlePausePlayClick = async (): Promise<void> => {
        pauseOrPlay?.()
    }
    if (!playbackInfo) return null

    return (
        <View noBackground style={styles.container}>
            <View style={styles.songAndArtist}>
            <View style={styles.playbackIconAndText}>
                <TrackIcon color={theme.primary.lighter} height={25} width={25} />
                <Text noBackground style={styles.playbackText}>{playbackInfo.track_title}</Text>
            </View>
            <View style={styles.playbackIconAndText}>
                <Text noBackground style={styles.playbackText}>{playbackInfo.track_artists.join(", ")}</Text>
                <ArtistIcon color={theme.primary.lighter} height={25} width={25} />
            </View>
            </View>
            <View noBackground style={styles.playbackControls}>
                <TouchableOpacity>
                    <Ionicons cons size={28} name="play-back" color={theme.text.primary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => {void handlePausePlayClick()}}>
                    <Ionicons cons size={28} name="play" color={theme.text.primary} />
                </TouchableOpacity>
                <TouchableOpacity>
                    <Ionicons cons size={28} name="play-forward" color={theme.text.primary} />
                </TouchableOpacity>
            </View>
      </View>

    )
  };
  
  const styles = StyleSheet.create({
    container: {
        width: "100%"
    },
    playbackControls: {
        width: "100%",
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        margin: 20
    },
      songAndArtist: {
        display: "flex",
        margin: 4,
        flexDirection: "row",
        justifyContent: "space-between"
      },
      playbackIconAndText: {
        alignContent: "center",
        display: "flex",
        gap: 6,
        flexDirection: "row",
      },
      playbackText: {
        textAlignVertical: "center"
      }
  });

  export default PlaybackControls;
