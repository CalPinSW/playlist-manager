import React, { useState } from "react";
import { Image, StyleSheet, View } from "react-native";

interface ImageWithFallbackProps {
  src?: string;
  alt?: string; // Not used in React Native, kept for compatibility
  fallback: React.ReactNode;
  style?: object;
}

const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({ src, fallback, style }) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  return (
    <View style={[styles.container, style]}>
      {isLoading && !hasError && <View style={styles.fallback}>{fallback}</View>}
      {!hasError && src && (
        <Image
          source={{ uri: src }}
          style={[style, isLoading && { display: "none" }]}
          onLoad={handleLoad}
          onError={handleError}
          resizeMode="cover" // Matches the behavior of object-fit: cover
        />
      )}
      {hasError && <View style={styles.fallback}>{fallback}</View>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "relative",
  },
  fallback: {
    position: "absolute",
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
});

export default ImageWithFallback;
