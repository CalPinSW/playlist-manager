import { StyleSheet } from 'react-native';
import React, { useState, useMemo, useRef, FC } from "react";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { useColorTheme } from '../../hooks/useColorTheme';
import { View, Text } from '../Themed';
import PlaybackProgressCircle from './PlaybackProgressCircle';
import { PlaybackInfo } from '../../interfaces/PlaybackInfo';
import TrackIcon from '../../assets/icons/TrackIcon';
import PlaybackControls from './PlaybackControls';
import { usePlaybackContext } from '../../hooks/usePlaybackContext';
import ExpandableImage from '../ExpandableImage';

const MiniPlayer = () => {
    const { playbackInfo } = usePlaybackContext();
    const theme = useColorTheme()
    const snapPoints = useMemo(() => [150, 320], []);
    const [activeSnapPoint, setActiveSnapPoint] = useState(0);

    const onChange = (index: number) => {
      setActiveSnapPoint(index)
    }
    const bottomSheetRef = useRef<BottomSheet>(null);


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
            <MiniPlayerContent playbackInfo={playbackInfo} activeSnapPoint={activeSnapPoint} />
          </BottomSheetView>
        </BottomSheet>
    );
};

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
  },
  miniPlayer: {
    display: 'flex',
    height: '100%',
    flexDirection: "column",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 5,
  },
  rows: {
    display: "flex",
    flexDirection: "row",
    gap: 20
  },
  playbackControls: {
    display: 'flex',
    marginHorizontal: 40,
    marginVertical: 20,
    borderRadius: 5,
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
});

export default MiniPlayer;

interface MiniPlayerContentProps {
  playbackInfo: PlaybackInfo;
  activeSnapPoint: number;
}

const MiniPlayerContent: FC<MiniPlayerContentProps> = ({playbackInfo, activeSnapPoint}) => {
  const theme = useColorTheme()
  return (
    <View noBackground style={styles.miniPlayer}>
      <View noBackground style={styles.rows}>
        <View noBackground style={styles.info}>
          <View noBackground style={styles.icons}>
            <TrackIcon color={theme.primary.lighter} height={50} width={50} />
            <PlaybackProgressCircle 
              progress={playbackInfo.track_progress / playbackInfo.track_duration} 
              animation={playbackInfo.is_playing ? {duration: 1600} : undefined}
            />
          </View>
          <Text noBackground style={styles.title}>{playbackInfo.track_title}</Text>
        </View>
        {playbackInfo.type == "track" && 
        <View noBackground style={styles.info}>
          <View noBackground style={styles.icons}>
            <ExpandableImage source={{ uri: playbackInfo.artwork_url }} style={styles.artwork} height={50} width={50} />
            <PlaybackProgressCircle 
              progress={playbackInfo.album_progress / playbackInfo.album_duration} 
              animation={playbackInfo.is_playing ? {duration: 2400} : undefined}
            />
          </View>
          <Text noBackground style={styles.title}>{playbackInfo.album_title}</Text>
        </View>
}
        {playbackInfo.playlist && 
          <View noBackground style={styles.info}>
            <View noBackground style={styles.icons}>
              <ExpandableImage source={{ uri: playbackInfo.playlist.artwork_url }} style={styles.artwork} height={50} width={50} />
            <PlaybackProgressCircle 
                progress={playbackInfo.playlist.progress / playbackInfo.playlist.duration} 
                animation={playbackInfo.is_playing ? {duration: 3200} : undefined}
              />
            </View>
            <Text noBackground style={styles.title}>{playbackInfo.playlist.title}</Text>
          </View>
        } 
      </View>
      <View style={styles.playbackControls}>
        <PlaybackControls />
      </View>
    </View>
  )
}
