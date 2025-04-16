import React, { useEffect, useState } from "react";
import { StyleSheet, View, Image, TouchableWithoutFeedback, FlatList, Dimensions, useColorScheme } from "react-native";
import {Text} from '../Themed'
import Animated, { useSharedValue, useAnimatedStyle, withTiming, useEvent } from "react-native-reanimated";
import { BlurView } from "expo-blur";
import { Album } from "../../interfaces/Album";
import { renderArtistList } from "../../utils/album/renderArtistList";
import Colors from "../../constants/Colors";
import AlbumIcon from "../../assets/icons/AlbumIcon";
import ArtistIcon from "../../assets/icons/ArtistIcon";

interface AlbumSlideProps {
    album: Album;
    isSelected: boolean;
    onPress: () => void;
  }
  
const AlbumSlide: React.FC<AlbumSlideProps> = ({ album, isSelected, onPress }) => {
  const rotation = useSharedValue(0);

  useEffect(() => {
      rotation.value = withTiming(isSelected ? 180 : 0, { duration: 500 });
  }, [isSelected]);
  
  const frontStyle = useAnimatedStyle(() => {
      return {transform: [{ rotateY: `${rotation.value}deg` }]}
  });

  const backStyle = useAnimatedStyle(() => {
      return {transform: [{ rotateY: `${rotation.value-180}deg` }]}
  });

  return (
    <TouchableWithoutFeedback onPress={onPress}>
          
      <View style={{ margin: 10 }}>
        <Animated.View style={[{ backfaceVisibility: "hidden" }, frontStyle]}>
          <Image source={{ uri: album.image_url }} style={{ width: "100%", aspectRatio: 1, borderRadius: 10 }} />
        </Animated.View>
        <Animated.View
          style={[
            {
              position: "absolute",
              width: "100%", 
              aspectRatio: 1,
              backfaceVisibility: "hidden",
            },
            backStyle,
          ]}
        >
          <BlurView intensity={10} style={{...StyleSheet.absoluteFillObject, overflow: 'hidden', zIndex: 20, borderRadius: 10}} />
          <Image source={{ uri: album.image_url }} style={{ width: "100%", aspectRatio: 1, borderRadius: 10, transform: [{rotateY: "180deg"}] }} />
          <AlbumInfo {...album}/>
        </Animated.View>
      </View>
    </TouchableWithoutFeedback>
  );
};


const AlbumInfo: React.FC<Album> = (album) => {
    const colorScheme = Colors[useColorScheme() ?? 'light']
    const backgroundColor = colorScheme.background.offset
    const iconColour = colorScheme.primary.darker
    return (                
        <View style={{position: "absolute", zIndex: 30, padding: 5, maxWidth: "100%"}}>
          <View style={{alignSelf:"flex-start", backgroundColor, borderRadius: 10, padding: 10, gap: 10, maxWidth: "100%"}}>
            <View style={{ display: 'flex', flexDirection: "row", gap: 10, alignItems: "center", maxWidth: "100%"}}>
              <AlbumIcon color={iconColour} />
              <Text 
                  style={{ display: "flex", wordWrap: "wrap" }} 
                  noBackground
              >
                  {album.name}
              </Text>
            </View>
            <View style={{ display: 'flex', flexDirection: "row", gap: 10, alignItems: "center", maxWidth: "100%"}}>
              <ArtistIcon color={iconColour} />
              <View style={{maxWidth: "100%",}}>
              <Text 
                  style={{ display: "flex", wordWrap: "wrap"}} 
                  noBackground
              >
                  {renderArtistList(album.artists)}
              </Text>
              </View>
            </View>
          </View>
        </View>
  )
}

export default AlbumSlide;
