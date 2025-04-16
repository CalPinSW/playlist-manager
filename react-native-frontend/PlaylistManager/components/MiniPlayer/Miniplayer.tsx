import { StyleSheet } from 'react-native';
import React, { useState, useMemo, useRef, FC } from "react";
import { Image } from "react-native";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { pauseOrStartPlayback } from "../../api";
import { useColorTheme } from '../../hooks/useColorTheme';
import { View, Text } from '../Themed';
import PlaybackProgressCircle from './PlaybackProgressCircle';
import { PlaybackInfo } from '../../interfaces/PlaybackInfo';
import TrackIcon from '../../assets/icons/TrackIcon';
import { usePlaybackContext } from '../../hooks/usePlaybackContext';


const MiniPlayer = () => {
    const { playbackInfo } = usePlaybackContext();
    const theme = useColorTheme()
    const handlePausePlayClick = (): void => {
      pauseOrStartPlayback()
    }
    const [activeSnapPoint, setActiveSnapPoint] = useState(0);
    const onChange = (index: number) => {
      setActiveSnapPoint(index)
    }
    const bottomSheetRef = useRef<BottomSheet>(null);

    const snapPoints = useMemo(() => ["20%", "40%"], []);

    if (!playbackInfo) return null;
    return (
        <BottomSheet
          ref={bottomSheetRef}
          snapPoints={snapPoints}
          onChange={onChange}
          enableDynamicSizing={false}
          backgroundStyle={{backgroundColor: theme.background.offset}}
        >
        <BottomSheetView style={[styles.contentContainer]}>
          {activeSnapPoint ? <MiniPlayerMaximized playbackInfo={playbackInfo} /> : <MiniPlayerMinimized playbackInfo={playbackInfo} />}
        </BottomSheetView>
        </BottomSheet>
    );
};

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
  },
  miniPlayer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 5,
  },
  columns: {
    display: "flex",
    flexDirection: "row"
  },
  rows: {
    display: "flex",
    flexDirection: "row",
    gap: 20
  },
  artwork: {
    borderRadius: 5,
  },
  info: {
    display: "flex",
    flex: 1,
    gap: 10,
    flexDirection: "column",
    alignContent: "center"
  },
  icons: {
    width: "100%",
    display: "flex",
    justifyContent: "center",
    gap: 10,
    flexDirection: "row"
  },
  title: {
    textAlign: "center",
    fontSize: 14,
  },
  artist: {
    fontSize: 14,
  },
  expandedContainer: {
    alignItems: "center",
    padding: 20,
  },
  largeArtwork: {
    width: 150,
    height: 150,
    borderRadius: 10,
  },
});

export default MiniPlayer;

interface MiniPlayerPresentationalProps {
  playbackInfo: PlaybackInfo
}

const MiniPlayerMinimized: FC<MiniPlayerPresentationalProps> = ({playbackInfo}) => {
  const theme = useColorTheme()
  return (
    <View noBackground style={styles.miniPlayer}>
      <View noBackground style={styles.rows}>
        <View noBackground style={styles.info}>
          <View noBackground style={styles.icons}>
            <TrackIcon color={theme.primary.darker} height={50} width={50} />
            <PlaybackProgressCircle 
              progress={playbackInfo.track_progress / playbackInfo.track_duration} 
            />
          </View>
          <Text noBackground style={styles.title}>{playbackInfo.track_title}</Text>
        </View>
        <View noBackground style={styles.info}>
          <View noBackground style={styles.icons}>
            <Image source={{ uri: playbackInfo.artwork_url }} style={styles.artwork} height={50} width={50} />
            <PlaybackProgressCircle 
              progress={playbackInfo.album_progress / playbackInfo.album_duration} 
            />
          </View>
          <Text noBackground style={styles.title}>{playbackInfo.album_title}</Text>
        </View>
        {playbackInfo.playlist && 
          <View noBackground style={styles.info}>
            <View noBackground style={styles.icons}>
              <Image source={{ uri: playbackInfo.playlist.artwork_url }} style={styles.artwork} height={50} width={50} />
            <PlaybackProgressCircle 
                progress={playbackInfo.playlist.progress / playbackInfo.playlist.duration} 
              />
            </View>
            <Text noBackground style={styles.title}>{playbackInfo.playlist.title}</Text>
            
          </View>
        } 
      </View>
  </View>
  )
}

const MiniPlayerMaximized: FC<MiniPlayerPresentationalProps> = ({playbackInfo}) => {
  return (
    <View noBackground style={styles.miniPlayer}>
            <View noBackground style={styles.columns}>
              <View noBackground style={styles.rows}>
                <Image source={{ uri: playbackInfo.artwork_url }} style={styles.artwork} />
                <Text noBackground style={styles.artist}>{playbackInfo.track_artists.join(", ")}</Text>
              </View>
              <View noBackground style={styles.rows}>
                <View noBackground style={styles.info}>
                  <Text noBackground style={styles.title}>{playbackInfo.track_title}</Text>
                  <PlaybackProgressCircle 
                    progress={playbackInfo.track_progress / playbackInfo.track_duration} 
                  />
                </View>
                <View noBackground style={styles.info}>
                  <Text noBackground style={styles.title}>{playbackInfo.album_title}</Text>
                  <PlaybackProgressCircle 
                    progress={playbackInfo.album_progress / playbackInfo.album_duration} 
                  />
                </View>
                {playbackInfo.playlist && 
                  <View noBackground style={styles.info}>
                    <Text noBackground style={styles.title}>{playbackInfo.playlist.title}</Text>
                    <PlaybackProgressCircle 
                      progress={playbackInfo.playlist.progress / playbackInfo.playlist.duration} 
                    />
                  </View>
                } 
              </View>
            </View>
          </View>
  )
};
