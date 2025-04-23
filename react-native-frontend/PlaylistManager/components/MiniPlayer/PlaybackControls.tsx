import { StyleSheet, TouchableOpacity, Image } from 'react-native';
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
        <View style={[styles.container, {backgroundColor: theme.background.default}]}>
            <Image source={{ uri: playbackInfo.artwork_url }} style={styles.artwork}/>
            <View noBackground style={styles.songAndArtist}>
                <View noBackground style={styles.playbackIconAndText}>
                    <TrackIcon color={theme.primary.lighter} height={25} width={25} />
                    <Text noBackground style={styles.playbackText}>{playbackInfo.track_title}</Text>
                </View>
                <View noBackground style={styles.playbackIconAndText}>
                    <ArtistIcon color={theme.primary.lighter} height={25} width={25} />
                    <Text noBackground style={styles.playbackText}>{playbackInfo.track_artists.join(", ")}</Text>
                </View>
            </View>
            <View noBackground style={styles.playbackControls}>
                <TouchableOpacity onPress={() => {void handlePausePlayClick()}}>
                    <Ionicons cons size={28} name="play-back" color={theme.text.primary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => {void handlePausePlayClick()}}>
                    {playbackInfo.is_playing ? 
                        <Ionicons cons size={28} name="pause" color={theme.text.primary} /> 
                        :
                        <Ionicons cons size={28} name="play" color={theme.text.primary} />
                    }
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
        width: "100%",
        borderRadius: 8,
    },
    artwork: {
        position: "absolute",
        borderRadius: 8,
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        resizeMode: "cover",
        opacity: 0.1
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
        gap: 10,
        margin: 4,
        flexDirection: "column",
        justifyContent: "space-between"
      },
      playbackIconAndText: {
        alignContent: "center",
        display: "flex",
        gap: 6,
        flexDirection: "row",
      },
      playbackText: {
        flexShrink: 1,
        textAlignVertical: "center"
      }
  });

  export default PlaybackControls;
