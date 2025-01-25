import React, { FC } from "react";
import PlaylistIcon from "./PlaylistIcon";
import ImageWithFallback from "./ImageWithFallback"; // Ensure compatibility with React Native
import { Link, } from "expo-router";
import { Playlist } from "../../interfaces/Playlist";
import { View, Text, StyleSheet } from "react-native";

interface PlaylistSlideProps {
  playlist?: Playlist
}

const PlaylistSlide: FC<PlaylistSlideProps> = ({playlist}) => {
  return (
    <Link
      href={playlist ? {
        pathname: '/playlist/[id]',
        params: { id: playlist.id },
      } : "/"}
      style={styles.container}
    >
      <ImageWithFallback
        style={styles.image}
        src={playlist?.image_url}
        alt={playlist?.name}
        fallback={
          <PlaylistIcon />
        }
      />
      <View style={styles.textContainer}>
        <Text style={styles.text}>
          {playlist ? playlist.name : "playlist"}
        </Text>
      </View>
    </Link>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    width: 128, // Approx. 32rem converted to pixels
    marginVertical: 8,
    marginHorizontal: 4,
  },
  image: {
    width: 128,
    height: 128,
    borderRadius: 8,
    resizeMode: "cover",
    backgroundColor: "#f0f0f0", // Fallback background color
  },
  icon: {
    width: 128,
    height: 128,
    borderRadius: 8,
    backgroundColor: "#e6e6e6", // Matches the "bg-background-offset" class
    color: "#007aff", // Matches the "fill-primary" class
  },
  textContainer: {
    paddingHorizontal: 8,
    maxWidth: 128,
    marginTop: 4,
    alignItems: "center",
  },
  text: {
    textAlign: "center",
    color: "#000", // Default text color
  },
});

export default PlaylistSlide;
