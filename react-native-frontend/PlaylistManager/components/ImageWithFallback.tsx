import React, { useState } from "react";
import { Image, View, StyleSheet, ImageSourcePropType } from "react-native";
import PlaylistIcon from "../assets/icons/PlaylistIcon";

const FallbackImage = ({ source, style }: { source: ImageSourcePropType | undefined; style?: any }) => {
  const [imageError, setImageError] = useState(false);

  return (
    <View style={style}>
      {!imageError && source ? (
        <Image
          source={source}
          style={StyleSheet.absoluteFillObject} // Ensures the image takes full container space
          onError={() => setImageError(true)} // Handle error and trigger fallback
          resizeMode="contain"
        />
      ) : (
        <PlaylistIcon width={style?.width} height={style?.height} fill="gray" />
      )}
    </View>
  );
};

export default FallbackImage;
