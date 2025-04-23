import React, { useEffect } from "react";
import { Image, Pressable, StyleSheet } from "react-native";
import { View} from '../../Themed'
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from "react-native-reanimated";
import { Album } from "../../../interfaces/Album";
import AlbumInfo from "./AlbumInfo";

interface AlbumSlideProps {
    album: Album;
    isSelected: boolean;
    onPress: () => void;
  }
  
const AlbumSlide: React.FC<AlbumSlideProps> = ({ album, isSelected, onPress }) => {
  const rotation = useSharedValue(0);

  useEffect(() => {
      rotation.value = withTiming(isSelected ? 180 : 0, { duration: 300 });
  }, [isSelected]);
  
  const frontStyle = useAnimatedStyle(() => {
      return {transform: [{ rotateY: `${rotation.value}deg` }]}
  });

  const backStyle = useAnimatedStyle(() => {
      return {transform: [{ rotateY: `${rotation.value-180}deg` }]}
  });

  return (
    <Pressable onPress={onPress}>
      <View noBackground style={styles.albumContainer}>
        <Animated.View style={[styles.albumFront, frontStyle]}>
          <Image source={{ uri: album.image_url }} style={styles.albumImage} />
        </Animated.View>
        <Animated.View
          style={[styles.albumBack,backStyle]}
        >
          <Image source={{ uri: album.image_url }} style={[styles.albumImage, { transform: [{rotateY: "180deg"}] }]} />
          <AlbumInfo {...album}/>
        </Animated.View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  albumContainer: { margin: 10 },
  albumFront: { backfaceVisibility: "hidden" },
  albumImage: { width: "100%", aspectRatio: 1, borderRadius: 10 },
  albumBack: {
    position: "absolute",
    width: "100%", 
    aspectRatio: 1,
    backfaceVisibility: "hidden",
  }
});

export default AlbumSlide;
