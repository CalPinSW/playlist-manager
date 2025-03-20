import { StyleSheet } from 'react-native';
import React, { useState, useCallback, useMemo, useRef } from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";
import BottomSheet from "@gorhom/bottom-sheet";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { usePlaybackContext } from "../../hooks/usePlaybackContext";
import { pauseOrStartPlayback } from "../../api";
import { renderArtistList } from '../../utils/album/renderArtistList';

const MiniPlayer = () => {
    const { playbackInfo } = usePlaybackContext();
    console.log(playbackInfo)
    if (!playbackInfo) return null;
  
    const handlePausePlayClick = (): void => {
      pauseOrStartPlayback()
    }
  
    const bottomSheetRef = useRef<BottomSheet>(null);

    // Define the snap points for the bottom sheet
    const snapPoints = useMemo(() => ["10%", "50%"], []);

    // Function to handle expanding the bottom sheet
    const handleExpand = useCallback(() => {
    bottomSheetRef.current?.expand();
    }, []);

    return (
    <GestureHandlerRootView style={{ flex: 1 }}>
        <BottomSheet ref={bottomSheetRef} index={0} snapPoints={snapPoints}>
        {/* Collapsed Mini Player */}
        <TouchableOpacity onPress={handleExpand} style={styles.miniPlayer}>
            <Image source={{ uri: playbackInfo.artwork_url }} style={styles.artwork} />
            <View style={styles.info}>
            <Text style={styles.title}>{playbackInfo.album_title}</Text>
            <Text style={styles.artist}>{playbackInfo.track_artists.join(", ")}</Text>
            </View>
        </TouchableOpacity>

        {/* Expanded Player */}
        <View style={styles.expandedContainer}>
            <Image source={{ uri: playbackInfo.artwork_url }} style={styles.artwork} />
            <Text style={styles.title}>{playbackInfo.album_title}</Text>
            <Text style={styles.artist}>{playbackInfo.track_artists.join(", ")}</Text>
        </View>
        </BottomSheet>
    </GestureHandlerRootView>
    );
};

const styles = StyleSheet.create({
  miniPlayer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
  },
  artwork: {
    width: 50,
    height: 50,
    borderRadius: 5,
  },
  info: {
    marginLeft: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
  },
  artist: {
    fontSize: 14,
    color: "gray",
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
