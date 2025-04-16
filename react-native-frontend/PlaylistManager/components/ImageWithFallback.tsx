import React, { useState } from "react";
import { StyleSheet, ImageSourcePropType, StyleProp, ViewStyle, ImageProps, Image, View, ViewProps, ImageStyle, useColorScheme } from "react-native";
import PlaylistIcon from "../assets/icons/PlaylistIcon";
import Colors from "../constants/Colors";

interface Props extends ImageProps {
    source: ImageSourcePropType | undefined;
    viewStyle?: StyleProp<ViewStyle> 
    imageStyle?: StyleProp<ImageStyle> 
} 

const ImageWithFallback: React.FC<Props> = ({ source, viewStyle, imageStyle, ...props }) => {
  const [imageError, setImageError] = useState(false);
  const fallbackColour = Colors[useColorScheme() ?? 'light'].primary.default
  const fallbackBackgroundColour = Colors[useColorScheme() ?? 'light'].background.offset
  
  return (
    <View style={viewStyle} >
      {!imageError && source ? (
        <Image
          source={source}
          style={[StyleSheet.absoluteFillObject, imageStyle]}
          onError={() => setImageError(true)} // Handle error and trigger fallback
          resizeMode="contain"
          {...props}
        />
      ) : (
        <PlaylistIcon viewStyle={{backgroundColor: fallbackBackgroundColour, borderRadius: 10}} width={"100%"} height={"100%"} color={fallbackColour} />
      )}
    </View>
  );
};

export default ImageWithFallback;
